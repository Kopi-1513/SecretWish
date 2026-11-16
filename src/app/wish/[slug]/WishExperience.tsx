"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Heart,
  LockKeyhole,
  Sparkles,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  PartyPopper,
  CheckCircle2,
  Music2,
  Volume2,
  HeartCrack,
  Mic,
  Headphones,
} from "lucide-react";

type WishQuestion = {
  question: string;
  order: number;
};

type WishDetails = {
  recipientName: string;
  birthdayDate: string;
  remainingLives: number;
  questions: WishQuestion[];
};


type PrivatePhoto = {
  caption: string | null;
  url: string;
};

type PrivateMusic = {
  url: string;
  originalName: string;
  mimeType: string;
};

type PrivateVoice = {
  url: string;
  originalName: string;
  mimeType: string;
};

type CelebrationEffect =
  | "confetti"
  | "hearts"
  | "sparkles"
  | "fireworks"
  | "petals";

type Surprise = {
  secretMessage: string;
  photos: PrivatePhoto[];
  music: PrivateMusic | null;
  voice: PrivateVoice | null;
  celebrationEffects: CelebrationEffect[];
  // Backward compatibility with older API responses.
  celebrationEffect?: CelebrationEffect;
};

type ApiResult<T> = T & {
  error?: string;
  remainingLives?: number;
  lost?: boolean;
};

const confettiPieces = Array.from({ length: 65 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  delay: (index % 15) * 0.12,
  duration: 3 + (index % 5) * 0.5,
  rotation: index * 47,
  size: 6 + (index % 5) * 2,
  color:
    index % 4 === 0
      ? "#d4af70"
      : index % 4 === 1
        ? "#a78bfa"
        : index % 4 === 2
          ? "#f5e8d0"
          : "#e9a4c6",
}));

function ConfettiCelebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -30, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: [0, 35, -25, 30, -15],
            opacity: [0, 1, 1, 0],
            rotate: piece.rotation,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.5,
          }}
          className="absolute top-0 rounded-sm"
          style={{
            left: piece.left,
            width: `${piece.size}px`,
            height: `${piece.size * 1.6}px`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}

const floatingEffects = Array.from({ length: 42 }, (_, index) => ({
  id: index,
  left: `${(index * 29) % 100}%`,
  delay: (index % 14) * 0.18,
  duration: 4 + (index % 5) * 0.7,
  size: 14 + (index % 4) * 7,
}));

function HeartsCelebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floatingEffects.map((item) => (
        <motion.div
          key={item.id}
          initial={{ y: "110vh", x: 0, opacity: 0, scale: 0.6 }}
          animate={{
            y: "-15vh",
            x: [0, 25, -20, 18, 0],
            opacity: [0, 1, 1, 0],
            scale: [0.6, 1, 0.85],
            rotate: [0, 18, -14, 0],
          }}
          transition={{
            duration: item.duration,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-0 text-pink-400"
          style={{ left: item.left, fontSize: item.size }}
        >
          ♥
        </motion.div>
      ))}
    </div>
  );
}

function SparklesCelebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floatingEffects.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0.35, 1, 0],
            scale: [0.2, 1.25, 0.7, 1.4, 0.2],
            rotate: [0, 90, 180, 270, 360],
            y: [0, -35, 20, -15, 0],
          }}
          transition={{
            duration: 2.5 + (item.id % 4) * 0.5,
            delay: item.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute text-[#f5d88e] drop-shadow-[0_0_12px_rgba(245,216,142,0.9)]"
          style={{
            left: item.left,
            top: `${(item.id * 23) % 95}%`,
            fontSize: item.size,
          }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
}

function FireworksCelebration() {
  const bursts = Array.from({ length: 9 }, (_, index) => ({
    id: index,
    left: `${12 + ((index * 31) % 76)}%`,
    top: `${12 + ((index * 19) % 58)}%`,
    delay: index * 0.45,
    color: ["#f5d88e", "#e9a4c6", "#a78bfa", "#f5e8d0"][index % 4],
  }));

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((burst) => (
        <motion.div
          key={burst.id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            left: burst.left,
            top: burst.top,
            backgroundColor: burst.color,
            boxShadow: `0 0 18px 5px ${burst.color}`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0.2, 0],
            opacity: [0, 1, 0.8, 0],
            boxShadow: [
              `0 0 0px 0px ${burst.color}`,
              `0 0 22px 12px ${burst.color}`,
              `0 0 38px 24px ${burst.color}55`,
              `0 0 0px 0px ${burst.color}`,
            ],
          }}
          transition={{
            duration: 2.2,
            delay: burst.delay,
            repeat: Infinity,
            repeatDelay: 1.2,
          }}
        />
      ))}
    </div>
  );
}

