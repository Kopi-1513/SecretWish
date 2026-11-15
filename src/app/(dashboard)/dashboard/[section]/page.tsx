
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { connection } from "next/server";
import {
  UserCheck,
  Heart,
  Image,
  Music2,
  LockKeyhole,
  Share2,
  BookOpen,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Gift,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import DashboardNav from "../DashboardNav";

// Allow this page to use request-time data during production builds.
export const instant = false;

type PageProps = {
  params: Promise<{ section: string }>;
};

const pageContent: Record<
  string,
  {
    eyebrow: string;
    title: string;
    description: string;
  }
> = {
  "how-it-works": {
    eyebrow: "THE SECRETWISH EXPERIENCE",
    title: "How SecretWish Works",
    description:
      "Discover how a simple birthday message becomes a personal and memorable surprise.",
  },
  "user-guide": {
    eyebrow: "YOUR PERSONAL GUIDE",
    title: "How to Use SecretWish",
    description:
      "Everything you need to know about creating, publishing and sharing birthday wishes.",
  },
  security: {
    eyebrow: "YOUR PRIVACY MATTERS",
    title: "Security & Privacy",
    description:
      "Understand how SecretWish handles access, private content and account security.",
  },
  faq: {
    eyebrow: "HELP CENTER",
    title: "Frequently Asked Questions",
    description:
      "Find answers to common questions about using SecretWish.",
  },
};

const workflow = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Register and sign in to access your personal SecretWish dashboard.",
    icon: UserCheck,
  },
  {
    number: "02",
    title: "Create a Birthday Wish",
    description:
      "Enter the recipient's name, birthday date and your personal message.",
    icon: Heart,
  },
  {
    number: "03",
    title: "Add Special Memories",
    description:
      "Upload photos that make your birthday surprise memorable.",
    icon: Image,
  },
  {
    number: "04",
    title: "Add Birthday Music",
    description:
      "Upload an optional audio file for the recipient to play after unlocking the surprise.",
    icon: Music2,
  },
  {
    number: "05",
    title: "Set Secret Questions",
    description:
      "Create questions and answers that the recipient must answer correctly.",
    icon: LockKeyhole,
  },
  {
    number: "06",
    title: "Publish and Share",
    description:
      "Publish your wish and share its unique link with the intended recipient.",
    icon: Share2,
  },
];

const creatorGuide = [
  "Sign in to your SecretWish account.",
  "Open the dashboard and select Create Birthday Wish.",
  "Enter the recipient's name, birthday date and secret message.",
  "Upload your photos and optional birthday music.",
  "Create secret questions and their correct answers.",
  "Review the details before publishing.",
  "Publish the wish and share its unique link.",
];

const recipientGuide = [
  "Open the unique birthday wish link.",
  "Read the welcome message and open the secret envelope.",
  "Answer all secret questions correctly.",
  "Unlock the birthday surprise.",
  "Read the personal birthday message.",
  "View the photos and play the music if included.",
];

const faqs = [
  {
    question: "Does the recipient need a SecretWish account?",
    answer:
      "No. The recipient can open a shared birthday wish link without creating an account. They must answer the secret questions correctly to unlock the surprise.",
  },
  {
    question: "Can I add photos and music?",
    answer:
      "Yes. You can add birthday photos and an optional music file while creating your wish.",
  },
  {
    question: "Why is my surprise not opening?",
    answer:
      "Check that the link is correct and that the wish has been published. If the issue continues, contact the website administrator.",
  },
  {
    question: "Why is the music not playing?",
    answer:
      "Check your device volume, browser audio settings and internet connection. Some browsers restrict automatic audio playback, so the recipient may need to press Play manually.",
  },
  {
    question: "Are my secret answers visible to recipients?",
    answer:
      "The public wish information endpoint is designed to return question text without exposing stored answer hashes. Answers are checked on the server.",
  },
  {
    question: "Can I share the birthday link publicly?",
    answer:
      "You can share the link, but it is safer to send it directly to the intended recipient. Anyone who gets the link may attempt to answer the secret questions.",
  },
  {
    question: "What happens when a signed media link expires?",
    answer:
      "The temporary media URL stops working after its configured expiry. The recipient may need to verify the surprise again to obtain a fresh URL.",
  },
];

