
import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

const verifySchema = z.object({
  answers: z.array(z.string().trim().min(1).max(200)).min(1).max(10),
});

const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const SIGNED_URL_SECONDS = 300;

function getRateLimitKey(request: Request, slug: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  return `${slug}:${ip}`;
}

async function consumeLife(slug: string): Promise<number> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("consume_wish_life", {
    p_slug: slug,
  });

  if (error) {
    console.error("CONSUME WISH LIFE ERROR:", error);
    throw new Error("Unable to update remaining lives.");
  }

  if (typeof data !== "number") {
    throw new Error("Unable to read remaining lives.");
  }

  return data;
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

    // 1. Rate limiting.
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
        { error: "Too many attempts. Please try again later." },
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

    // 2. Validate request body.
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Please provide valid answers." },
        { status: 400 }
      );
    }

    const { answers } = validation.data;

    const supabase = await createClient();

    // 3. Find published wish.
    // Celebration effect is retrieved here but never returned
    // until all secret answers have been verified successfully.
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .select(
        "id, secret_message, remaining_lives, celebration_effect"
      )
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

    // 4. Block wishes with no remaining lives.
    if (wish.remaining_lives <= 0) {
      return NextResponse.json(
        {
          success: false,
          lost: true,
          remainingLives: 0,
          error: "You lost your secret wish.",
        },
        { status: 403 }
      );
    }

    // 5. Retrieve secret answer hashes.
    const { data: questions, error: questionsError } = await supabase
      .from("wish_questions")
      .select("answer_hash, sort_order")
      .eq("wish_id", wish.id)
      .order("sort_order", { ascending: true });

    if (questionsError || !questions) {
      console.error("VERIFY QUESTIONS ERROR:", questionsError);

      return NextResponse.json(
        { error: "Unable to verify the secret answers." },
        { status: 500 }
      );
    }

    // 6. Compare all answers.
    let allCorrect = false;

    if (
      questions.length > 0 &&
      answers.length === questions.length
    ) {
      const comparisons = await Promise.all(
        questions.map((question, index) =>
          compare(answers[index], question.answer_hash)
        )
      );

      allCorrect = comparisons.every(Boolean);
    }

    // 7. Wrong answers consume one persistent life.
    if (!allCorrect) {
      const remainingLives = await consumeLife(slug);

      current.count += 1;
      attempts.set(rateLimitKey, current);

      const lost = remainingLives <= 0;

      return NextResponse.json(
        {
          success: false,
          lost,
          remainingLives,
          error: lost
            ? "You lost your secret wish. All three lives are gone."
            : remainingLives === 2
              ? "Retry! You only have two lives to get your wish."
              : "One last chance! You have only one life remaining.",
        },
        { status: lost ? 403 : 401 }
      );
    }

    // 8. Recheck remaining lives before revealing private content.
    const { data: latestWish, error: latestWishError } = await supabase
      .from("birthday_wishes")
      .select("remaining_lives")
      .eq("id", wish.id)
      .eq("is_published", true)
      .maybeSingle();

    if (latestWishError || !latestWish) {
      console.error("LATEST WISH LOOKUP ERROR:", latestWishError);

      return NextResponse.json(
        { error: "Unable to confirm this birthday wish." },
        { status: 500 }
      );
    }

    if (latestWish.remaining_lives <= 0) {
      return NextResponse.json(
        {
          success: false,
          lost: true,
          remainingLives: 0,
          error: "You lost your secret wish.",
        },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // 9. Retrieve private photos.
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

    // 10. Retrieve private background music.
    const { data: musicRecords, error: musicError } = await supabase
      .from("wish_music")
      .select("storage_path, original_name, mime_type")
      .eq("wish_id", wish.id)
      .limit(1);

    if (musicError) {
      console.error("PRIVATE MUSIC LOOKUP ERROR:", musicError);

      return NextResponse.json(
        { error: "Unable to retrieve birthday music." },
        { status: 500 }
      );
    }

    let privateMusic = null;

    const musicRecord = musicRecords?.[0];

    if (musicRecord) {
      const { data, error } = await supabase.storage
        .from("wish-music")
        .createSignedUrl(
          musicRecord.storage_path,
          SIGNED_URL_SECONDS
        );

      if (error || !data?.signedUrl) {
        throw new Error(
          `Unable to create private music link: ${
            error?.message || "Unknown error"
          }`
        );
      }

      privateMusic = {
        originalName: musicRecord.original_name,
        mimeType: musicRecord.mime_type,
        url: data.signedUrl,
      };
    }

    // 11. Retrieve private voice message metadata.
    const { data: voiceRecords, error: voiceError } = await admin
      .from("wish_voice")
      .select("storage_path, original_name, mime_type")
      .eq("wish_id", wish.id)
      .limit(1);

    if (voiceError) {
      console.error("PRIVATE VOICE LOOKUP ERROR:", voiceError);

      return NextResponse.json(
        { error: "Unable to retrieve the voice message." },
        { status: 500 }
      );
    }

    let privateVoice = null;

    const voiceRecord = voiceRecords?.[0];

    if (voiceRecord) {
      // Generate a short-lived signed URL after verification.
      const { data, error } = await admin.storage
        .from("wish-voice")
        .createSignedUrl(
          voiceRecord.storage_path,
          SIGNED_URL_SECONDS
        );

      if (error || !data?.signedUrl) {
        console.error("VOICE SIGNED URL ERROR:", error);

        throw new Error(
          `Unable to create private voice link: ${
            error?.message || "Unknown error"
          }`
        );
      }

      privateVoice = {
        originalName: voiceRecord.original_name,
        mimeType: voiceRecord.mime_type,
        url: data.signedUrl,
      };
    }

    // 12. Validate the stored effect.
    const allowedEffects = [
      "confetti",
      "hearts",
      "sparkles",
      "fireworks",
      "petals",
    ] as const;

    const celebrationEffect = allowedEffects.includes(
      wish.celebration_effect
    )
      ? wish.celebration_effect
      : "confetti";

    // 13. Successful verification.
    attempts.delete(rateLimitKey);

    return NextResponse.json(
      {
        success: true,
        message: "Surprise unlocked successfully!",
        remainingLives: latestWish.remaining_lives,
        surprise: {
          secretMessage: wish.secret_message,
          photos: privatePhotos,
          music: privateMusic,
          voice: privateVoice,
          celebrationEffect,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
      }
    );
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
