
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const verifySchema = z.object({
  answers: z.array(
    z.string().trim().min(1).max(200)
  ).min(1).max(10),
});

// Temporary development rate limiter.
// Use a persistent shared rate limiter before production.
const attempts = new Map<
  string,
  { count: number; resetAt: number }
>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const SIGNED_URL_SECONDS = 300;

function getRateLimitKey(request: Request, slug: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  return `${slug}:${ip}`;
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    if (!slug || !/^[a-f0-9]{32}$/i.test(slug)) {
      return NextResponse.json(
        { error: "Invalid birthday wish link." },
        { status: 400 }
      );
    }

    // 1. Rate limit verification attempts
    const rateLimitKey = getRateLimitKey(request, slug);
    const now = Date.now();

    let current = attempts.get(rateLimitKey);

    if (!current || current.resetAt <= now) {
      current = {
        count: 0,
        resetAt: now + WINDOW_MS,
      };
    }

    if (current.count >= MAX_ATTEMPTS) {
      attempts.set(rateLimitKey, current);

      return NextResponse.json(
        {
          error: "Too many attempts. Please try again in 15 minutes.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((current.resetAt - now) / 1000)
            ),
          },
        }
      );
    }

    // 2. Validate submitted answers
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Please provide valid answers." },
        { status: 400 }
      );
    }

    const { answers } = validation.data;

    // 3. Initialize Supabase
    const supabase = await createClient();

    // 4. Retrieve only a published wish
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .select("id, secret_message")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (wishError) {
      console.error("VERIFY WISH LOOKUP ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to verify this birthday wish." },
        { status: 500 }
      );
    }

    if (!wish) {
      return NextResponse.json(
        { error: "Birthday wish not found or not published." },
        { status: 404 }
      );
    }

    // 5. Retrieve answer hashes on the server only
    const { data: questions, error: questionsError } =
      await supabase
        .from("wish_questions")
        .select("answer_hash, sort_order")
        .eq("wish_id", wish.id)
        .order("sort_order", { ascending: true });

    if (questionsError || !questions) {
      console.error(
        "VERIFY QUESTIONS ERROR:",
        questionsError
      );

      return NextResponse.json(
        { error: "Unable to verify the secret answers." },
        { status: 500 }
      );
    }

    if (
      questions.length === 0 ||
      answers.length !== questions.length
    ) {
      current.count += 1;
      attempts.set(rateLimitKey, current);

      return NextResponse.json(
        { error: "The answers are incorrect. Please try again." },
        { status: 401 }
      );
    }

    // 6. Compare every answer with its bcrypt hash
    const comparisons = await Promise.all(
      questions.map((question, index) =>
        compare(answers[index], question.answer_hash)
      )
    );

    const allCorrect = comparisons.every(Boolean);

    if (!allCorrect) {
      current.count += 1;
      attempts.set(rateLimitKey, current);

      return NextResponse.json(
        { error: "The answers are incorrect. Please try again." },
        { status: 401 }
      );
    }

    // Answers are correct.
    // Reset this instance's attempt counter.
    attempts.delete(rateLimitKey);

    console.info("SECRETWISH: Recipient verification successful");

    // 7. Retrieve private photo paths
    const { data: photos, error: photosError } = await supabase
      .from("wish_photos")
      .select("storage_path, caption")
      .eq("wish_id", wish.id);

    if (photosError) {
      console.error("PRIVATE PHOTOS LOOKUP ERROR:", photosError);

      return NextResponse.json(
        { error: "Unable to retrieve birthday memories." },
        { status: 500 }
      );
    }

    // 8. Generate short-lived photo URLs
    const privatePhotos = await Promise.all(
      (photos ?? []).map(async (photo) => {
        const { data, error } = await supabase.storage
          .from("wish-photos")
          .createSignedUrl(
            photo.storage_path,
            SIGNED_URL_SECONDS
          );

        if (error || !data?.signedUrl) {
          throw new Error(
            `Unable to create private photo link: ${
              error?.message || "Unknown error"
            }`
          );
        }

        return {
          caption: photo.caption,
          url: data.signedUrl,
        };
      })
    );

    // 9. Retrieve private music record
    const { data: musicRecords, error: musicError } =
      await supabase
        .from("wish_music")
        .select("storage_path, original_name, mime_type")
        .eq("wish_id", wish.id);

    if (musicError) {
      console.error("PRIVATE MUSIC LOOKUP ERROR:", musicError);

      return NextResponse.json(
        { error: "Unable to retrieve birthday music." },
        { status: 500 }
      );
    }

    // 10. Generate short-lived music URLs
    const privateMusic = await Promise.all(
      (musicRecords ?? []).map(async (music) => {
        const { data, error } = await supabase.storage
          .from("wish-music")
          .createSignedUrl(
            music.storage_path,
            SIGNED_URL_SECONDS
          );

        if (error || !data?.signedUrl) {
          throw new Error(
            `Unable to create private music link: ${
              error?.message || "Unknown error"
            }`
          );
        }

        return {
          name: music.original_name,
          mimeType: music.mime_type,
          url: data.signedUrl,
        };
      })
    );

    // 11. Return private content only after successful verification
    return NextResponse.json({
      success: true,
      message: "Surprise unlocked successfully!",
      surprise: {
        secretMessage: wish.secret_message,
        photos: privatePhotos,
        music: privateMusic,
      },
    });
  } catch (error) {
    console.error("SECRET VERIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while verifying your answers.",
      },
      { status: 500 }
    );
  }
}
