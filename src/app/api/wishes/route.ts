
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const createWishSchema = z.object({
  recipientName: z.string().trim().min(1).max(100),
  recipientEmail: z.union([
    z.string().trim().email().max(255),
    z.literal(""),
  ]).optional(),
  birthdayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  secretMessage: z.string().trim().min(1).max(5000),
  questions: z.array(
    z.object({
      question: z.string().trim().min(1).max(200),
      answer: z.string().trim().min(1).max(200),
    })
  ).min(1).max(10),
});

export async function POST(request: Request) {
  try {
    // 1. Verify the logged-in user
    const supabase = await createClient();

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

    // 2. Validate incoming data
    const body = await request.json();
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

    // 3. Validate the actual calendar date
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

    // 4. Hash all answers on the server
    const hashedQuestions = await Promise.all(
      questions.map(async (item, index) => ({
        question_text: item.question,
        answer_hash: await hash(item.answer, 12),
        sort_order: index,
      }))
    );

    // 5. Generate a unique, unguessable sharing slug
    const slug = randomBytes(16).toString("hex");

    // 6. Create the birthday wish
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .insert({
        user_id: user.id,
        recipient_name: recipientName,
        recipient_email: recipientEmail || null,
        birthday_date: birthdayDate,
        secret_message: secretMessage,
        slug,
        is_published: false,
      })
      .select("id, slug")
      .single();

    if (wishError || !wish) {
      console.error("WISH CREATION ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to create your birthday wish." },
        { status: 500 }
      );
    }

    // 7. Save the questions and their hashes
    const questionsToInsert = hashedQuestions.map((item) => ({
      ...item,
      wish_id: wish.id,
    }));

    const { error: questionsError } = await supabase
      .from("wish_questions")
      .insert(questionsToInsert);

    if (questionsError) {
      console.error("QUESTION SAVE ERROR:", questionsError);

      // Roll back the wish if questions could not be saved
      await supabase
        .from("birthday_wishes")
        .delete()
        .eq("id", wish.id);

      return NextResponse.json(
        { error: "Unable to save your secret questions." },
        { status: 500 }
      );
    }

    // 8. Return only safe information
    return NextResponse.json(
      {
        success: true,
        message: "Birthday wish details saved successfully.",
        wish: {
          id: wish.id,
          slug: wish.slug,
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
