
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { slug } = await params;

    // Validate the public wish slug.
    if (!slug || !/^[a-f0-9]{32}$/i.test(slug)) {
      return NextResponse.json(
        { error: "Invalid birthday wish link." },
        { status: 400 }
      );
    }

    // Use the server-side admin client so public visitors
    // can access published wishes without logging in.
    // Never expose the service role key to the client.
    const supabase = createAdminClient();

    // Fetch only public information from a published wish.
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .select(
        "id, recipient_name, birthday_date, remaining_lives"
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (wishError) {
      console.error("PUBLIC WISH FETCH ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to load this birthday wish." },
        { status: 500 }
      );
    }

    if (!wish) {
      return NextResponse.json(
        { error: "This birthday wish is unavailable." },
        { status: 404 }
      );
    }

    // Fetch public question text only.
    // Answer hashes are never returned.
    const { data: questions, error: questionsError } =
      await supabase
        .from("wish_questions")
        .select("question_text, sort_order")
        .eq("wish_id", wish.id)
        .order("sort_order", { ascending: true });

    if (questionsError) {
      console.error(
        "PUBLIC QUESTIONS FETCH ERROR:",
        questionsError
      );

      return NextResponse.json(
        { error: "Unable to load the secret questions." },
        { status: 500 }
      );
    }

    const remainingLives = Math.max(
      0,
      Math.min(3, Number(wish.remaining_lives ?? 3))
    );

    return NextResponse.json(
      {
        success: true,
        wish: {
          recipientName: wish.recipient_name,
          birthdayDate: wish.birthday_date,
          remainingLives,
          questions: (questions ?? []).map((question) => ({
            question: question.question_text,
            order: question.sort_order,
          })),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("PUBLIC WISH API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