function PetalsCelebration() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {floatingEffects.map((item) => (
        <motion.div
          key={item.id}
          initial={{ y: -40, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: [0, 45, -35, 30, -10],
            opacity: [0, 0.95, 0.9, 0],
            rotate: [0, 100, 220, 360],
          }}
          transition={{
            duration: item.duration + 1,
            delay: item.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-0 text-pink-300 drop-shadow-[0_0_8px_rgba(244,180,210,0.35)]"
          style={{ left: item.left, fontSize: item.size }}
        >
          ❀
        </motion.div>
      ))}
    </div>
  );
}

function CelebrationEffectRenderer({
  effects,
}: {
  effects: CelebrationEffect[];
}) {
  const selectedEffects =
    effects.length > 0 ? effects : (["confetti"] as CelebrationEffect[]);

  return (
    <>
      {selectedEffects.map((effect) => {
        switch (effect) {
          case "hearts":
            return <HeartsCelebration key={effect} />;
          case "sparkles":
            return <SparklesCelebration key={effect} />;
          case "fireworks":
            return <FireworksCelebration key={effect} />;
          case "petals":
            return <PetalsCelebration key={effect} />;
          case "confetti":
          default:
            return <ConfettiCelebration key={effect} />;
        }
      })}
    </>
  );
}

