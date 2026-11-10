
import Link from "next/link";
import {
  ArrowRight,
  Gift,
  LockKeyhole,
  Sparkles,
  Heart,
  Camera,
  Music2,
  MessageCircleHeart,
  Clock,
  Star,
} from "lucide-react";

const features = [
  {
    icon: LockKeyhole,
    title: "Secret Questions",
    description:
      "Create personal questions that only your special person can answer.",
  },
  {
    icon: MessageCircleHeart,
    title: "Secret Messages",
    description:
      "Hide your heartfelt words behind a personalized surprise.",
  },
  {
    icon: Camera,
    title: "Memory Gallery",
    description:
      "Reveal your favourite memories through beautiful photographs.",
  },
  {
    icon: Music2,
    title: "Background Music",
    description:
      "Add meaningful music to make the surprise unforgettable.",
  },
  {
    icon: Gift,
    title: "Birthday Surprises",
    description:
      "Reveal a beautiful birthday cake with magical animations.",
  },
  {
    icon: Clock,
    title: "Birthday Countdown",
    description:
      "Build excitement with a countdown to their special day.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your wish",
    description:
      "Write your birthday message, upload photos and create secret questions.",
  },
  {
    number: "02",
    title: "Share the secret link",
    description:
      "Send your personalized surprise link to someone special.",
  },
  {
    number: "03",
    title: "Unlock the magic",
    description:
      "They answer your questions and discover the surprise waiting inside.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#08090d]">

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/[0.06]">
        <nav className="section-container flex h-20 items-center justify-between">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10">
              <Gift className="h-5 w-5 text-[#d4af70]" />
            </div>

            <span className="text-xl font-bold tracking-wide text-[#f5e8d0]">
              Secret<span className="gold-text">Wish</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-[#96919d] md:flex">
            <a href="#features" className="transition hover:text-[#d4af70]">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-[#d4af70]">
              How it works
            </a>
            <a href="#about" className="transition hover:text-[#d4af70]">
              About
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden text-sm text-[#f5e8d0] transition hover:text-[#d4af70] sm:block"
            >
              Log in
            </Link>

            <Link href="/register" className="luxury-button !px-4 !py-2.5 text-sm">
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>

        </nav>
      </header>

      {/* HERO SECTION */}
      <section className="hero-glow relative flex min-h-[680px] items-center justify-center px-5 py-24">

        <div className="absolute left-[10%] top-24 h-2 w-2 rounded-full bg-[#d4af70] opacity-60 blur-[1px]" />
        <div className="absolute right-[15%] top-40 h-1.5 w-1.5 rounded-full bg-[#f0d6a4] opacity-70" />
        <div className="absolute bottom-28 left-[22%] h-1 w-1 rounded-full bg-[#d4af70]" />

        <div className="relative z-10 mx-auto max-w-4xl text-center">

          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d4af70]/20 bg-[#d4af70]/[0.06] px-4 py-2 text-xs tracking-[0.18em] text-[#d4af70]">
            <Sparkles size={14} />
            MAKE EVERY MOMENT UNFORGETTABLE
          </div>

          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight text-[#f5e8d0] sm:text-6xl md:text-8xl">
            Some wishes
            <br />
            deserve to be
            <br />
            <span className="gold-text italic">
              unlocked.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-8 text-[#96919d] md:text-lg">
            Not just another birthday wish. Create a secret
            surprise filled with memories, meaningful questions
            and words straight from your heart.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">

            <Link href="/register" className="luxury-button">
              Create Your Surprise
              <ArrowRight size={17} />
            </Link>

            <a href="#how-it-works" className="outline-button">
              Discover the magic
            </a>

          </div>

          {/* FLOATING GIFT */}
          <div className="floating mx-auto mt-20 flex h-28 w-28 items-center justify-center rounded-[30px] border border-[#d4af70]/20 bg-gradient-to-br from-[#34243c] to-[#14151d] shadow-[0_0_80px_rgba(212,175,112,0.12)]">
            <Gift
              size={54}
              strokeWidth={1}
              className="text-[#d4af70]"
            />
          </div>

          <p className="mt-6 text-xs tracking-[0.25em] text-[#77717f]">
            A LITTLE MYSTERY. A LOT OF LOVE.
          </p>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="section-container py-28">

        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-4 text-xs tracking-[0.25em] text-[#d4af70]">
            THE EXPERIENCE
          </p>

          <h2 className="text-3xl font-semibold text-[#f5e8d0] md:text-5xl">
            More than a birthday wish.
          </h2>

          <p className="mt-5 leading-7 text-[#96919d]">
            Every detail is designed to make your special
            person feel like the main character of their day.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="glass-card group p-7 transition duration-300 hover:-translate-y-2 hover:border-[#d4af70]/40"
              >
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af70]/10 text-[#d4af70] transition group-hover:bg-[#d4af70]/20">
                  <Icon size={23} />
                </div>

                <h3 className="mb-3 text-lg font-semibold text-[#f5e8d0]">
                  {feature.title}
                </h3>

                <p className="text-sm leading-7 text-[#96919d]">
                  {feature.description}
                </p>
              </div>
            );
          })}

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-white/[0.06] bg-[#101118] py-28"
      >

        <div className="section-container">

          <div className="mx-auto mb-16 max-w-xl text-center">
            <p className="mb-4 text-xs tracking-[0.25em] text-[#d4af70]">
              THREE SIMPLE STEPS
            </p>

            <h2 className="text-3xl font-semibold text-[#f5e8d0] md:text-5xl">
              Create. Share. Reveal.
            </h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3">

            {steps.map((step) => (
              <div key={step.number} className="text-center">

                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#d4af70]/30 text-xl font-semibold text-[#d4af70]">
                  {step.number}
                </div>

                <h3 className="mb-3 text-xl font-semibold text-[#f5e8d0]">
                  {step.title}
                </h3>

                <p className="mx-auto max-w-xs text-sm leading-7 text-[#96919d]">
                  {step.description}
                </p>

              </div>
            ))}

          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section id="about" className="section-container py-28">

        <div className="glass-card relative overflow-hidden px-6 py-20 text-center md:px-12">

          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,112,0.09),transparent_65%)]" />

          <div className="relative z-10">

            <Heart className="mx-auto mb-7 text-[#d4af70]" size={32} />

            <h2 className="text-3xl font-semibold text-[#f5e8d0] md:text-5xl">
              Make their day
              <br />
              <span className="gold-text italic">
                unforgettable.
              </span>
            </h2>

            <p className="mx-auto mt-6 max-w-lg leading-7 text-[#96919d]">
              The best surprises are the ones that come
              from the heart. Create yours today.
            </p>

            <Link href="/register" className="luxury-button mt-9">
              Start Creating
              <Sparkles size={16} />
            </Link>

          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-8">

        <div className="section-container flex flex-col items-center justify-between gap-4 text-sm text-[#77717f] sm:flex-row">

          <Link href="/" className="font-semibold tracking-wide text-[#f5e8d0]">
            Secret<span className="gold-text">Wish</span>
          </Link>

          <p>
            Made with <Heart size={12} className="mx-1 inline text-[#d4af70]" /> for unforgettable moments.
          </p>

          <p>© 2026 SecretWish</p>

        </div>
      </footer>

    </main>
  );
}
