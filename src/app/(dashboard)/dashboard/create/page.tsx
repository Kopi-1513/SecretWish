
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Heart, ImagePlus, Music2, Sparkles } from "lucide-react";

export default function CreateBirthdayWishPage() {
  const router = useRouter();

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [birthdayDate, setBirthdayDate] = useState("");
  const [secretMessage, setSecretMessage] = useState("");

  function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!recipientName.trim() || !birthdayDate || !secretMessage.trim()) {
      alert("Please complete all required fields.");
      return;
    }

    // Temporary: move to the next development stage.
    // Database saving will be connected in the next step.
    sessionStorage.setItem(
      "secretwish_draft",
      JSON.stringify({
        recipientName,
        recipientEmail,
        birthdayDate,
        secretMessage,
      })
    );

    router.push("/dashboard/create/questions");
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-[#f5e8d0]">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-10 flex items-center gap-2 text-sm text-[#a6a0ad] transition hover:text-[#d4af70]"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af70]">
            Create something unforgettable
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Create a <span className="text-[#d4af70]">Secret Wish</span>
          </h1>

          <p className="mt-4 text-[#a6a0ad]">
            Start creating a beautiful surprise for someone special.
          </p>
        </div>

        <div className="mb-8 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#292630]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#292630]" />
          <span className="ml-2 text-xs text-[#a6a0ad]">Step 1 of 3</span>
        </div>

        <form
          onSubmit={handleContinue}
          className="space-y-8 rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-9"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
              <Heart size={23} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">The special person</h2>
              <p className="text-sm text-[#918b99]">
                Who is this surprise for?
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-[#d8cdbb]">
                Recipient name *
              </label>
              <input
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Enter their name"
                className="w-full rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#d8cdbb]">
                Recipient email <span className="text-[#918b99]">(optional)</span>
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70]"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-[#d8cdbb]">
                <CalendarDays size={16} className="text-[#d4af70]" />
                Birthday date *
              </label>
              <input
                required
                type="date"
                value={birthdayDate}
                onChange={(e) => setBirthdayDate(e.target.value)}
                className="w-full rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70] [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="h-px bg-[#302a24]" />

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#d4af70]/10 p-3 text-[#d4af70]">
              <Sparkles size={23} />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your secret message</h2>
              <p className="text-sm text-[#918b99]">
                Write something from your heart.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#d8cdbb]">
              Birthday message *
            </label>
            <textarea
              required
              rows={6}
              value={secretMessage}
              onChange={(e) => setSecretMessage(e.target.value)}
              placeholder="Write your special birthday message here..."
              className="w-full resize-y rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70]"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-dashed border-[#514638] bg-[#d4af70]/5 p-4">
              <ImagePlus className="mb-3 text-[#d4af70]" size={22} />
              <p className="font-medium">Private photos</p>
              <p className="mt-1 text-xs text-[#918b99]">
                Add your memories in the next step.
              </p>
            </div>

            <div className="rounded-xl border border-dashed border-[#514638] bg-[#d4af70]/5 p-4">
              <Music2 className="mb-3 text-[#d4af70]" size={22} />
              <p className="font-medium">Background music</p>
              <p className="mt-1 text-xs text-[#918b99]">
                Choose a soundtrack later.
              </p>
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-4 font-semibold text-[#111019] transition hover:brightness-110"
          >
            Continue to secret questions
            <Sparkles size={18} />
          </button>

          <p className="text-center text-xs text-[#77717e]">
            Your surprise is private. Only you can manage it.
          </p>
        </form>
      </div>
    </main>
  );
}