async function InformationPage({ params }: PageProps) {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { section } = await params;
  const page = pageContent[section];

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-[#f5e8d0]">
      <DashboardNav active={`/dashboard/${section}`} />

      <section className="section-container min-h-[75vh] py-14">
        <div className="mb-12">
          <p className="mb-3 text-xs tracking-[0.25em] text-[#d4af70]">
            {page.eyebrow}
          </p>

          <h1 className="text-4xl font-semibold md:text-5xl">
            {page.title}
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-[#96919d]">
            {page.description}
          </p>
        </div>

        {/* HOW IT WORKS */}
        {section === "how-it-works" && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {workflow.map((step) => {
                const Icon = step.icon;

                return (
                  <div
                    key={step.number}
                    className="glass-card p-6 transition hover:-translate-y-1 hover:border-[#d4af70]/30"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#d4af70]/10">
                        <Icon className="text-[#d4af70]" size={23} />
                      </div>

                      <span className="text-sm tracking-widest text-[#d4af70]/60">
                        {step.number}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold">
                      {step.title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-[#96919d]">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/5 p-7">
              <div className="flex items-center gap-3">
                <Gift className="text-[#d4af70]" size={25} />
                <h2 className="text-xl font-semibold">
                  The Final Experience
                </h2>
              </div>

              <p className="mt-4 leading-7 text-[#aaa2b2]">
                The recipient opens the shared link, opens the secret
                envelope and answers the questions. After successful
                verification, the birthday message, private memories
                and optional music are revealed.
              </p>

              <Link
                href="/dashboard/create"
                className="luxury-button mt-6 inline-flex items-center gap-2"
              >
                Create Your Wish
                <ArrowRight size={17} />
              </Link>
            </div>
          </>
        )}

        {/* USER GUIDE */}
        {section === "user-guide" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="glass-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <BookOpen className="text-[#d4af70]" size={24} />
                <h2 className="text-xl font-semibold">
                  For Wish Creators
                </h2>
              </div>

              <div className="space-y-5">
                {creatorGuide.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d4af70]/30 text-sm text-[#d4af70]">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-7 text-[#c4bdc9]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard/create"
                className="mt-8 inline-flex items-center gap-2 text-sm text-[#d4af70] hover:text-[#f5dca5]"
              >
                Start Creating
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="glass-card p-7">
              <div className="mb-6 flex items-center gap-3">
                <Gift className="text-[#d4af70]" size={24} />
                <h2 className="text-xl font-semibold">
                  For Recipients
                </h2>
              </div>

              <div className="space-y-5">
                {recipientGuide.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d4af70]/30 text-sm text-[#d4af70]">
                      {index + 1}
                    </span>

                    <p className="text-sm leading-7 text-[#c4bdc9]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-[#d4af70]/20 bg-[#d4af70]/5 p-4">
                <p className="text-sm leading-6 text-[#c4bdc9]">
                  Recipients do not need to create an account to open a shared wish.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {section === "security" && (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[
                {
                  icon: LockKeyhole,
                  title: "Account Authentication",
                  description:
                    "Dashboard access requires authentication. The server checks the signed-in user before retrieving that user's birthday wishes.",
                },
                {
                  icon: Image,
                  title: "Private Media Storage",
                  description:
                    "Birthday photos and music are intended to be stored in private storage buckets rather than publicly accessible folders.",
                },
                {
                  icon: KeyRound,
                  title: "Secret Answer Verification",
                  description:
                    "Secret answers are compared on the server using bcrypt hashes. Correct answers are required before private surprise content is returned.",
                },
                {
                  icon: ShieldCheck,
                  title: "Temporary Media Links",
                  description:
                    "The verification API is designed to generate temporary signed media links after successful verification.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="glass-card p-6">
                    <Icon
                      className="mb-4 text-[#d4af70]"
                      size={26}
                    />

                    <h2 className="text-lg font-semibold">
                      {item.title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-[#96919d]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/5 p-7">
              <div className="mb-5 flex items-center gap-3">
                <ShieldCheck className="text-[#d4af70]" size={25} />
                <h2 className="text-xl font-semibold">
                  User Security Responsibilities
                </h2>
              </div>

              <ul className="space-y-4">
                {[
                  "Keep your account password confidential.",
                  "Never share your Supabase service role key or environment variables.",
                  "Avoid easily guessable secret answers.",
                  "Only upload photos and audio you own or have permission to share.",
                  "Do not publish another person's private information without permission.",
                  "Share birthday links only with intended recipients.",
                  "Sign out when using a shared or public computer.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-7 text-[#c4bdc9]">
                    <CheckCircle2
                      size={18}
                      className="mt-1 shrink-0 text-[#d4af70]"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-7">
              <div className="mb-3 flex items-center gap-3">
                <AlertTriangle className="text-amber-400" size={22} />
                <h2 className="font-semibold">
                  Important Security Information
                </h2>
              </div>

              <p className="text-sm leading-7 text-[#aaa2b2]">
                A published birthday link is a shareable access link.
                Anyone who receives it may attempt to answer its secret
                questions. Temporary signed URLs can be used by anyone
                who obtains them until they expire. The current
                verification route uses an in-memory development rate
                limiter, which is not a production-grade shared solution.
              </p>
            </div>

            <div className="mt-6 glass-card p-7">
              <h2 className="text-xl font-semibold">
                Recommended Security Improvements
              </h2>

              <p className="mt-3 text-sm leading-7 text-[#96919d]">
                These improvements should be implemented and tested before
                treating the application as production-ready.
              </p>

              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {[
                  "Persistent rate limiting across server instances.",
                  "Strict Row Level Security policy testing.",
                  "Server-side file type and size validation.",
                  "Content Security Policy and security headers.",
                  "Account and personal data deletion workflow.",
                  "Production security and access-control testing.",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-[#aaa2b2]">
                    <span className="text-[#d4af70]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* FAQ */}
        {section === "faq" && (
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition open:border-[#d4af70]/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="font-medium text-[#eee2cf]">
                    {item.question}
                  </span>

                  <span className="shrink-0 text-xl text-[#d4af70] transition group-open:rotate-45">
                    +
                  </span>
                </summary>

                <p className="mt-4 border-t border-white/[0.06] pt-4 text-sm leading-7 text-[#96919d]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        )}

        <div className="mt-14 border-t border-white/[0.06] pt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#d4af70] transition hover:text-[#f5dca5]"
          >
            <ArrowRight className="rotate-180" size={17} />
            Back to Dashboard
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 text-center">
        <div className="mb-3 flex items-center justify-center gap-2">
          <Gift size={18} className="text-[#d4af70]" />
          <span className="font-semibold">
            Secret<span className="gold-text">Wish</span>
          </span>
        </div>

        <p className="text-xs tracking-widest text-[#77717f]">
          CREATE MEMORIES. SHARE HAPPINESS. KEEP THE SURPRISE.
        </p>
      </footer>
    </main>
  );
}

export default InformationPage;
