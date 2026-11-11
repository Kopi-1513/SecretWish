
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Heart,
  HelpCircle,
  Image as ImageIcon,
  Mail,
  User,
  LockKeyhole,
  Sparkles,
  CheckCircle2,
  Loader2,
  Music2,
  Play,
  Pause,
  Volume2,
} from "lucide-react";

type Photo = {
  id: string;
  name: string;
  dataUrl: string;
};

type MusicDraft = {
  name: string;
  dataUrl: string;
  type: string;
  size: number;
};

type WishDraft = {
  recipientName: string;
  recipientEmail?: string;
  birthdayDate: string;
  secretMessage: string;
  questions: {
    question: string;
    answer: string;
  }[];
  photos: Photo[];
  music?: MusicDraft | null;
};

type CreatedWish = {
  id: string;
  slug: string;
  photoCount: number;
  musicUploaded: boolean;
  musicName: string | null;
};

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_MUSIC_SIZE = 3 * 1024 * 1024;

const STORAGE_BUCKET = "wish-photos";
const MUSIC_BUCKET = "wish-music";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
];

function normalizeAudioType(type: string): string {
  const normalized = type.toLowerCase();

  if (
    normalized === "audio/mp3" ||
    normalized === "audio/mpeg"
  ) {
    return "audio/mpeg";
  }

  if (
    normalized === "audio/x-wav" ||
    normalized === "audio/wave"
  ) {
    return "audio/wav";
  }

  if (normalized === "audio/x-m4a") {
    return "audio/mp4";
  }

  return normalized;
}

function getAudioExtension(type: string): string {
  switch (normalizeAudioType(type)) {
    case "audio/mpeg":
      return "mp3";
    case "audio/mp4":
      return "m4a";
    case "audio/wav":
      return "wav";
    case "audio/ogg":
      return "ogg";
    case "audio/webm":
      return "webm";
    default:
      throw new Error("Unsupported music format.");
  }
}

