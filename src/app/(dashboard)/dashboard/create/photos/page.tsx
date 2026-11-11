
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Trash2,
  Images,
  ShieldCheck,
  Sparkles,
  Music2,
  Play,
  Pause,
  Volume2,
  Music,
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
  photos?: Photo[];
  music?: MusicDraft | null;
  [key: string]: unknown;
};

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_MUSIC_SIZE = 3 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Unable to read the selected file."));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the selected file."));
    };

    reader.readAsDataURL(file);
  });
}

export default function WishPhotosPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [music, setMusic] = useState<MusicDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.7);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem("secretwish_draft");

    if (!savedDraft) {
      router.replace("/dashboard/create");
      return;
    }

    try {
      const draft = JSON.parse(savedDraft) as WishDraft;

      if (Array.isArray(draft.photos)) {
        setPhotos(draft.photos);
      }

      if (draft.music && typeof draft.music.dataUrl === "string") {
        setMusic(draft.music);
      }

      setLoaded(true);
    } catch {
      router.replace("/dashboard/create");
    }
  }, [router]);

  async function handlePhotoSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    setError("");

    const remaining = MAX_PHOTOS - photos.length;

    if (remaining <= 0) {
      setError("You can upload a maximum of 5 photos.");
      return;
    }

    const selected = files.slice(0, remaining);

    if (files.length > remaining) {
      setError(`Only ${remaining} more photo(s) can be added.`);
    }

    const validFiles = selected.filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("Only JPG, PNG and WEBP images are allowed.");
        return false;
      }

      if (file.size > MAX_PHOTO_SIZE) {
        setError(`${file.name} must be smaller than 2 MB.`);
        return false;
      }

      return true;
    });

    try {
      const newPhotos = await Promise.all(
        validFiles.map(async (file): Promise<Photo> => ({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: await readFileAsDataUrl(file),
        }))
      );

      setPhotos((current) => [...current, ...newPhotos]);
    } catch {
      setError("Something went wrong while reading your photos.");
    }
  }

  function removePhoto(id: string) {
    setPhotos((current) =>
      current.filter((photo) => photo.id !== id)
    );
  }

  async function handleMusicSelection(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setError("Choose an MP3, WAV, OGG, M4A or WEBM audio file.");
      return;
    }

    if (file.size === 0) {
      setError("The selected audio file is empty.");
      return;
    }

    if (file.size > MAX_MUSIC_SIZE) {
      setError("Birthday music must be smaller than 3 MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      setMusic({
        name: file.name,
        dataUrl,
        type: file.type,
        size: file.size,
      });

      setMusicPlaying(false);
    } catch {
      setError("Unable to read the selected music file.");
    }
  }

  function removeMusic() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setMusic(null);
    setMusicPlaying(false);
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
      setError("Unable to play this audio file in your browser.");
    }
  }

  function handleVolumeChange(value: number) {
    setMusicVolume(value);

    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }

  function handleContinue() {
    const savedDraft = sessionStorage.getItem("secretwish_draft");

    if (!savedDraft) {
      router.replace("/dashboard/create");
      return;
    }

    try {
      const draft = JSON.parse(savedDraft) as WishDraft;

      sessionStorage.setItem(
        "secretwish_draft",
        JSON.stringify({
          ...draft,
          photos,
          music,
        })
      );

      router.push("/dashboard/create/review");
    } catch {
      setError(
        "Unable to save your draft. Your selected files may exceed browser storage limits."
      );
    }
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-[#d4af70]">
        Loading your memories...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-[#f5e8d0]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard/create/questions")}
          className="mb-10 flex items-center gap-2 text-sm text-[#a6a0ad] transition hover:text-[#d4af70]"
        >
          <ArrowLeft size={17} />
          Back to secret questions
        </button>

        {/* Heading */}
        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af70]">
            Preserve beautiful memories
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your <span className="text-[#d4af70]">Memories</span>
          </h1>

          <p className="mt-4 text-[#a6a0ad]">
            Add special photos and a favourite song to make this birthday
            surprise unforgettable.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-9 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />

          <span className="ml-2 text-xs text-[#a6a0ad]">
            Step 3 of 3
          </span>
        </div>

        {/* Photo upload */}
        <section className="rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
                <Images size={23} />
              </div>

              <div>
                <h2 className="text-xl font-semibold">
                  Photo gallery
                </h2>

                <p className="text-sm text-[#918b99]">
                  Add up to 5 special memories
                </p>
              </div>
            </div>

            <span className="text-sm text-[#d4af70]">
              {photos.length}/5
            </span>
          </div>

          {photos.length < MAX_PHOTOS && (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#514638] bg-[#d4af70]/5 px-5 py-12 text-center transition hover:border-[#d4af70] hover:bg-[#d4af70]/10">
              <div className="mb-4 rounded-2xl bg-[#d4af70]/10 p-4 text-[#d4af70]">
                <ImagePlus size={30} />
              </div>

              <h3 className="font-semibold">
                Click to choose photos
              </h3>

              <p className="mt-2 text-sm text-[#918b99]">
                JPG, PNG, WEBP · Maximum 2 MB each
              </p>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoSelection}
                className="hidden"
              />
            </label>
          )}

          {/* Photo preview */}
          {photos.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 font-semibold">
                Selected memories
              </h3>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-xl border border-[#38343b] bg-[#090a10]"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={photo.name}
                      className="h-36 w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-2 top-2 rounded-lg bg-black/75 p-2 text-white transition hover:bg-red-600"
                      aria-label={`Remove ${photo.name}`}
                    >
                      <Trash2 size={16} />
                    </button>

                    <p className="truncate px-3 py-2 text-xs text-[#c7bdad]">
                      {photo.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {photos.length === 0 && (
            <div className="mt-6 text-center text-sm text-[#77717f]">
              You can continue without adding photos.
            </div>
          )}
        </section>

        {/* Birthday music */}
        <section className="mt-7 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
              <Music2 size={23} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">
                Birthday soundtrack
              </h2>

              <p className="text-sm text-[#918b99]">
                Add a song to make the surprise more special
              </p>
            </div>
          </div>

          {!music ? (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#514638] bg-[#d4af70]/5 px-5 py-10 text-center transition hover:border-[#d4af70] hover:bg-[#d4af70]/10">
              <div className="mb-4 rounded-2xl bg-[#d4af70]/10 p-4 text-[#d4af70]">
                <Music size={30} />
              </div>

              <h3 className="font-semibold">
                Choose birthday music
              </h3>

              <p className="mt-2 text-sm text-[#918b99]">
                MP3, WAV, OGG, M4A or WEBM
              </p>

              <p className="mt-1 text-xs text-[#77717f]">
                Maximum 3 MB · Optional
              </p>

              <input
                type="file"
                accept=".mp3,.wav,.ogg,.m4a,.webm,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm"
                onChange={handleMusicSelection}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-2xl border border-[#514638] bg-[#090a10] p-5">
              <audio
                ref={audioRef}
                src={music.dataUrl}
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
                  <p className="truncate font-semibold text-[#f5e8d0]">
                    {music.name}
                  </p>

                  <p className="mt-1 text-xs text-[#918b99]">
                    {(music.size / (1024 * 1024)).toFixed(2)} MB · Selected
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleMusicPreview}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#d4af70] to-[#a77b40] text-[#111019] transition hover:brightness-110"
                  aria-label={musicPlaying ? "Pause preview" : "Play preview"}
                >
                  {musicPlaying ? (
                    <Pause size={19} />
                  ) : (
                    <Play size={19} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={removeMusic}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-400 transition hover:bg-red-500/20"
                  aria-label="Remove music"
                >
                  <Trash2 size={17} />
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
          )}

          <p className="mt-4 text-xs leading-6 text-[#918b99]">
            Music is optional. The selected audio will be uploaded to private
            storage when you create the birthday wish. The recipient can play
            it after unlocking the surprise.
          </p>
        </section>

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        {/* Security notice */}
        <div className="mt-7 flex gap-3 rounded-2xl border border-[#38343b] bg-[#111219] p-5">
          <ShieldCheck
            className="mt-0.5 shrink-0 text-[#d4af70]"
            size={21}
          />

          <div>
            <h3 className="text-sm font-semibold">
              Your memories deserve privacy
            </h3>

            <p className="mt-1 text-xs leading-6 text-[#918b99]">
              Your selected photos and music are temporary browser previews.
              They will be uploaded to private Supabase storage during secure
              wish creation. Recipients will receive access only after
              successfully answering the secret questions.
            </p>
          </div>
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={handleContinue}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-4 font-semibold text-[#111019] transition hover:brightness-110"
        >
          Continue to review
          <ArrowRight size={19} />
          <Sparkles size={17} />
        </button>

        <p className="mt-4 text-center text-xs text-[#77717f]">
          You can review your birthday surprise before creating it.
        </p>
      </div>
    </main>
  );
}
