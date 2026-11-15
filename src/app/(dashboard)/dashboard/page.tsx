
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import {
  Gift,
  Heart,
  Plus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  BookOpen,
  ShieldCheck,
  CircleHelp,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import WishList from "./WishList";
import DashboardNav from "./DashboardNav";

type DashboardWish = {
  id: string;
  recipient_name: string;
  birthday_date: string;
  slug: string;
  is_published: boolean;
  remaining_lives: number;
};

async function DashboardContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Creator";

  const { data: wishes, error: wishesError } = await supabase
    .from("birthday_wishes")
    .select(
      "id, recipient_name, birthday_date, slug, is_published, remaining_lives"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (wishesError) {
    console.error("DASHBOARD WISH FETCH ERROR:", wishesError);
  }

  const allWishes: DashboardWish[] = (wishes || []).map((wish) => ({
    id: wish.id,
    recipient_name: wish.recipient_name,
    birthday_date: wish.birthday_date,
    slug: wish.slug,
    is_published: wish.is_published,
    remaining_lives: Math.max(
      0,
      Math.min(3, wish.remaining_lives ?? 3)
    ),
  }));

  const totalWishes = allWishes.length;

  const publishedWishes = allWishes.filter(
    (wish) => wish.is_published
  ).length;

  const draftWishes = totalWishes - publishedWishes;

  return (
    <main className="min-h-screen bg-[#08090d] text-[#f5e8d0]">
      <DashboardNav active="dashboard" />

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
        {/* Welcome section */}
        <section className="relative overflow-hidden rounded-3xl border border-[#d4af70]/20 bg-gradient-to-br from-[#211a20] via-[#15121b] to-[#0d0d14] p-7 shadow-[0_20px_80px_rgba(212,175,112,0.06)] sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#d4af70]/10 blur-[100px]" />

          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-purple-900/20 blur-[100px]" />

          <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d4af70]/25 bg-[#d4af70]/10 px-4 py-2 text-xs tracking-[0.2em] text-[#d4af70]">
                <Sparkles size={14} />
                YOUR SECRETWISH SPACE
              </div>

              <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
                Welcome back,{" "}
                <span className="text-[#d4af70]">
                  {fullName}
                </span>
                !
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-[#aaa2b2] sm:text-base">
                Create unforgettable birthday surprises, share
                secret memories and make someone's special day
                truly magical.
              </p>
            </div>

            <Link
              href="/dashboard/create"
              className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#e5c17e] to-[#a77b40] px-7 py-4 font-semibold text-[#171019] shadow-lg transition hover:-translate-y-1 hover:brightness-110"
            >
              <Plus size={20} />
              Create New Wish
              <Sparkles size={17} />
            </Link>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#38303a] bg-[#111019] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-[#d4af70]/10 p-3">
                <Gift size={23} className="text-[#d4af70]" />
              </div>

              <Sparkles size={18} className="text-[#77717f]" />
            </div>

            <p className="text-sm text-[#96919d]">
              Total Birthday Wishes
            </p>

            <p className="mt-2 text-4xl font-bold text-[#f5e8d0]">
              {totalWishes}
            </p>
          </div>

          <div className="rounded-2xl border border-[#38303a] bg-[#111019] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <CheckCircle2
                  size={23}
                  className="text-emerald-400"
                />
              </div>

              <span className="text-xs text-emerald-400">
                Active
              </span>
            </div>

            <p className="text-sm text-[#96919d]">
              Published Wishes
            </p>

            <p className="mt-2 text-4xl font-bold text-[#f5e8d0]">
              {publishedWishes}
            </p>
          </div>

          <div className="rounded-2xl border border-[#38303a] bg-[#111019] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="rounded-xl bg-purple-500/10 p-3">
                <FileText size={23} className="text-purple-400" />
              </div>

              <span className="text-xs text-purple-400">
                Private
              </span>
            </div>

            <p className="text-sm text-[#96919d]">
              Unpublished Drafts
            </p>

            <p className="mt-2 text-4xl font-bold text-[#f5e8d0]">
              {draftWishes}
            </p>
          </div>
        </section>

        {/* Birthday wishes collection */}
        <WishList initialWishes={allWishes} />

        {/* Quick actions */}
        <section className="mt-16">
          <div className="mb-7">
            <p className="mb-2 text-xs tracking-[0.25em] text-[#d4af70]">
              EXPLORE SECRETWISH
            </p>

            <h2 className="text-3xl font-semibold">
              Helpful Resources
            </h2>

            <p className="mt-2 text-sm text-[#96919d]">
              Everything you need to create and manage your surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/how-it-works"
              className="group rounded-2xl border border-[#38303a] bg-[#111019] p-6 transition hover:-translate-y-1 hover:border-[#d4af70]/40"
            >
              <div className="mb-5 inline-flex rounded-xl bg-[#d4af70]/10 p-3">
                <BookOpen
                  size={22}
                  className="text-[#d4af70]"
                />
              </div>

              <h3 className="font-semibold">
                How It Works
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#96919d]">
                Learn how to create and share a secret birthday wish.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-[#d4af70]">
                Explore
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            <Link
              href="/dashboard/user-guide"
              className="group rounded-2xl border border-[#38303a] bg-[#111019] p-6 transition hover:-translate-y-1 hover:border-[#d4af70]/40"
            >
              <div className="mb-5 inline-flex rounded-xl bg-purple-500/10 p-3">
                <FileText
                  size={22}
                  className="text-purple-400"
                />
              </div>

              <h3 className="font-semibold">
                User Guide
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#96919d]">
                Find instructions for managing your birthday surprises.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-[#d4af70]">
                Read Guide
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            <Link
              href="/dashboard/security"
              className="group rounded-2xl border border-[#38303a] bg-[#111019] p-6 transition hover:-translate-y-1 hover:border-[#d4af70]/40"
            >
              <div className="mb-5 inline-flex rounded-xl bg-emerald-500/10 p-3">
                <ShieldCheck
                  size={22}
                  className="text-emerald-400"
                />
              </div>

              <h3 className="font-semibold">
                Security & Privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#96919d]">
                Understand how your private messages and memories are protected.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-[#d4af70]">
                Learn More
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>

            <Link
              href="/dashboard/faq"
              className="group rounded-2xl border border-[#38303a] bg-[#111019] p-6 transition hover:-translate-y-1 hover:border-[#d4af70]/40"
            >
              <div className="mb-5 inline-flex rounded-xl bg-pink-500/10 p-3">
                <CircleHelp
                  size={22}
                  className="text-pink-400"
                />
              </div>

              <h3 className="font-semibold">
                Frequently Asked Questions
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#96919d]">
                Get answers to common questions about SecretWish.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm text-[#d4af70]">
                View FAQ
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </div>
            </Link>
          </div>
        </section>

        {/* Account footer */}
        <footer className="mt-16 border-t border-white/[0.06] py-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-sm font-semibold tracking-[0.2em]">
                SECRET
                <span className="text-[#d4af70]">WISH</span>
              </p>

              <p className="mt-2 text-xs text-[#77717f]">
                Create memories. Share happiness. Keep secrets.
              </p>
            </div>

            <div className="text-xs text-[#77717f]">
              Signed in as{" "}
              <span className="text-[#d4af70]">
                {user.email}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-[#d4af70]">
          <div className="text-center">
            <Heart
              size={34}
              className="mx-auto mb-4 animate-pulse"
            />
            <p className="text-sm tracking-[0.2em]">
              LOADING YOUR DASHBOARD
            </p>
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