export default function ReviewWishPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [draft, setDraft] = useState<WishDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [createdWish, setCreatedWish] =
    useState<CreatedWish | null>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.7);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem("secretwish_draft");

    if (!savedDraft) {
      router.replace("/dashboard/create");
      return;
    }

    try {
      const parsed = JSON.parse(savedDraft) as WishDraft;

      if (
        !parsed.recipientName ||
        !parsed.birthdayDate ||
        !parsed.secretMessage ||
        !Array.isArray(parsed.questions) ||
        !Array.isArray(parsed.photos) ||
        parsed.questions.length === 0
      ) {
        router.replace("/dashboard/create");
        return;
      }

      setDraft(parsed);
      setLoaded(true);
    } catch (error) {
      console.error("DRAFT LOADING ERROR:", error);
      router.replace("/dashboard/create");
    }
  }, [router]);

  function formatDate(date: string) {
    if (!date) return "Not selected";

    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
  }

  async function toggleMusicPreview() {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setMusicPlaying(true);
      } else {
        audio.pause();
        setMusicPlaying(false);
      }
    } catch {
      setApiError("Unable to play the selected music preview.");
    }
  }

  function handleVolumeChange(value: number) {
    setMusicVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }

  async function handleCreateWish() {
    if (!draft || saving || createdWish) return;

    setSaving(true);
    setApiError("");

    let supabase: ReturnType<typeof createClient> | null = null;
    let wishId: string | null = null;

    const uploadedPhotoPaths: string[] = [];
    const uploadedMusicPaths: string[] = [];

    try {
      console.info("SECRETWISH: Starting wish creation");
      console.info("SECRETWISH: Selected photos:", draft.photos.length);
      console.info("SECRETWISH: Music selected:", !!draft.music);

      // 1. Initialize Supabase client
      supabase = createClient();

      // 2. Verify authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      console.info("SECRETWISH: User authenticated");

      // 3. Validate photos before creating the wish
      const validatedPhotos: {
        name: string;
        blob: Blob;
      }[] = [];

      for (const photo of draft.photos) {
        if (!photo.dataUrl) {
          throw new Error(`Photo data is missing: ${photo.name}`);
        }

        const photoResponse = await fetch(photo.dataUrl);

        if (!photoResponse.ok) {
          throw new Error(`Unable to read photo: ${photo.name}`);
        }

        const blob = await photoResponse.blob();

        if (!ALLOWED_IMAGE_TYPES.includes(blob.type)) {
          throw new Error(
            `Unsupported photo format: ${photo.name}. Use JPG, PNG or WEBP.`
          );
        }

        if (blob.size === 0) {
          throw new Error(`Photo is empty: ${photo.name}`);
        }

        if (blob.size > MAX_PHOTO_SIZE) {
          throw new Error(`${photo.name} exceeds the 2 MB limit.`);
        }

        validatedPhotos.push({
          name: photo.name,
          blob,
        });
      }

      console.info("SECRETWISH: Photo validation completed");

      // 4. Validate optional music before creating the wish
      let validatedMusic: {
        name: string;
        blob: Blob;
        mimeType: string;
        extension: string;
      } | null = null;

      if (draft.music) {
        if (!draft.music.dataUrl) {
          throw new Error("Selected music data is missing.");
        }

        const musicResponse = await fetch(draft.music.dataUrl);

        if (!musicResponse.ok) {
          throw new Error("Unable to read the selected music.");
        }

        const musicBlob = await musicResponse.blob();
        const mimeType = normalizeAudioType(
          musicBlob.type || draft.music.type
        );

        if (!ALLOWED_AUDIO_TYPES.some(
          (type) => normalizeAudioType(type) === mimeType
        )) {
          throw new Error(
            "Unsupported music format. Use MP3, WAV, OGG, M4A or WEBM."
          );
        }

        if (musicBlob.size === 0) {
          throw new Error("The selected music file is empty.");
        }

        if (musicBlob.size > MAX_MUSIC_SIZE) {
          throw new Error("Music must be smaller than 3 MB.");
        }

        validatedMusic = {
          name: draft.music.name,
          blob: musicBlob,
          mimeType,
          extension: getAudioExtension(mimeType),
        };
      }

      console.info(
        "SECRETWISH: Music validation completed:",
        !!validatedMusic
      );

      // 5. Create birthday wish through the API
      const response = await fetch("/api/wishes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientName: draft.recipientName,
          recipientEmail: draft.recipientEmail || "",
          birthdayDate: draft.birthdayDate,
          secretMessage: draft.secretMessage,
          questions: draft.questions,
        }),
      });

      let result: {
        error?: string;
        wish?: {
          id?: string;
          slug?: string;
        };
      };

      try {
        result = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response. Please try again."
        );
      }

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create birthday wish."
        );
      }

      wishId = result.wish?.id ?? null;

      if (!wishId || !result.wish?.slug) {
        throw new Error(
          "The server did not return a valid birthday wish."
        );
      }

      console.info("SECRETWISH: Wish created:", wishId);

      // 6. Upload photos to private Supabase Storage
      for (const photo of validatedPhotos) {
        const extension =
          photo.blob.type === "image/jpeg"
            ? "jpg"
            : photo.blob.type === "image/png"
              ? "png"
              : "webp";

        const storagePath =
          `${wishId}/${crypto.randomUUID()}.${extension}`;

        console.info(
          "SECRETWISH: Uploading photo:",
          photo.name
        );

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, photo.blob, {
            contentType: photo.blob.type,
            upsert: false,
          });

        if (uploadError) {
          console.error("PHOTO UPLOAD ERROR:", uploadError);

          throw new Error(
            `Photo upload failed (${photo.name}): ${uploadError.message}`
          );
        }

        uploadedPhotoPaths.push(storagePath);

        console.info(
          "SECRETWISH: Photo uploaded:",
          storagePath
        );

        // Save private photo path in database
        const { error: photoInsertError } = await supabase
          .from("wish_photos")
          .insert({
            wish_id: wishId,
            storage_path: storagePath,
            caption: photo.name,
          });

        if (photoInsertError) {
          console.error(
            "PHOTO DATABASE INSERT ERROR:",
            photoInsertError
          );

          throw new Error(
            `Unable to save photo information (${photo.name}): ${photoInsertError.message}`
          );
        }

        console.info(
          "SECRETWISH: Photo record saved:",
          photo.name
        );
      }

      // 7. Upload optional music to private Supabase Storage
      if (validatedMusic) {
        const storagePath =
          `${wishId}/${crypto.randomUUID()}.${validatedMusic.extension}`;

        console.info(
          "SECRETWISH: Uploading music:",
          validatedMusic.name
        );

        const { error: musicUploadError } = await supabase.storage
          .from(MUSIC_BUCKET)
          .upload(storagePath, validatedMusic.blob, {
            contentType: validatedMusic.mimeType,
            upsert: false,
          });

        if (musicUploadError) {
          console.error("MUSIC UPLOAD ERROR:", musicUploadError);

          throw new Error(
            `Music upload failed: ${musicUploadError.message}`
          );
        }

        uploadedMusicPaths.push(storagePath);

        console.info(
          "SECRETWISH: Music uploaded:",
          storagePath
        );

        // Save music storage path in database
        const { error: musicInsertError } = await supabase
          .from("wish_music")
          .insert({
            wish_id: wishId,
            storage_path: storagePath,
            original_name: validatedMusic.name,
            mime_type: validatedMusic.mimeType,
          });

        if (musicInsertError) {
          console.error(
            "MUSIC DATABASE INSERT ERROR:",
            musicInsertError
          );

          throw new Error(
            `Unable to save music information: ${musicInsertError.message}`
          );
        }

        console.info("SECRETWISH: Music record saved");
      }

      // 8. Show success only after every operation succeeds
      setCreatedWish({
        id: wishId,
        slug: result.wish.slug,
        photoCount: uploadedPhotoPaths.length,
        musicUploaded: !!validatedMusic,
        musicName: validatedMusic?.name ?? null,
      });

      sessionStorage.removeItem("secretwish_draft");

      console.info(
        "SECRETWISH: Wish creation completed successfully"
      );
    } catch (error) {
      console.error("BIRTHDAY WISH CREATION ERROR:", error);

      // 9. Roll back partial uploads and database records
      if (wishId && supabase) {
        console.warn("SECRETWISH: Starting rollback");

        if (uploadedPhotoPaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(uploadedPhotoPaths);

          if (cleanupError) {
            console.error("PHOTO CLEANUP ERROR:", cleanupError);
          } else {
            console.info("SECRETWISH: Uploaded photos cleaned up");
          }
        }

        if (uploadedMusicPaths.length > 0) {
          const { error: musicCleanupError } = await supabase.storage
            .from(MUSIC_BUCKET)
            .remove(uploadedMusicPaths);

          if (musicCleanupError) {
            console.error(
              "MUSIC STORAGE CLEANUP ERROR:",
              musicCleanupError
            );
          } else {
            console.info("SECRETWISH: Uploaded music cleaned up");
          }
        }

        const { error: musicDeleteError } = await supabase
          .from("wish_music")
          .delete()
          .eq("wish_id", wishId);

        if (musicDeleteError) {
          console.error(
            "MUSIC RECORD CLEANUP ERROR:",
            musicDeleteError
          );
        }

        const { error: photoDeleteError } = await supabase
          .from("wish_photos")
          .delete()
          .eq("wish_id", wishId);

        if (photoDeleteError) {
          console.error(
            "PHOTO RECORD CLEANUP ERROR:",
            photoDeleteError
          );
        }

        const { error: wishDeleteError } = await supabase
          .from("birthday_wishes")
          .delete()
          .eq("id", wishId);

        if (wishDeleteError) {
          console.error(
            "WISH CLEANUP ERROR:",
            wishDeleteError
          );
        }
      }

      setApiError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!loaded || !draft) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-[#d4af70]">
        Preparing your birthday surprise...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-[#f5e8d0]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/create/photos")}
          disabled={saving || !!createdWish}
          className="mb-10 flex items-center gap-2 text-sm text-[#a6a0ad] transition hover:text-[#d4af70] disabled:opacity-50"
        >
          <ArrowLeft size={17} />
          Back to photos
        </button>

        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af70]">
            Almost ready to surprise
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Review your <span className="text-[#d4af70]">Wish</span>
          </h1>

          <p className="mt-4 text-[#a6a0ad]">
            Take a final look at everything before creating your birthday
            surprise.
          </p>
        </div>

        <div className="mb-9 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <span className="ml-2 text-xs text-[#a6a0ad]">Review</span>
        </div>

        {/* Recipient details */}
        <section className="mb-6 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <User size={22} />
              </div>
              <h2 className="text-xl font-semibold">Special Person</h2>
            </div>

            {!createdWish && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/create")}
                disabled={saving}
                className="text-sm text-[#d4af70] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs text-[#918b99]">Recipient name</p>
              <p className="mt-1 text-lg font-medium">
                {draft.recipientName}
              </p>
            </div>

            {draft.recipientEmail && (
              <div>
                <p className="flex items-center gap-2 text-xs text-[#918b99]">
                  <Mail size={14} />
                  Recipient email
                </p>
                <p className="mt-1">{draft.recipientEmail}</p>
              </div>
            )}

            <div>
              <p className="flex items-center gap-2 text-xs text-[#918b99]">
                <CalendarDays size={14} />
                Birthday date
              </p>
              <p className="mt-1">{formatDate(draft.birthdayDate)}</p>
            </div>
          </div>
        </section>

        {/* Secret message */}
        <section className="mb-6 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <Heart size={22} />
              </div>
              <h2 className="text-xl font-semibold">Secret Message</h2>
            </div>

            {!createdWish && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/create")}
                disabled={saving}
                className="text-sm text-[#d4af70] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div className="rounded-xl border border-[#38343b] bg-[#090a10] p-5">
            <p className="whitespace-pre-wrap leading-7 text-[#d8cdbb]">
              {draft.secretMessage}
            </p>
          </div>
        </section>

        {/* Secret questions */}
        <section className="mb-6 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <LockKeyhole size={22} />
              </div>
              <h2 className="text-xl font-semibold">Secret Questions</h2>
            </div>

            {!createdWish && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/create/questions")}
                disabled={saving}
                className="text-sm text-[#d4af70] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          <div className="space-y-4">
            {draft.questions.map((item, index) => (
              <div
                key={`${item.question}-${index}`}
                className="rounded-xl border border-[#38343b] bg-[#090a10] p-4"
              >
                <p className="flex items-center gap-2 text-sm font-medium">
                  <HelpCircle size={16} className="text-[#d4af70]" />
                  Question {index + 1}
                </p>

                <p className="mt-3 text-[#d8cdbb]">
                  {item.question}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-[#d4af70]/5 px-3 py-2">
                  <span className="text-xs text-[#918b99]">
                    Correct answer
                  </span>
                  <span className="break-all text-sm text-[#d4af70]">
                    {item.answer}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-5 text-[#918b99]">
            Only you can see these answers in this creator preview.
            They are hashed before database storage.
          </p>
        </section>

        {/* Photos */}
        <section className="mb-6 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <ImageIcon size={22} />
              </div>
              <h2 className="text-xl font-semibold">Your Memories</h2>
            </div>

            {!createdWish && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/create/photos")}
                disabled={saving}
                className="text-sm text-[#d4af70] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {draft.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {draft.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-xl border border-[#38343b]"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="h-36 w-full object-cover"
                  />
                  <p className="truncate bg-[#090a10] px-3 py-2 text-xs text-[#c7bdad]">
                    {photo.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#918b99]">
              No photos added. You can continue without photos.
            </p>
          )}
        </section>

        {/* Birthday music */}
        <section className="mb-6 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <Music2 size={22} />
              </div>
              <h2 className="text-xl font-semibold">Birthday Soundtrack</h2>
            </div>

            {!createdWish && (
              <button
                type="button"
                onClick={() => router.push("/dashboard/create/photos")}
                disabled={saving}
                className="text-sm text-[#d4af70] hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {draft.music ? (
            <div className="rounded-2xl border border-[#514638] bg-[#090a10] p-5">
              <audio
                ref={audioRef}
                src={draft.music.dataUrl}
                preload="metadata"
                onEnded={() => setMusicPlaying(false)}
                onPause={() => setMusicPlaying(false)}
                onPlay={() => setMusicPlaying(true)}
              />

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d4af70]/10 text-[#d4af70]">
                  <Music2 size={27} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {draft.music.name}
                  </p>
                  <p className="mt-1 text-xs text-[#918b99]">
                    {(draft.music.size / (1024 * 1024)).toFixed(2)} MB
                    {" · "}
                    Ready to upload
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleMusicPreview}
                  disabled={saving || !!createdWish}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#d4af70] to-[#a77b40] text-[#111019] transition hover:brightness-110 disabled:opacity-50"
                  aria-label={musicPlaying ? "Pause music" : "Play music"}
                >
                  {musicPlaying ? (
                    <Pause size={19} />
                  ) : (
                    <Play size={19} />
                  )}
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Volume2 size={17} className="shrink-0 text-[#d4af70]" />

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVolume}
                  onChange={(event) =>
                    handleVolumeChange(Number(event.target.value))
                  }
                  className="w-full accent-[#d4af70]"
                  aria-label="Music preview volume"
                />

                <span className="w-10 text-right text-xs text-[#918b99]">
                  {Math.round(musicVolume * 100)}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#918b99]">
              No birthday music selected. You can create your wish without music.
            </p>
          )}

          <p className="mt-4 text-xs leading-6 text-[#918b99]">
            Your selected music will be uploaded to private storage.
            The recipient can play it after unlocking the surprise.
          </p>
        </section>

        {/* Information */}
        <div className="mb-7 flex gap-3 rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/5 p-5">
          <CheckCircle2
            className="mt-0.5 shrink-0 text-[#d4af70]"
            size={22}
          />
          <div>
            <h3 className="font-semibold">
              Your surprise is almost ready!
            </h3>
            <p className="mt-1 text-xs leading-6 text-[#a6a0ad]">
              Your birthday details and secret questions will be saved
              securely. Your selected photos and music will be uploaded
              to private storage when you create your wish.
            </p>
          </div>
        </div>

        {/* Error */}
        {apiError && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {apiError}
          </div>
        )}

        {/* Success */}
        {createdWish ? (
          <div className="rounded-2xl border border-[#d4af70]/30 bg-[#d4af70]/10 p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-[#d4af70]" size={25} />
              <h3 className="text-lg font-semibold">
                Birthday wish saved successfully!
              </h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#c7bdad]">
              Your birthday details, hashed questions, photo records
              and music information have been saved.
            </p>

            <p className="mt-3 text-sm text-[#d4af70]">
              Photos uploaded: {createdWish.photoCount}
            </p>

            <p className="mt-2 text-sm text-[#d4af70]">
              Music uploaded: {createdWish.musicUploaded ? "Yes" : "No"}
            </p>

            {createdWish.musicName && (
              <p className="mt-1 break-all text-xs text-[#c7bdad]">
                Music file: {createdWish.musicName}
              </p>
            )}

            <p className="mt-3 break-all text-xs text-[#918b99]">
              Wish ID: {createdWish.id}
            </p>

            <p className="mt-3 text-xs leading-5 text-[#d4af70]">
              Your wish is still unpublished. Recipient sharing will
              become available after the publishing step.
            </p>

            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="mt-5 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-3 font-semibold text-[#111019] transition hover:brightness-110"
            >
              Back to dashboard
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleCreateWish}
            disabled={saving}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-4 font-semibold text-[#111019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Saving wish, photos and music...
              </>
            ) : (
              <>
                Create Birthday Wish
                <ArrowRight size={19} />
                <Sparkles size={17} />
              </>
            )}
          </button>
        )}

        <p className="mt-4 text-center text-xs text-[#77717f]">
          {createdWish
            ? "Your wish has been saved as an unpublished draft."
            : "Your wish will remain unpublished until you are ready to share it."}
        </p>
      </div>
    </main>
  );
}
