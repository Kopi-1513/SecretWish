
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import {
  Gift,
  Sparkles,
  Heart,
  Plus,
  LogOut,
  ArrowRight,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import WishList from "./WishList";

function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#08090d] text-[#f5e8d0]">
      <div className="section-container py-16">
        <div className="animate-pulse">
          <div className="mb-4 h-4 w-48 rounded bg-white/10" />
          <div className="mb-4 h-12 w-96 max-w-full rounded bg-white/10" />
          <div className="h-5 w-72 max-w-full rounded bg-white/10" />
          <div className="mt-12 h-72 max-w-2xl rounded-2xl bg-white/10" />
        </div>
      </div>
    </main>
  );
}

async function DashboardContent() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const fullName =
    user.user_metadata?.full_name || "SecretWish Creator";

  // Retrieve only the current user's birthday wishes.
  const { data: wishes, error: wishesError } = await supabase
    .from("birthday_wishes")
    .select(
      "id, recipient_name, birthday_date, slug, is_published"
    )
    .eq("user_id", user.id);

  if (wishesError) {
    console.error("DASHBOARD WISH FETCH ERROR:", wishesError);
  }

  return (
    <main className="min-h-screen bg-[#08090d] text-[#f5e8d0]">
      {/* Header */}
      <header className="border-b border-white/[0.06]">
        <nav className="section-container flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10">
              <Gift className="h-5 w-5 text-[#d4af70]" />
            </div>

            <span className="text-xl font-bold">
              Secret<span className="gold-text">Wish</span>
            </span>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="outline-button !px-4 !py-2.5 text-sm"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </nav>
      </header>

      {/* Dashboard */}
      <section className="section-container py-16">
        <div className="mb-12">
          <p className="mb-3 text-xs tracking-[0.25em] text-[#d4af70]">
            YOUR PERSONAL SPACE
          </p>

          <h1 className="text-4xl font-semibold md:text-5xl">
            Welcome back,{" "}
            <span className="gold-text">{fullName}</span>
          </h1>

          <p className="mt-4 text-[#96919d]">
            Your next unforgettable surprise starts here.
          </p>
        </div>

        {/* Create Wish Card */}
        <div className="glass-card max-w-2xl p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d4af70]/10">
            <Heart size={28} className="text-[#d4af70]" />
          </div>

          <h2 className="text-2xl font-semibold">
            Ready to create some magic?
          </h2>

          <p className="mt-3 leading-7 text-[#96919d]">
            Create a personalized birthday surprise with
            secret questions, private messages and beautiful
            memories.
          </p>

          <Link
            href="/dashboard/create"
            className="luxury-button mt-8 inline-flex items-center gap-2 transition hover:brightness-110"
          >
            <Plus size={18} />
            Create Birthday Wish
            <Sparkles size={16} />
            <ArrowRight size={16} />
          </Link>

          <p className="mt-3 text-xs text-[#77717f]">
            Start creating a beautiful surprise for someone special.
          </p>
        </div>

        {/* Birthday Wishes */}
        {wishesError ? (
          <div className="mt-12 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400">
            Unable to load your birthday wishes. Please refresh the page.
          </div>
        ) : (
          <WishList initialWishes={wishes ?? []} />
        )}

        {/* User Information */}
        <p className="mt-10 text-xs text-[#77717f]">
          Signed in as: {user.email}
        </p>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
