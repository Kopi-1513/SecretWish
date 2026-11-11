
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    // 1. Authenticate the current user
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in to publish this birthday wish." },
        { status: 401 }
      );
    }

    // 2. Validate the wish ID
    const { id } = await params;

    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { error: "Invalid birthday wish ID." },
        { status: 400 }
      );
    }

    // 3. Find a wish owned by the logged-in user
    const { data: wish, error: findError } = await supabase
      .from("birthday_wishes")
      .select("id, slug, is_published")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (findError) {
      console.error("PUBLISH LOOKUP ERROR:", findError);

      return NextResponse.json(
        { error: "Unable to retrieve your birthday wish." },
        { status: 500 }
      );
    }

    if (!wish) {
      return NextResponse.json(
        { error: "Birthday wish not found or access denied." },
        { status: 404 }
      );
    }

    if (!wish.slug) {
      return NextResponse.json(
        { error: "This birthday wish does not have a valid sharing link." },
        { status: 400 }
      );
    }

    // 4. Publish only if it is not already published
    if (!wish.is_published) {
      const { data: updatedWish, error: updateError } =
        await supabase
          .from("birthday_wishes")
          .update({ is_published: true })
          .eq("id", id)
          .eq("user_id", user.id)
          .eq("is_published", false)
          .select("id")
          .maybeSingle();

      if (updateError) {
        console.error("PUBLISH UPDATE ERROR:", updateError);

        return NextResponse.json(
          { error: "Unable to publish your birthday wish." },
          { status: 500 }
        );
      }

      if (!updatedWish) {
        return NextResponse.json(
          { error: "The wish could not be published. Please refresh and try again." },
          { status: 409 }
        );
      }
    }

    // 5. Build the recipient URL
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;

    const shareUrl = `${baseUrl}/wish/${wish.slug}`;

    return NextResponse.json({
      success: true,
      message: "Birthday wish published successfully!",
      wish: {
        id: wish.id,
        slug: wish.slug,
        isPublished: true,
        shareUrl,
      },
    });
  } catch (error) {
    console.error("PUBLISH WISH API ERROR:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while publishing." },
      { status: 500 }
    );
  }
}
