
"use client";

import { useRef, useState } from "react";
import {
  CalendarDays,
  Copy,
  Gift,
  Loader2,
  Send,
  CheckCircle2,
  Clock,
  Link as LinkIcon,
  Trash2,
  QrCode,
  Share2,
  Download,
  X,
  ExternalLink,
  Heart,
  HeartCrack,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

type Wish = {
  id: string;
  recipient_name: string;
  birthday_date: string;
  slug: string;
  is_published: boolean;
  remaining_lives: number;
};

type WishListProps = {
  initialWishes: Wish[];
};

type QRWish = {
  wish: Wish;
  url: string;
};

export default function WishList({ initialWishes }: WishListProps) {
  const [wishes, setWishes] = useState(initialWishes);

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [qrLoadingId, setQrLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [shareLinks, setShareLinks] = useState<Record<string, string>>({});
  const [qrWish, setQrWish] = useState<QRWish | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const isBusy =
    publishingId !== null ||
    copyingId !== null ||
    sharingId !== null ||
    qrLoadingId !== null ||
    deletingId !== null;

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

  function getLives(wish: Wish) {
    return Math.max(0, Math.min(3, wish.remaining_lives ?? 3));
  }

  async function getShareUrl(wish: Wish): Promise<string> {
    const cachedUrl = shareLinks[wish.id];

    if (cachedUrl) return cachedUrl;

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

    const shareUrl = result.wish.shareUrl as string;

    setShareLinks((current) => ({
      ...current,
      [wish.id]: shareUrl,
    }));

    return shareUrl;
  }

  async function handlePublish(wish: Wish) {
    if (isBusy) return;

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
    if (isBusy) return;

    setCopyingId(wish.id);
    setError("");
    setSuccess("");

    try {
      const shareUrl = await getShareUrl(wish);

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

  async function handleShare(wish: Wish) {
    if (isBusy) return;

    setSharingId(wish.id);
    setError("");
    setSuccess("");

    try {
      const shareUrl = await getShareUrl(wish);

      if (navigator.share) {
        await navigator.share({
          title: `Birthday Surprise for ${wish.recipient_name}`,
          text: "I created a special birthday surprise for you!",
          url: shareUrl,
        });

        setSuccess("Share menu opened successfully!");
      } else {
        await navigator.clipboard.writeText(shareUrl);

        setSuccess(
          "Sharing is not supported in this browser. Link copied instead!"
        );
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      console.error("SHARE ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to share this birthday wish."
      );
    } finally {
      setSharingId(null);
    }
  }

  async function handleShowQR(wish: Wish) {
    if (isBusy) return;

    setQrLoadingId(wish.id);
    setError("");
    setSuccess("");

    try {
      const shareUrl = await getShareUrl(wish);

      setQrWish({
        wish,
        url: shareUrl,
      });
    } catch (err) {
      console.error("QR GENERATION ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to generate the QR code."
      );
    } finally {
      setQrLoadingId(null);
    }
  }

  function handleDownloadQR() {
    const canvas = qrCanvasRef.current;

    if (!canvas || !qrWish) {
      setError("QR code is not ready yet. Please try again.");
      return;
    }

    try {
      const imageUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");

      downloadLink.href = imageUrl;
      downloadLink.download = `secretwish-${qrWish.wish.slug}.png`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setSuccess("QR code downloaded successfully!");
    } catch (err) {
      console.error("QR DOWNLOAD ERROR:", err);
      setError("Unable to download the QR code.");
    }
  }

  async function handleDelete(wish: Wish) {
    if (isBusy) return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the birthday wish for ${wish.recipient_name}?\n\nThis will delete the birthday wish and its related data.\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(wish.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/wishes/${encodeURIComponent(wish.id)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to delete this birthday wish."
        );
      }

      setWishes((current) =>
        current.filter((item) => item.id !== wish.id)
      );

      setShareLinks((current) => {
        const updated = { ...current };
        delete updated[wish.id];
        return updated;
      });

      if (qrWish?.wish.id === wish.id) {
        setQrWish(null);
      }

      setSuccess(
        `Birthday wish for ${wish.recipient_name} was deleted successfully.`
      );
    } catch (err) {
      console.error("DELETE WISH ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while deleting the wish."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
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
              Hover over a wish to explore its details and sharing options.
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
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
            {wishes.map((wish) => {
              const lives = getLives(wish);

              return (
                <article
                  key={wish.id}
                  className="group relative z-0 rounded-2xl border border-[#302a24] bg-[#111219] p-4 shadow-lg transition-all duration-300 ease-out hover:z-30 hover:scale-[1.025] hover:border-[#d4af70]/50 hover:shadow-[0_20px_65px_rgba(212,175,112,0.13)] sm:p-5"
                >
                  {/* Compact view: name, hearts and publish status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d4af70]/10">
                        <Gift size={20} className="text-[#d4af70]" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                          {wish.recipient_name}
                        </h3>

                        <div className="mt-1 flex items-center gap-1.5">
                          {[0, 1, 2].map((index) => (
                            <span key={index}>
                              {index < lives ? (
                                <Heart
                                  size={17}
                                  className="fill-red-500 text-red-500"
                                />
                              ) : (
                                <HeartCrack
                                  size={17}
                                  className="text-[#994b55]"
                                />
                              )}
                            </span>
                          ))}

                          <span className="ml-1 text-[11px] text-[#96919d]">
                            {lives}/3
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {wish.is_published ? (
                        <span className="flex items-center gap-1 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1.5 text-[10px] font-medium text-green-400 sm:text-xs">
                          <CheckCircle2 size={12} />
                          Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full border border-[#d4af70]/20 bg-[#d4af70]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#d4af70] sm:text-xs">
                          <Clock size={12} />
                          Unpublished
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded details: revealed on hover or keyboard focus */}
                  <div className="grid grid-rows-[0fr] opacity-0 transition-all duration-300 ease-in-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                    <div className="overflow-hidden">
                      <div className="pt-5">
                        <div className="mb-4 flex items-center gap-2 text-sm text-[#96919d]">
                          <CalendarDays
                            size={16}
                            className="text-[#d4af70]"
                          />
                          {formatDate(wish.birthday_date)}
                        </div>

                        <div className="mb-5 rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              Recipient's Lives
                            </p>

                            <span className="text-sm font-bold text-red-400">
                              {lives}/3
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-3">
                            {[0, 1, 2].map((index) =>
                              index < lives ? (
                                <Heart
                                  key={index}
                                  size={24}
                                  className="fill-red-500 text-red-500 drop-shadow-[0_0_7px_rgba(239,68,68,0.35)]"
                                />
                              ) : (
                                <HeartCrack
                                  key={index}
                                  size={24}
                                  className="text-[#994b55]"
                                />
                              )
                            )}
                          </div>

                          <p className="mt-3 text-xs text-[#aaa2b2]">
                            {lives === 3 &&
                              "All three chances are available."}
                            {lives === 2 &&
                              "One heart has been broken. Two chances remain."}
                            {lives === 1 &&
                              "Only one chance remains!"}
                            {lives === 0 &&
                              "All hearts are broken. The surprise has been lost."}
                          </p>
                        </div>

                        <div className="border-t border-white/[0.06] pt-4">
                          {wish.is_published ? (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(wish)}
                                  disabled={isBusy}
                                  className="flex items-center justify-center gap-2 rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10 px-3 py-2.5 text-sm font-semibold text-[#d4af70] transition hover:bg-[#d4af70]/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {copyingId === wish.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Copy size={16} />
                                  )}
                                  Copy Link
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleShowQR(wish)}
                                  disabled={isBusy}
                                  className="flex items-center justify-center gap-2 rounded-xl border border-purple-400/30 bg-purple-500/10 px-3 py-2.5 text-sm font-semibold text-purple-300 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {qrLoadingId === wish.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <QrCode size={16} />
                                  )}
                                  QR Code
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleShare(wish)}
                                disabled={isBusy}
                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-4 py-3 text-sm font-semibold text-[#111019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {sharingId === wish.id ? (
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Share2 size={17} />
                                )}
                                Share Birthday Surprise
                              </button>

                              <p className="mt-2 flex items-center justify-center gap-2 text-xs text-[#77717f]">
                                <LinkIcon size={13} />
                                Share the link or download the QR code.
                              </p>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handlePublish(wish)}
                              disabled={isBusy}
                              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-4 py-3 text-sm font-semibold text-[#111019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {publishingId === wish.id ? (
                                <>
                                  <Loader2
                                    size={17}
                                    className="animate-spin"
                                  />
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

                          <button
                            type="button"
                            onClick={() => handleDelete(wish)}
                            disabled={isBusy}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/50 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === wish.id ? (
                              <>
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                                Deleting Wish...
                              </>
                            ) : (
                              <>
                                <Trash2 size={16} />
                                Delete Birthday Wish
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hover hint */}
                  <div className="mt-3 text-center text-[10px] tracking-wider text-[#77717f] transition-opacity duration-200 group-hover:hidden">
                    HOVER TO VIEW DETAILS
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Responsive QR Code Modal */}
      {qrWish && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 backdrop-blur-sm sm:p-5"
          onClick={() => setQrWish(null)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="qr-modal-title"
              className="relative my-auto max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border border-[#d4af70]/25 bg-[#111219] p-5 shadow-2xl shadow-black/50 sm:max-h-[calc(100dvh-40px)] sm:p-7"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setQrWish(null)}
                aria-label="Close QR code"
                className="absolute right-4 top-4 z-10 rounded-lg p-2 text-[#96919d] transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d4af70]/10">
                  <QrCode size={25} className="text-[#d4af70]" />
                </div>

                <p className="text-[10px] tracking-[0.25em] text-[#d4af70]">
                  SECRETWISH SHARING
                </p>

                <h2
                  id="qr-modal-title"
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  QR Code
                </h2>

                <p className="mt-2 text-sm text-[#96919d]">
                  Birthday surprise for {qrWish.wish.recipient_name}
                </p>

                <div className="mx-auto mt-5 inline-flex max-w-full rounded-2xl bg-white p-3">
                  <QRCodeCanvas
                    ref={qrCanvasRef}
                    value={qrWish.url}
                    size={220}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#111019"
                    style={{
                      display: "block",
                      width: "min(220px, 65vw)",
                      height: "auto",
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-[#96919d]">
                  Scan this QR code using a phone camera to open the birthday surprise.
                </p>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left">
                  <p className="mb-1 text-xs text-[#96919d]">
                    YOUR SHAREABLE LINK
                  </p>

                  <p className="break-all text-xs leading-5 text-[#d4af70]">
                    {qrWish.url}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(qrWish.url)
                        .then(() =>
                          setSuccess("Shareable link copied successfully!")
                        )
                        .catch(() => setError("Unable to copy the link."));
                    }}
                    className="mt-3 flex items-center gap-2 text-xs font-semibold text-white transition hover:text-[#d4af70]"
                  >
                    <Copy size={14} />
                    Copy this link
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQR}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-5 py-3 text-sm font-semibold text-[#111019] transition hover:brightness-110"
                >
                  <Download size={18} />
                  Download QR Code (PNG)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      qrWish.url,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-[#d4af70] transition hover:bg-white/5"
                >
                  <ExternalLink size={16} />
                  Preview Birthday Wish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
