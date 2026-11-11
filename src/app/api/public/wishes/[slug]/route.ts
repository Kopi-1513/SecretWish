
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(
  _request: Request,
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

    const supabase = await createClient();

    // Only retrieve published wishes.
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .select("id, recipient_name, birthday_date")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (wishError) {
      console.error("PUBLIC WISH LOOKUP ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to load this birthday wish." },
        { status: 500 }
      );
    }

    if (!wish) {
      return NextResponse.json(
        { error: "Birthday wish not found or not published." },
        { status: 404 }
      );
    }

    // Return question text only.
    // Never return answer_hash or secret_message here.
    const { data: questions, error: questionsError } =
      await supabase
        .from("wish_questions")
        .select("question_text, sort_order")
        .eq("wish_id", wish.id)
        .order("sort_order", { ascending: true });

    if (questionsError) {
      console.error("PUBLIC QUESTIONS LOOKUP ERROR:", questionsError);

      return NextResponse.json(
        { error: "Unable to load the secret questions." },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        { error: "No secret questions are available." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      wish: {
        recipientName: wish.recipient_name,
        birthdayDate: wish.birthday_date,
        questions: questions.map((item) => ({
          question: item.question_text,
          order: item.sort_order,
        })),
      },
    });
  } catch (error) {
    console.error("PUBLIC WISH API ERROR:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
