
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
  Mic,
  Square,
  Trash2,
  Upload,
  AudioLines,
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

type VoiceDraft = {
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
  voice?: VoiceDraft | null;
};

type CreatedWish = {
  id: string;
  slug: string;
  photoCount: number;
  musicUploaded: boolean;
  musicName: string | null;
  voiceUploaded: boolean;
  voiceName: string | null;
};

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const MAX_MUSIC_SIZE = 3 * 1024 * 1024;
const MAX_VOICE_SIZE = 2 * 1024 * 1024;

const STORAGE_BUCKET = "wish-photos";
const MUSIC_BUCKET = "wish-music";
const VOICE_BUCKET = "wish-voice";

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
  const normalized = type.toLowerCase().split(";")[0].trim();

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
      throw new Error("Unsupported audio format.");
  }
}

function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read the audio file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Unable to read the audio file."));
    };

    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return fetch(dataUrl).then((response) => {
    if (!response.ok) {
      throw new Error("Unable to read the selected audio.");
    }
    return response.blob();
  });
}

export default function ReviewWishPage() {
  const router = useRouter();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTooLargeRef = useRef(false);
  const voiceFileInputRef = useRef<HTMLInputElement | null>(null);

  const [draft, setDraft] = useState<WishDraft | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [createdWish, setCreatedWish] =
    useState<CreatedWish | null>(null);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.7);

  const [voicePlaying, setVoicePlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

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

      setDraft({
        ...parsed,
        music: parsed.music ?? null,
        voice: parsed.voice ?? null,
      });

      setLoaded(true);
    } catch (error) {
      console.error("DRAFT LOADING ERROR:", error);
      router.replace("/dashboard/create");
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function updateDraft(updates: Partial<WishDraft>) {
    setDraft((current) => {
      if (!current) return current;

      const updated = {
        ...current,
        ...updates,
      };

      try {
        sessionStorage.setItem(
          "secretwish_draft",
          JSON.stringify(updated)
        );
      } catch (error) {
        console.error("DRAFT STORAGE ERROR:", error);
        setApiError(
          "Browser storage is full. Please remove some large photos or audio files and try again."
        );
      }

      return updated;
    });
  }

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

  async function toggleVoicePreview() {
    const audio = voiceAudioRef.current;
    if (!audio) return;

    try {
      if (audio.paused) {
        await audio.play();
        setVoicePlaying(true);
      } else {
        audio.pause();
        setVoicePlaying(false);
      }
    } catch {
      setApiError("Unable to play the voice message preview.");
    }
  }

  function stopVoicePreview() {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
    }
    setVoicePlaying(false);
  }

  async function handleVoiceUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setApiError("");

    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setApiError(
        "Unsupported voice format. Use MP3, WAV, OGG, M4A or WEBM."
      );
      return;
    }

    if (file.size === 0) {
      setApiError("The selected voice file is empty.");
      return;
    }

    if (file.size > MAX_VOICE_SIZE) {
      setApiError("Voice message must be smaller than 2 MB.");
      return;
    }

    setVoiceBusy(true);

    try {
      const dataUrl = await fileToDataUrl(file);

      stopVoicePreview();

      updateDraft({
        voice: {
          name: file.name,
          dataUrl,
          type: normalizeAudioType(file.type),
          size: file.size,
        },
      });
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Unable to load the voice message."
      );
    } finally {
      setVoiceBusy(false);
    }
  }

  async function startVoiceRecording() {
    setApiError("");

    if (
      typeof window === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setApiError(
        "Voice recording is not supported in this browser. Please upload an audio file instead."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingTooLargeRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);

          const currentSize = recordingChunksRef.current.reduce(
            (total, chunk) => total + chunk.size,
            0
          );

          if (currentSize > MAX_VOICE_SIZE) {
            recordingTooLargeRef.current = true;

            if (recorder.state === "recording") {
              recorder.stop();
            }
          }
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setRecording(false);

        if (recordingTooLargeRef.current) {
          setApiError(
            "Recording exceeded the 2 MB limit. Please record a shorter message."
          );
          recordingChunksRef.current = [];
          return;
        }

        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        recordingChunksRef.current = [];

        if (!blob.size) {
          setApiError("No audio was recorded. Please try again.");
          return;
        }

        try {
          const normalizedType = normalizeAudioType(blob.type);

          if (!ALLOWED_AUDIO_TYPES.includes(normalizedType)) {
            setApiError(
              "Your browser produced an unsupported audio format. Please upload an MP3 or another supported audio file."
            );
            return;
          }

          const dataUrl = await fileToDataUrl(blob);
          const extension = getAudioExtension(normalizedType);

          stopVoicePreview();

          updateDraft({
            voice: {
              name: `voice-message.${extension}`,
              dataUrl,
              type: normalizedType,
              size: blob.size,
            },
          });
        } catch (error) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Unable to save your recording."
          );
        }
      };

      recorder.onerror = () => {
        setApiError("An error occurred while recording your voice.");
        setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(1000);
      setRecording(true);
      setRecordingSeconds(0);
    } catch (error) {
      console.error("VOICE RECORDING ERROR:", error);

      setApiError(
        "Microphone access was denied or unavailable. Allow microphone permission or upload an audio file."
      );

      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function stopVoiceRecording() {
    const recorder = recorderRef.current;

    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }

  useEffect(() => {
    if (!recording) return;

    const interval = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [recording]);

  function removeVoiceMessage() {
    stopVoicePreview();

    if (recording) {
      stopVoiceRecording();
    }

    updateDraft({ voice: null });
  }

  function formatRecordingTime(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  }

  async function handleCreateWish() {
    if (!draft || saving || createdWish) return;

    setSaving(true);
    setApiError("");

    let supabase: ReturnType<typeof createClient> | null = null;
    let wishId: string | null = null;

    const uploadedPhotoPaths: string[] = [];
    const uploadedMusicPaths: string[] = [];
    const uploadedVoicePaths: string[] = [];

    try {
      if (recording) {
        throw new Error(
          "Please stop your voice recording before creating the wish."
        );
      }

      console.info("SECRETWISH: Starting wish creation");
      console.info("SECRETWISH: Selected photos:", draft.photos.length);
      console.info("SECRETWISH: Music selected:", !!draft.music);
      console.info("SECRETWISH: Voice selected:", !!draft.voice);

      // 1. Initialize Supabase client.
      supabase = createClient();

      // 2. Verify authenticated user.
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Your session has expired. Please log in again."
        );
      }

      // 3. Validate photos.
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

      // 4. Validate optional background music.
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

        const musicBlob = await dataUrlToBlob(draft.music.dataUrl);
        const mimeType = normalizeAudioType(
          musicBlob.type || draft.music.type
        );

        if (
          !ALLOWED_AUDIO_TYPES.some(
            (type) => normalizeAudioType(type) === mimeType
          )
        ) {
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

      // 5. Validate optional voice message.
      let validatedVoice: {
        name: string;
        blob: Blob;
        mimeType: string;
        extension: string;
      } | null = null;

      if (draft.voice) {
        if (!draft.voice.dataUrl) {
          throw new Error("Voice message data is missing.");
        }

        const voiceBlob = await dataUrlToBlob(draft.voice.dataUrl);
        const mimeType = normalizeAudioType(
          voiceBlob.type || draft.voice.type
        );

        if (
          !ALLOWED_AUDIO_TYPES.some(
            (type) => normalizeAudioType(type) === mimeType
          )
        ) {
          throw new Error("Unsupported voice message format.");
        }

        if (voiceBlob.size === 0) {
          throw new Error("The voice message is empty.");
        }

        if (voiceBlob.size > MAX_VOICE_SIZE) {
          throw new Error("Voice message must be smaller than 2 MB.");
        }

        validatedVoice = {
          name: draft.voice.name,
          blob: voiceBlob,
          mimeType,
          extension: getAudioExtension(mimeType),
        };
      }

      // 6. Create birthday wish through the API.
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

      // 7. Upload photos to private Supabase Storage.
      for (const photo of validatedPhotos) {
        const extension =
          photo.blob.type === "image/jpeg"
            ? "jpg"
            : photo.blob.type === "image/png"
              ? "png"
              : "webp";

        const storagePath =
          `${wishId}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, photo.blob, {
            contentType: photo.blob.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(
            `Photo upload failed (${photo.name}): ${uploadError.message}`
          );
        }

        uploadedPhotoPaths.push(storagePath);

        const { error: photoInsertError } = await supabase
          .from("wish_photos")
          .insert({
            wish_id: wishId,
            storage_path: storagePath,
            caption: photo.name,
          });

        if (photoInsertError) {
          throw new Error(
            `Unable to save photo information (${photo.name}): ${photoInsertError.message}`
          );
        }
      }

      // 8. Upload optional background music.
      if (validatedMusic) {
        const storagePath =
          `${wishId}/${crypto.randomUUID()}.${validatedMusic.extension}`;

        const { error: musicUploadError } = await supabase.storage
          .from(MUSIC_BUCKET)
          .upload(storagePath, validatedMusic.blob, {
            contentType: validatedMusic.mimeType,
            upsert: false,
          });

        if (musicUploadError) {
          throw new Error(
            `Music upload failed: ${musicUploadError.message}`
          );
        }

        uploadedMusicPaths.push(storagePath);

        const { error: musicInsertError } = await supabase
          .from("wish_music")
          .insert({
            wish_id: wishId,
            storage_path: storagePath,
            original_name: validatedMusic.name,
            mime_type: validatedMusic.mimeType,
          });

        if (musicInsertError) {
          throw new Error(
            `Unable to save music information: ${musicInsertError.message}`
          );
        }
      }

      // 9. Upload optional voice message to private storage.
      if (validatedVoice) {
        const storagePath =
          `${wishId}/${crypto.randomUUID()}.${validatedVoice.extension}`;

        const { error: voiceUploadError } = await supabase.storage
          .from(VOICE_BUCKET)
          .upload(storagePath, validatedVoice.blob, {
            contentType: validatedVoice.mimeType,
            upsert: false,
          });

        if (voiceUploadError) {
          throw new Error(
            `Voice message upload failed: ${voiceUploadError.message}`
          );
        }

        uploadedVoicePaths.push(storagePath);

        const { error: voiceInsertError } = await supabase
          .from("wish_voice")
          .insert({
            wish_id: wishId,
            storage_path: storagePath,
            original_name: validatedVoice.name,
            mime_type: validatedVoice.mimeType,
          });

        if (voiceInsertError) {
          throw new Error(
            `Unable to save voice message information: ${voiceInsertError.message}`
          );
        }
      }

      // 10. Show success only after every operation succeeds.
      setCreatedWish({
        id: wishId,
        slug: result.wish.slug,
        photoCount: uploadedPhotoPaths.length,
        musicUploaded: !!validatedMusic,
        musicName: validatedMusic?.name ?? null,
        voiceUploaded: !!validatedVoice,
        voiceName: validatedVoice?.name ?? null,
      });

      sessionStorage.removeItem("secretwish_draft");

      console.info("SECRETWISH: Wish creation completed successfully");
    } catch (error) {
      console.error("BIRTHDAY WISH CREATION ERROR:", error);

      // 11. Roll back partial uploads and records.
      if (wishId && supabase) {
        if (uploadedPhotoPaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove(uploadedPhotoPaths);

          if (cleanupError) {
            console.error("PHOTO CLEANUP ERROR:", cleanupError);
          }
        }

        if (uploadedMusicPaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(MUSIC_BUCKET)
            .remove(uploadedMusicPaths);

          if (cleanupError) {
            console.error("MUSIC CLEANUP ERROR:", cleanupError);
          }
        }

        if (uploadedVoicePaths.length > 0) {
          const { error: cleanupError } = await supabase.storage
            .from(VOICE_BUCKET)
            .remove(uploadedVoicePaths);

          if (cleanupError) {
            console.error("VOICE CLEANUP ERROR:", cleanupError);
          }
        }

        const { error: voiceDeleteError } = await supabase
          .from("wish_voice")
          .delete()
          .eq("wish_id", wishId);

        if (voiceDeleteError) {
          console.error("VOICE RECORD CLEANUP ERROR:", voiceDeleteError);
        }

        const { error: musicDeleteError } = await supabase
          .from("wish_music")
          .delete()
          .eq("wish_id", wishId);

        if (musicDeleteError) {
          console.error("MUSIC RECORD CLEANUP ERROR:", musicDeleteError);
        }

        const { error: photoDeleteError } = await supabase
          .from("wish_photos")
          .delete()
          .eq("wish_id", wishId);

        if (photoDeleteError) {
          console.error("PHOTO RECORD CLEANUP ERROR:", photoDeleteError);
        }

        const { error: wishDeleteError } = await supabase
          .from("birthday_wishes")
          .delete()
          .eq("id", wishId);

        if (wishDeleteError) {
          console.error("WISH CLEANUP ERROR:", wishDeleteError);
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
          disabled={saving || !!createdWish || recording}
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
                disabled={saving || recording}
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
                disabled={saving || recording}
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
                disabled={saving || recording}
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
                disabled={saving || recording}
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
                disabled={saving || recording}
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
                  disabled={saving || !!createdWish || recording}
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

        {/* Voice message */}
        <section className="mb-6 rounded-3xl border border-[#d4af70]/25 bg-[#111219] p-6 sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
              <Mic size={22} />
            </div>

            <div>
              <h2 className="text-xl font-semibold">Personal Voice Message</h2>
              <p className="mt-1 text-xs text-[#918b99]">
                Let them hear your voice after unlocking the surprise.
              </p>
            </div>
          </div>

          {draft.voice ? (
            <div className="rounded-2xl border border-[#514638] bg-[#090a10] p-5">
              <audio
                ref={voiceAudioRef}
                src={draft.voice.dataUrl}
                preload="metadata"
                onEnded={() => setVoicePlaying(false)}
                onPause={() => setVoicePlaying(false)}
              />

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#d4af70]/10 text-[#d4af70]">
                  <AudioLines size={27} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {draft.voice.name}
                  </p>
                  <p className="mt-1 text-xs text-[#918b99]">
                    {(draft.voice.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleVoicePreview}
                  disabled={saving || !!createdWish || recording}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#d4af70] to-[#a77b40] text-[#111019] transition hover:brightness-110 disabled:opacity-50"
                  aria-label={voicePlaying ? "Pause voice message" : "Play voice message"}
                >
                  {voicePlaying ? (
                    <Pause size={19} />
                  ) : (
                    <Play size={19} />
                  )}
                </button>
              </div>

              {!createdWish && (
                <button
                  type="button"
                  onClick={removeVoiceMessage}
                  disabled={saving || recording}
                  className="mt-5 flex items-center gap-2 text-sm text-red-400 transition hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remove voice message
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#514638] bg-[#090a10] p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af70]/10 text-[#d4af70]">
                <Mic size={29} />
              </div>

              <p className="font-medium">Add your personal voice</p>
              <p className="mt-2 text-xs leading-6 text-[#918b99]">
                Record a heartfelt message or upload an existing audio file.
                Maximum file size: 2 MB.
              </p>
            </div>
          )}

          <input
            ref={voiceFileInputRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/mp4,audio/wav,audio/x-wav,audio/ogg,audio/webm,audio/x-m4a"
            className="hidden"
            onChange={handleVoiceUpload}
            disabled={saving || !!createdWish || recording || voiceBusy}
          />

          {!createdWish && !draft.voice && (
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={recording ? stopVoiceRecording : startVoiceRecording}
                disabled={saving || voiceBusy}
                className={`flex items-center justify-center gap-2 rounded-xl px-5 py-4 font-semibold transition disabled:opacity-50 ${
                  recording
                    ? "border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    : "bg-gradient-to-r from-[#d4af70] to-[#a77b40] text-[#111019] hover:brightness-110"
                }`}
              >
                {recording ? (
                  <>
                    <Square size={17} fill="currentColor" />
                    Stop recording ({formatRecordingTime(recordingSeconds)})
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    Record Voice
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => voiceFileInputRef.current?.click()}
                disabled={saving || recording || voiceBusy}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#514638] bg-[#17151b] px-5 py-4 font-semibold text-[#e6d9c6] transition hover:border-[#d4af70]/60 disabled:opacity-50"
              >
                {voiceBusy ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                Upload Audio
              </button>
            </div>
          )}

          {recording && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-400" />
              <div>
                <p className="text-sm font-medium text-red-300">
                  Recording in progress
                </p>
                <p className="mt-1 text-xs text-[#918b99]">
                  {formatRecordingTime(recordingSeconds)} · Speak clearly into your microphone.
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs leading-6 text-[#918b99]">
            Your voice message is optional and will be stored privately.
            The recipient will only receive its playback link after successfully
            answering the secret questions.
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
              securely. Your selected photos, music and optional voice
              message will be uploaded to private storage when you create
              your wish.
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
              Your birthday details, hashed questions, photo records,
              music information and voice message information have been saved.
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

            <p className="mt-2 text-sm text-[#d4af70]">
              Voice message uploaded: {createdWish.voiceUploaded ? "Yes" : "No"}
            </p>

            {createdWish.voiceName && (
              <p className="mt-1 break-all text-xs text-[#c7bdad]">
                Voice file: {createdWish.voiceName}
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
            disabled={saving || recording || voiceBusy}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-4 font-semibold text-[#111019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={19} className="animate-spin" />
                Saving wish, photos, music and voice...
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
