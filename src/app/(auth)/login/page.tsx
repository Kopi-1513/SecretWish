
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Gift,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Heart,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setVerified(params.get("verified") === "1");

    if (params.get("error") === "verification") {
      setError(
        "Email verification failed or the link has expired. Please request a new verification email."
      );
    }
  }, []);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        setError(
          loginError.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : loginError.message
        );
        return;
      }

      setSuccess(true);

      router.replace("/dashboard");
      router.refresh();

    } catch (err) {
      console.error("SECRETWISH LOGIN ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d]">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#34243c]/25 blur-[150px]" />

        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#d4af70]/10 blur-[150px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#08090d_85%)]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/[0.06]">
        <nav className="section-container flex h-20 items-center justify-between">

          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10">
              <Gift className="h-5 w-5 text-[#d4af70]" />
            </div>

            <span className="text-xl font-bold tracking-wide text-[#f5e8d0]">
              Secret<span className="gold-text">Wish</span>
            </span>
          </Link>

          <Link
            href="/register"
            className="text-sm text-[#96919d] transition hover:text-[#d4af70]"
          >
            New here?
            <span className="ml-2 font-semibold text-[#d4af70]">
              Create account
            </span>
          </Link>

        </nav>
      </header>

      {/* Login section */}
      <section className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-16">

        <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">

          {/* Left content */}
          <div className="hidden lg:block">

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d4af70]/20 bg-[#d4af70]/[0.06] px-4 py-2 text-xs tracking-[0.18em] text-[#d4af70]">
              <Sparkles size={14} />
              WELCOME BACK
            </div>

            <h1 className="text-6xl font-semibold leading-[1.2] text-[#f5e8d0]">
              Your next
              <br />
              magical moment
              <br />
              <span className="gold-text italic">
                starts here.
              </span>
            </h1>

            <p className="mt-7 max-w-md leading-8 text-[#96919d]">
              Sign in to manage your birthday surprises,
              revisit your memories and create unforgettable
              experiences for the people you love.
            </p>

            <div className="mt-12 space-y-6">

              {[
                "Manage all your birthday surprises",
                "Create private messages and galleries",
                "Share unique secret links",
                "Make every celebration memorable",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm text-[#c4b9a8]"
                >
                  <CheckCircle2
                    size={19}
                    className="text-[#d4af70]"
                  />
                  {item}
                </div>
              ))}

            </div>

            <div className="floating mt-16 flex h-24 w-24 items-center justify-center rounded-[28px] border border-[#d4af70]/20 bg-gradient-to-br from-[#34243c] to-[#14151d] shadow-[0_0_70px_rgba(212,175,112,0.12)]">
              <Gift
                size={48}
                strokeWidth={1}
                className="text-[#d4af70]"
              />
            </div>

          </div>

          {/* Login form */}
          <div className="glass-card mx-auto w-full max-w-[480px] p-7 shadow-2xl sm:p-10">

            <div className="mb-8 text-center">

              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/10">
                <Heart
                  size={25}
                  className="text-[#d4af70]"
                />
              </div>

              <p className="mb-3 text-xs tracking-[0.25em] text-[#d4af70]">
                YOUR JOURNEY CONTINUES
              </p>

              <h2 className="text-3xl font-semibold text-[#f5e8d0]">
                Welcome Back
              </h2>

              <p className="mt-3 text-sm text-[#96919d]">
                Sign in to your SecretWish account.
              </p>

            </div>

            {/* Verification success */}
            {verified && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 text-sm text-emerald-300">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                Your email has been verified successfully! You can now sign in.
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-[#e6dccb]"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77717f]"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    maxLength={254}
                    disabled={loading}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090d]/70 py-3.5 pl-12 pr-4 text-sm text-[#f5e8d0] outline-none transition placeholder:text-[#68636e] focus:border-[#d4af70]/60 focus:ring-2 focus:ring-[#d4af70]/10 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[#e6dccb]"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77717f]"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    maxLength={72}
                    disabled={loading}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#08090d]/70 py-3.5 pl-12 pr-12 text-sm text-[#f5e8d0] outline-none transition placeholder:text-[#68636e] focus:border-[#d4af70]/60 focus:ring-2 focus:ring-[#d4af70]/10 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77717f] transition hover:text-[#d4af70]"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-[#d4af70] transition hover:text-[#f0d6a4]"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="luxury-button w-full !py-4 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#111016]/30 border-t-[#111016]" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

            </form>

            <div className="mt-8 border-t border-white/[0.06] pt-6 text-center">
              <p className="text-sm text-[#96919d]">
                Don't have an account?
                <Link
                  href="/register"
                  className="ml-2 font-semibold text-[#d4af70] transition hover:text-[#f0d6a4]"
                >
                  Create account
                </Link>
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#77717f]">
              <ShieldCheck size={15} className="text-[#d4af70]" />
              Secure authentication powered by Supabase
            </div>

          </div>

        </div>
      </section>

    </main>
  );
}
