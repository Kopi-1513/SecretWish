
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Copy,
  ExternalLink,
  Gift,
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
} from "lucide-react";

type Wish = {
  id: string;
  recipient_name: string;
  birthday_date: string;
  slug: string;
  is_published: boolean;
};

type WishListProps = {
  initialWishes: Wish[];
};

export default function WishList({ initialWishes }: WishListProps) {
  const [wishes, setWishes] = useState(initialWishes);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [shareLinks, setShareLinks] = useState<Record<string, string>>(
    {}
  );

  function formatDate(date: string) {
    if (!date) return "Date not available";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date not available";
    }

    return new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsedDate);
  }

  async function handlePublish(wish: Wish) {
    if (publishingId) return;

    setPublishingId(wish.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/wishes/${encodeURIComponent(wish.id)}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to publish this birthday wish."
        );
      }

      const shareUrl = result.wish?.shareUrl;

      if (!shareUrl) {
        throw new Error("The server did not return a sharing link.");
      }

      setWishes((current) =>
        current.map((item) =>
          item.id === wish.id
            ? { ...item, is_published: true }
            : item
        )
      );

      setShareLinks((current) => ({
        ...current,
        [wish.id]: shareUrl,
      }));

      setSuccess(
        `Birthday wish for ${wish.recipient_name} published successfully!`
      );
    } catch (err) {
      console.error("PUBLISH ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setPublishingId(null);
    }
  }

  async function handleCopyLink(wish: Wish) {
    setCopyingId(wish.id);
    setError("");
    setSuccess("");

    try {
      let shareUrl = shareLinks[wish.id];

      // Recover the URL if the page was refreshed after publishing.
      if (!shareUrl) {
        const response = await fetch(
          `/api/wishes/${encodeURIComponent(wish.id)}/publish`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.wish?.shareUrl) {
          throw new Error(
            result.error || "Unable to retrieve the sharing link."
          );
        }

        shareUrl = result.wish.shareUrl;

        setShareLinks((current) => ({
          ...current,
          [wish.id]: shareUrl,
        }));
      }

      await navigator.clipboard.writeText(shareUrl);

      setSuccess("Shareable link copied successfully!");
    } catch (err) {
      console.error("COPY LINK ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to copy the sharing link."
      );
    } finally {
      setCopyingId(null);
    }
  }

  return (
    <section className="mt-16">
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs tracking-[0.25em] text-[#d4af70]">
            YOUR COLLECTION
          </p>

          <h2 className="text-3xl font-semibold">
            My Birthday Wishes
          </h2>

          <p className="mt-2 text-sm text-[#96919d]">
            Manage your birthday surprises and sharing links.
          </p>
        </div>

        <div className="hidden rounded-xl border border-[#d4af70]/20 bg-[#d4af70]/10 px-4 py-3 text-center sm:block">
          <p className="text-2xl font-bold text-[#d4af70]">
            {wishes.length}
          </p>
          <p className="text-xs text-[#96919d]">Total wishes</p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="mb-5 rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10 p-4 text-sm text-[#d4af70]"
        >
          <CheckCircle2 size={17} className="mr-2 inline" />
          {success}
        </div>
      )}

      {wishes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#38343b] bg-[#111219] px-6 py-16 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d4af70]/10">
            <Gift size={30} className="text-[#d4af70]" />
          </div>

          <h3 className="text-xl font-semibold">
            No birthday wishes yet
          </h3>

          <p className="mt-3 text-sm text-[#96919d]">
            Your birthday surprises will appear here after you create them.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {wishes.map((wish) => (
            <article
              key={wish.id}
              className="rounded-3xl border border-[#302a24] bg-[#111219] p-6 transition hover:border-[#d4af70]/40"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af70]/10">
                    <Gift size={23} className="text-[#d4af70]" />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      {wish.recipient_name}
                    </h3>

                    <p className="mt-1 text-xs text-[#77717f]">
                      Birthday surprise
                    </p>
                  </div>
                </div>

                {wish.is_published ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
                    <CheckCircle2 size={13} />
                    Published
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full border border-[#d4af70]/20 bg-[#d4af70]/10 px-3 py-1.5 text-xs text-[#d4af70]">
                    <Clock size={13} />
                    Unpublished
                  </span>
                )}
              </div>

              <div className="mb-6 flex items-center gap-2 text-sm text-[#96919d]">
                <CalendarDays size={16} className="text-[#d4af70]" />
                {formatDate(wish.birthday_date)}
              </div>

              <div className="border-t border-white/[0.06] pt-5">
                {wish.is_published ? (
                  <button
                    type="button"
                    onClick={() => handleCopyLink(wish)}
                    disabled={copyingId === wish.id}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10 px-5 py-3 text-sm font-semibold text-[#d4af70] transition hover:bg-[#d4af70]/20 disabled:opacity-50"
                  >
                    {copyingId === wish.id ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Copy size={17} />
                    )}

                    Copy Share Link
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePublish(wish)}
                    disabled={publishingId !== null}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-5 py-3 text-sm font-semibold text-[#111019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {publishingId === wish.id ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send size={17} />
                        Publish Birthday Wish
                      </>
                    )}
                  </button>
                )}

                {wish.is_published && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-xs text-[#77717f]">
                    <LinkIcon size={13} />
                    Your surprise is ready to share.
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