function BirthdayCakeAnimation() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -15, opacity: 0 }}
      animate={{
        scale: [0, 1.15, 1],
        rotate: [0, 5, -5, 0],
        opacity: 1,
      }}
      transition={{ duration: 1.3, ease: "easeOut" }}
      className="relative mx-auto my-12 flex h-56 w-56 items-center justify-center"
    >
      <div className="absolute inset-0 rounded-full bg-[#d4af70]/10 blur-3xl" />

      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center"
      >
        <div className="mb-1 flex justify-center gap-5">
          {[1, 2, 3].map((candle) => (
            <div key={candle} className="flex flex-col items-center">
              <motion.span
                animate={{
                  opacity: [0.6, 1, 0.7],
                  scale: [0.8, 1.2, 0.9],
                  rotate: [-8, 8, -8],
                }}
                transition={{
                  duration: 0.6 + candle * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mb-1 text-xl"
              >
                🔥
              </motion.span>

              <div className="h-7 w-2 rounded-sm bg-gradient-to-b from-[#f5dca5] to-[#c28b4e]" />
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="h-5 w-36 rounded-t-2xl border-b-2 border-[#f4d9ae] bg-gradient-to-r from-[#fff0c9] via-[#e8b9a0] to-[#fff0c9]" />

          <div className="relative h-16 w-40 overflow-hidden rounded-b-xl border-b-4 border-[#8f4f39] bg-gradient-to-r from-[#c98263] via-[#f0b28c] to-[#c98263]">
            <div className="absolute left-0 top-5 h-2 w-full bg-[#ffe4bb]/80" />
            <div className="absolute left-4 top-1 text-sm">✨</div>
            <div className="absolute right-5 top-2 text-sm">💖</div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm">
              ✨
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs tracking-[0.35em] text-[#d4af70]">
          MAKE A WISH
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.95, 1.1, 0.95] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute inset-3 -z-10 rounded-full border border-[#d4af70]/20"
      />
    </motion.div>
  );
}
function LivesDisplay({ remainingLives }: { remainingLives: number }) {
  return (
    <div className="mt-7 flex flex-col items-center">
      <p className="mb-3 text-xs tracking-[0.25em] text-[#aaa2b2]">
        YOUR REMAINING LIVES
      </p>

      <div className="flex items-center justify-center gap-4">
        {[0, 1, 2].map((index) => {
          const active = index < remainingLives;

          return (
            <motion.div
              key={index}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{
                scale: active ? 1 : 0.9,
                opacity: 1,
              }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              <Heart
                size={34}
                strokeWidth={1.7}
                fill={active ? "#e85d75" : "transparent"}
                className={
                  active
                    ? "text-[#e85d75] drop-shadow-[0_0_10px_rgba(232,93,117,0.35)]"
                    : "text-[#62545e]"
                }
              />
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-[#d4af70]">
        {remainingLives} of 3 lives remaining
      </p>
    </div>
  );
}

function LostWishScreen() {
  return (
    <motion.section
      key="lost"
      initial={{ opacity: 0, scale: 0.9, y: 25 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mx-auto max-w-xl text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 150, delay: 0.15 }}
        className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10"
      >
        <HeartCrack size={48} className="text-red-400" />
      </motion.div>

      <p className="mb-4 text-xs tracking-[0.35em] text-red-400">
        ALL YOUR CHANCES ARE GONE
      </p>

      <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
        You Lost Your
        <span className="mt-2 block text-red-400">Secret Wish</span>
      </h1>

      <div className="my-8 flex justify-center gap-4">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 0.85, 1] }}
            transition={{ duration: 0.7, delay: index * 0.15 }}
          >
            <HeartCrack size={30} className="text-red-500/50" />
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl border border-red-500/20 bg-[#151019] p-7 shadow-2xl sm:p-9">
        <h2 className="text-xl font-semibold text-[#f5e8d0]">
          The secret remains locked.
        </h2>

        <p className="mt-4 leading-8 text-[#aaa2b2]">
          You used all three chances to answer the secret questions.
          Unfortunately, this birthday surprise can no longer be unlocked.
        </p>

        <p className="mt-6 text-sm text-red-300">
          All three hearts are broken. Better luck next time.
        </p>
      </div>

      <p className="mt-8 text-xs tracking-widest text-[#77717f]">
        SECRETWISH · SOME SECRETS ARE MEANT TO STAY SECRET
      </p>
    </motion.section>
  );
}

export default function WishExperience({
  slug,
}: {
  slug: string;
}) {
  const [wish, setWish] = useState<WishDetails | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [surprise, setSurprise] = useState<Surprise | null>(null);

  const [loading, setLoading] = useState(true);
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  const remainingLives = wish?.remainingLives ?? 3;
  const hasLost = remainingLives <= 0;

  useEffect(() => {
    let active = true;

    async function loadWish() {
      try {
        const response = await fetch(
          `/api/public/wishes/${encodeURIComponent(slug)}`,
          { cache: "no-store" }
        );

        const result = (await response.json()) as ApiResult<{
          success: boolean;
          wish: WishDetails;
        }>;

        if (!response.ok) {
          throw new Error(
            result.error || "This birthday surprise is unavailable."
          );
        }

        if (!active) return;

        setWish({
          ...result.wish,
          remainingLives: Math.max(
            0,
            Math.min(3, result.wish.remainingLives ?? 3)
          ),
        });

        setAnswers(result.wish.questions.map(() => ""));
      } catch (err) {
        if (!active) return;

        setPageError(
          err instanceof Error
            ? err.message
            : "Unable to load this birthday surprise."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWish();

    return () => {
      active = false;
    };
  }, [slug]);

  function updateAnswer(index: number, value: string) {
    setAnswers((current) =>
      current.map((answer, i) => (i === index ? value : answer))
    );
  }

  async function handleVerification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!wish || verifying || surprise || hasLost) return;

    if (answers.some((answer) => !answer.trim())) {
      setError("Please answer all the secret questions.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await fetch(
        `/api/public/wishes/${encodeURIComponent(slug)}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ answers }),
        }
      );

      const result = (await response.json()) as ApiResult<{
        success: boolean;
        surprise: Omit<Surprise, "celebrationEffects"> & {
          celebrationEffects?: CelebrationEffect[];
          celebrationEffect?: CelebrationEffect;
        };
      }>;

      if (typeof result.remainingLives === "number") {
        setWish((current) =>
          current
            ? {
                ...current,
                remainingLives: Math.max(
                  0,
                  Math.min(3, result.remainingLives!)
                ),
              }
            : current
        );
      }

      if (!response.ok) {
        if (result.lost || result.remainingLives === 0) {
          setError("");
          return;
        }

        if (result.remainingLives === 2) {
          setError("Retry! You only have two lives to get your wish.");
          return;
        }

        if (result.remainingLives === 1) {
          setError(
            "Be careful! This is your last chance to get your secret wish."
          );
          return;
        }

        throw new Error(
          result.error || "Your answers could not be verified."
        );
      }

      if (!result.surprise) {
        throw new Error("The surprise could not be loaded.");
      }

      const allowedEffects = [
        "confetti",
        "hearts",
        "sparkles",
        "fireworks",
        "petals",
      ] as const;

      const receivedEffects: string[] = Array.isArray(
        result.surprise.celebrationEffects
      )
        ? result.surprise.celebrationEffects
        : result.surprise.celebrationEffect
          ? [result.surprise.celebrationEffect]
          : ["confetti"];

      const celebrationEffects = [
        ...new Set(
          receivedEffects.filter((effect) =>
            (allowedEffects as readonly string[]).includes(effect)
          )
        ),
      ] as CelebrationEffect[];

      setSurprise({
        ...result.surprise,
        celebrationEffects:
          celebrationEffects.length > 0 ? celebrationEffects : ["confetti"],
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070d] text-[#d4af70]">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin" size={34} />
          <p className="text-sm tracking-[0.2em]">
            PREPARING YOUR SURPRISE
          </p>
        </div>
      </main>
    );
  }

  if (pageError || !wish) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070d] px-5 text-[#f5e8d0]">
        <div className="max-w-md text-center">
          <Gift
            size={48}
            className="mx-auto mb-6 text-[#d4af70]"
          />

          <h1 className="text-3xl font-bold">
            A Secret Surprise
          </h1>

          <p className="mt-4 leading-7 text-[#aaa2b2]">
            {pageError || "This birthday wish could not be found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08070d] px-5 py-12 text-[#f5e8d0]">
      <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-[#d4af70]/10 blur-[120px]" />

      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-purple-900/10 blur-[120px]" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-16 text-center">
          <div className="mb-3 inline-flex items-center gap-2 text-sm font-semibold tracking-[0.3em]">
            SECRET
            <span className="text-[#d4af70]">WISH</span>
          </div>

          <p className="text-xs tracking-[0.25em] text-[#8c8494]">
            A LITTLE SURPRISE, JUST FOR YOU
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!envelopeOpened && !surprise && !hasLost && (
            <motion.section
              key="envelope"
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center"
            >
              <p className="mb-5 text-sm tracking-[0.3em] text-[#d4af70]">
                SOMEONE HAS A MESSAGE FOR YOU
              </p>

              <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
                Hey,{" "}
                <span className="text-[#d4af70]">
                  {wish.recipientName}
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-lg leading-7 text-[#aaa2b2]">
                Someone special has prepared something beautiful
                for you. There is a little secret waiting inside.
              </p>

              <motion.button
                type="button"
                onClick={() => setEnvelopeOpened(true)}
                whileHover={{ scale: 1.04, y: -5 }}
                whileTap={{ scale: 0.96 }}
                className="group mx-auto mt-16 block w-full max-w-sm"
              >
                <motion.div
                  animate={{
                    y: [0, -9, 0],
                    rotate: [0, 1, 0, -1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative mx-auto flex aspect-[1.4/1] items-center justify-center overflow-hidden rounded-2xl border border-[#d4af70]/50 bg-gradient-to-br from-[#3a2431] via-[#211722] to-[#101019] shadow-[0_20px_80px_rgba(212,175,112,0.13)]"
                >
                  <div className="absolute inset-4 rounded-xl border border-[#d4af70]/20" />

                  <div className="relative flex flex-col items-center">
                    <Gift
                      size={70}
                      strokeWidth={1}
                      className="text-[#d4af70] transition-transform duration-500 group-hover:scale-110"
                    />

                    <span className="mt-4 text-xs tracking-[0.3em] text-[#e6c991]">
                      A SECRET LETTER
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-5 text-[#d4af70]/40">
                    <Sparkles size={23} />
                  </div>

                  <div className="absolute left-5 top-5 text-[#d4af70]/40">
                    <Heart size={20} />
                  </div>
                </motion.div>

                <span className="mt-8 inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-[#e5c17e] to-[#a77b40] px-8 py-4 font-semibold text-[#171019] shadow-lg transition group-hover:brightness-110">
                  Open Your Surprise
                  <ArrowRight size={18} />
                </span>
              </motion.button>

              <p className="mt-7 text-xs text-[#77717f]">
                Made with love. Open when you're ready.
              </p>
            </motion.section>
          )}

          {envelopeOpened && !surprise && !hasLost && (
            <motion.section
              key="questions"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-xl"
            >
              <div className="mb-9 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af70]/30 bg-[#d4af70]/10">
                  <LockKeyhole
                    size={30}
                    className="text-[#d4af70]"
                  />
                </div>

                <p className="mb-3 text-xs tracking-[0.3em] text-[#d4af70]">
                  ONE LITTLE CHALLENGE
                </p>

                <h2 className="text-3xl font-bold sm:text-4xl">
                  Prove it's you
                </h2>

                <p className="mt-4 leading-7 text-[#aaa2b2]">
                  Answer these special questions to unlock your
                  birthday surprise.
                </p>

                <LivesDisplay remainingLives={remainingLives} />
              </div>

              <form
                onSubmit={handleVerification}
                className="rounded-3xl border border-[#38303a] bg-[#111019]/90 p-6 shadow-2xl sm:p-9"
              >
                <div className="space-y-7">
                  {wish.questions.map((item, index) => (
                    <div key={`${item.order}-${index}`}>
                      <label
                        htmlFor={`answer-${index}`}
                        className="mb-3 block text-sm font-medium leading-6 text-[#eee2cf]"
                      >
                        <span className="mr-2 text-[#d4af70]">
                          {String(index + 1).padStart(2, "0")}.
                        </span>

                        {item.question}
                      </label>

                      <input
                        id={`answer-${index}`}
                        type="text"
                        autoComplete="off"
                        value={answers[index] ?? ""}
                        onChange={(event) =>
                          updateAnswer(index, event.target.value)
                        }
                        placeholder="Your answer..."
                        maxLength={200}
                        required
                        disabled={verifying}
                        className="w-full rounded-xl border border-[#38343b] bg-[#090910] px-4 py-4 text-[#f5e8d0] outline-none transition placeholder:text-[#77717f] focus:border-[#d4af70] disabled:opacity-60"
                      />
                    </div>
                  ))}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
                  >
                    {error}
                  </motion.div>
                )}
                                <button
                  type="submit"
                  disabled={verifying || hasLost}
                  className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#e5c17e] to-[#a77b40] px-6 py-4 font-semibold text-[#171019] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {verifying ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      Checking your answers...
                    </>
                  ) : (
                    <>
                      Unlock My Surprise
                      <LockKeyhole size={18} />
                    </>
                  )}
                </button>

                <p className="mt-5 text-center text-xs text-[#77717f]">
                  Your surprise is waiting behind these questions.
                </p>
              </form>
            </motion.section>
          )}

          {hasLost && !surprise && <LostWishScreen />}

          {surprise && (
            <motion.section
              key="reveal"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Selected celebration effect appears only after verification */}
              <CelebrationEffectRenderer
                effects={surprise.celebrationEffects}
              />

              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d4af70]/40 bg-[#d4af70]/10">
                  <PartyPopper
                    size={38}
                    className="text-[#d4af70]"
                  />
                </div>

                <p className="mb-4 text-xs tracking-[0.35em] text-[#d4af70]">
                  THE SECRET IS UNLOCKED
                </p>

                <h1 className="text-4xl font-bold sm:text-6xl">
                  Happy Birthday,
                  <span className="mt-2 block text-[#d4af70]">
                    {wish.recipientName}!
                  </span>
                </h1>

                <div className="my-3 flex items-center justify-center gap-2 text-sm text-[#d4af70]">
                  <Sparkles size={16} />
                  <span>A special day. A special person.</span>
                  <Sparkles size={16} />
                </div>

                <BirthdayCakeAnimation />
              </motion.div>

              {/* Birthday message */}
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 rounded-3xl border border-[#d4af70]/30 bg-gradient-to-br from-[#211a20] to-[#111019] p-7 text-left shadow-[0_20px_80px_rgba(212,175,112,0.08)] sm:p-10"
              >
                <div className="mb-6 flex items-center gap-3">
                  <Heart
                    size={22}
                    className="text-[#d4af70]"
                  />

                  <h2 className="text-xl font-semibold">
                    A message for you
                  </h2>
                </div>

                <p className="whitespace-pre-wrap text-base leading-8 text-[#e6d9c6]">
                  {surprise.secretMessage}
                </p>

                <div className="mt-8 text-right text-2xl text-[#d4af70]">
                  With love ❤️
                </div>
              </motion.div>

              {/* Private voice message */}
              {surprise.voice && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="relative z-10 mt-8 rounded-3xl border border-purple-400/30 bg-gradient-to-br from-[#211a2c] via-[#171321] to-[#111019] p-6 text-left shadow-[0_15px_60px_rgba(167,139,250,0.09)] sm:p-8"
                >
                  <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-400/10">
                      <Mic
                        size={27}
                        className="text-purple-300"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs tracking-[0.25em] text-purple-300">
                        A PERSONAL MESSAGE
                      </p>

                      <h2 className="text-lg font-semibold text-[#f5e8d0]">
                        A Voice Note Just for You
                      </h2>

                      <p className="mt-1 truncate text-sm text-[#aaa2b2]">
                        {surprise.voice.originalName}
                      </p>
                    </div>

                    <Headphones
                      size={23}
                      className="shrink-0 text-purple-300"
                    />
                  </div>

                  <div className="rounded-2xl border border-purple-300/15 bg-black/20 p-4">
                    <audio
                      key={surprise.voice.url}
                      controls
                      preload="metadata"
                      className="w-full"
                      src={surprise.voice.url}
                    >
                      Your browser does not support audio playback.
                    </audio>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-[#c4b7d5]">
                    Someone took a moment to record these words
                    especially for you. Listen closely. 💜
                  </p>
                </motion.div>
              )}

              {/* Private birthday music */}
              {surprise.music && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: surprise.voice ? 0.8 : 0.7 }}
                  className="relative z-10 mt-8 rounded-3xl border border-[#d4af70]/30 bg-gradient-to-br from-[#211a20] to-[#111019] p-6 text-left shadow-[0_15px_60px_rgba(212,175,112,0.07)] sm:p-8"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d4af70]/30 bg-[#d4af70]/10">
                      <Music2
                        size={24}
                        className="text-[#d4af70]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold">
                        A Song Just for You
                      </h2>

                      <p className="mt-1 truncate text-sm text-[#aaa2b2]">
                        {surprise.music.originalName}
                      </p>
                    </div>

                    <Volume2
                      size={20}
                      className="shrink-0 text-[#d4af70]"
                    />
                  </div>

                  <audio
                    key={surprise.music.url}
                    controls
                    preload="metadata"
                    className="w-full"
                    src={surprise.music.url}
                  >
                    Your browser does not support audio playback.
                  </audio>

                  <p className="mt-3 text-xs text-[#8c8494]">
                    A little music to make your special day even more memorable.
                  </p>
                </motion.div>
              )}

              {/* Private memory gallery */}
              {surprise.photos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: surprise.music || surprise.voice ? 0.9 : 0.8,
                  }}
                  className="relative z-10 mt-12"
                >
                  <div className="mb-6 flex items-center justify-center gap-3">
                    <ImageIcon className="text-[#d4af70]" />

                    <h2 className="text-2xl font-semibold">
                      Our Memories
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {surprise.photos.map((photo, index) => (
                      <motion.figure
                        key={`${photo.url}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay: 1 + index * 0.15,
                        }}
                        className="overflow-hidden rounded-2xl border border-[#d4af70]/20 bg-[#111019]"
                      >
                        <img
                          src={photo.url}
                          alt={photo.caption || "Birthday memory"}
                          loading="lazy"
                          className="h-64 w-full object-cover transition duration-700 hover:scale-105"
                        />

                        {photo.caption && (
                          <figcaption className="px-4 py-3 text-sm text-[#c7bdad]">
                            {photo.caption}
                          </figcaption>
                        )}
                      </motion.figure>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Final celebration */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="relative z-10 mt-12"
              >
                <div className="mb-4 flex items-center justify-center gap-2 text-[#d4af70]">
                  <CheckCircle2 size={18} />
                  <span className="text-sm">
                    Your surprise has been unlocked
                  </span>
                </div>

                <p className="text-sm tracking-widest text-[#d4af70]">
                  MADE WITH LOVE, JUST FOR YOU ✨
                </p>
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="relative mt-20 border-t border-white/[0.06] pt-7 text-center">
          <p className="text-xs tracking-widest text-[#77717f]">
            SECRETWISH · A SURPRISE WORTH REMEMBERING
          </p>
        </footer>
      </div>
    </main>
  );
}