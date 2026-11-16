import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const celebrationEffectSchema = z.enum([
  "confetti",
  "hearts",
  "sparkles",
  "fireworks",
  "petals",
]);

const createWishSchema = z.object({
  recipientName: z.string().trim().min(1).max(100),

  recipientEmail: z
    .union([
      z.string().trim().email().max(255),
      z.literal(""),
    ])
    .optional(),

  birthdayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

  secretMessage: z.string().trim().min(1).max(5000),

  questions: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(200),
        answer: z.string().trim().min(1).max(200),
      })
    )
    .min(1)
    .max(10),

  // Multiple celebration effects selected by the creator.
  celebrationEffects: z
    .array(celebrationEffectSchema)
    .min(1)
    .max(5)
    .optional(),

  // Backward compatibility with older clients.
  celebrationEffect: celebrationEffectSchema.optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Check authentication.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to create a birthday wish." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validation = createWishSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Please check your birthday wish details.",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      recipientName,
      recipientEmail,
      birthdayDate,
      secretMessage,
      questions,
    } = validation.data;

    // 3. Normalize selected effects and remove duplicates.
    const selectedEffects = [
      ...new Set(
        validation.data.celebrationEffects?.length
          ? validation.data.celebrationEffects
          : [validation.data.celebrationEffect ?? "confetti"]
      ),
    ];

    // 4. Validate that the date is a real calendar date.
    const parsedDate = new Date(`${birthdayDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== birthdayDate
    ) {
      return NextResponse.json(
        { error: "Please provide a valid birthday date." },
        { status: 400 }
      );
    }

    // 5. Hash secret answers before saving them.
    const hashedQuestions = await Promise.all(
      questions.map(async (item, index) => ({
        question_text: item.question,
        answer_hash: await hash(item.answer, 12),
        sort_order: index,
      }))
    );

    // 6. Generate a private, unguessable wish slug.
    const slug = randomBytes(16).toString("hex");

    // 7. Save the birthday wish.
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .insert({
        user_id: user.id,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        birthday_date: birthdayDate,
        secret_message: secretMessage,

        // Keep the first selected effect for older code.
        celebration_effect: selectedEffects[0],

        // Save all selected effects.
        celebration_effects: selectedEffects,

        slug,
        is_published: false,
      })
      .select("id, slug, celebration_effect, celebration_effects")
      .single();

    if (wishError || !wish) {
      console.error("WISH CREATION ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to create your birthday wish." },
        { status: 500 }
      );
    }

    // 8. Save the hashed secret questions.
    const questionsToInsert = hashedQuestions.map((item) => ({
      ...item,
      wish_id: wish.id,
    }));

    const { error: questionsError } = await supabase
      .from("wish_questions")
      .insert(questionsToInsert);

    // Roll back the wish if its questions could not be saved.
    if (questionsError) {
      console.error("QUESTION SAVE ERROR:", questionsError);

      const { error: rollbackError } = await supabase
        .from("birthday_wishes")
        .delete()
        .eq("id", wish.id);

      if (rollbackError) {
        console.error("WISH ROLLBACK ERROR:", rollbackError);
      }

      return NextResponse.json(
        { error: "Unable to save your secret questions." },
        { status: 500 }
      );
    }

    // 9. Return the saved wish details.
    return NextResponse.json(
      {
        success: true,
        message: "Birthday wish details saved successfully.",
        wish: {
          id: wish.id,
          slug: wish.slug,
          celebrationEffect: wish.celebration_effect,
          celebrationEffects: wish.celebration_effects,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE WISH API ERROR:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
