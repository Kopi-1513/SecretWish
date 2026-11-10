
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Gift,
  Sparkles,
  Heart,
  Plus,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
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

  return (
    <main className="min-h-screen bg-[#08090d] text-[#f5e8d0]">

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

          <button
            disabled
            className="luxury-button mt-8 cursor-not-allowed opacity-60"
          >
            <Plus size={18} />
            Create Birthday Wish
            <Sparkles size={16} />
          </button>

          <p className="mt-3 text-xs text-[#77717f]">
            Birthday wish creation is coming in the next development phase.
          </p>

        </div>

        <p className="mt-10 text-xs text-[#77717f]">
          Signed in as: {user.email}
        </p>

      </section>
    </main>
  );
}
