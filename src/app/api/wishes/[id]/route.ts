
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        { error: "Invalid birthday wish ID." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Verify the currently authenticated user.
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to delete a wish." },
        { status: 401 }
      );
    }

    // 2. Verify that this wish belongs to the logged-in user.
    const { data: wish, error: wishError } = await supabase
      .from("birthday_wishes")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (wishError) {
      console.error("WISH LOOKUP ERROR:", wishError);

      return NextResponse.json(
        { error: "Unable to verify ownership of this wish." },
        { status: 500 }
      );
    }

    if (!wish) {
      return NextResponse.json(
        { error: "Wish not found or you do not have permission to delete it." },
        { status: 404 }
      );
    }

    // 3. Get all photo storage paths belonging to this wish.
    const { data: photos, error: photosError } = await supabase
      .from("wish_photos")
      .select("storage_path")
      .eq("wish_id", id);

    if (photosError) {
      console.error("PHOTO LOOKUP ERROR:", photosError);

      return NextResponse.json(
        { error: "Unable to retrieve the wish photos." },
        { status: 500 }
      );
    }

    // 4. Get all music storage paths belonging to this wish.
    const { data: music, error: musicError } = await supabase
      .from("wish_music")
      .select("storage_path")
      .eq("wish_id", id);

    if (musicError) {
      console.error("MUSIC LOOKUP ERROR:", musicError);

      return NextResponse.json(
        { error: "Unable to retrieve the wish music." },
        { status: 500 }
      );
    }

    // 5. Delete the actual photo files from private Storage.
    const photoPaths = (photos ?? [])
      .map((photo) => photo.storage_path)
      .filter((path): path is string => Boolean(path));

    if (photoPaths.length > 0) {
      const { error: photoStorageError } = await supabase.storage
        .from("wish-photos")
        .remove(photoPaths);

      if (photoStorageError) {
        console.error("PHOTO STORAGE DELETE ERROR:", photoStorageError);

        return NextResponse.json(
          {
            error:
              "Unable to delete the wish photos from storage. The wish has not been removed. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    // 6. Delete the actual music files from private Storage.
    const musicPaths = (music ?? [])
      .map((item) => item.storage_path)
      .filter((path): path is string => Boolean(path));

    if (musicPaths.length > 0) {
      const { error: musicStorageError } = await supabase.storage
        .from("wish-music")
        .remove(musicPaths);

      if (musicStorageError) {
        console.error("MUSIC STORAGE DELETE ERROR:", musicStorageError);

        return NextResponse.json(
          {
            error:
              "Unable to delete the wish music from storage. The wish has not been removed. Please try again.",
          },
          { status: 500 }
        );
      }
    }

    // 7. Delete all related database records.
    const { error: questionsDeleteError } = await supabase
      .from("wish_questions")
      .delete()
      .eq("wish_id", id);

    if (questionsDeleteError) {
      console.error("QUESTIONS DELETE ERROR:", questionsDeleteError);

      return NextResponse.json(
        { error: "Unable to delete the wish questions." },
        { status: 500 }
      );
    }

    const { error: photosDeleteError } = await supabase
      .from("wish_photos")
      .delete()
      .eq("wish_id", id);

    if (photosDeleteError) {
      console.error("PHOTOS DATABASE DELETE ERROR:", photosDeleteError);

      return NextResponse.json(
        { error: "Unable to delete the wish photo records." },
        { status: 500 }
      );
    }

    const { error: musicDeleteError } = await supabase
      .from("wish_music")
      .delete()
      .eq("wish_id", id);

    if (musicDeleteError) {
      console.error("MUSIC DATABASE DELETE ERROR:", musicDeleteError);

      return NextResponse.json(
        { error: "Unable to delete the wish music records." },
        { status: 500 }
      );
    }

    // 8. Finally, delete the main birthday wish.
    const { data: deletedWish, error: wishDeleteError } = await supabase
      .from("birthday_wishes")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();

    if (wishDeleteError) {
      console.error("WISH DELETE ERROR:", wishDeleteError);

      return NextResponse.json(
        { error: "Unable to delete the birthday wish." },
        { status: 500 }
      );
    }

    if (!deletedWish) {
      return NextResponse.json(
        { error: "The wish could not be deleted." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Birthday wish and its related data have been deleted.",
    });
  } catch (error) {
    console.error("DELETE WISH ERROR:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred while deleting the wish." },
      { status: 500 }
    );
  }
}
