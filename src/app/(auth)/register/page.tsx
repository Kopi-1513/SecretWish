
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Gift,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Heart,
  AlertCircle,
} from "lucide-react";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const passwordRules = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(password),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const strength = passwordRules.filter(
    (rule) => rule.valid
  ).length;

  const strengthLabel =
    strength <= 2
      ? "Weak"
      : strength <= 3
        ? "Fair"
        : strength <= 4
          ? "Good"
          : "Strong";

  const strengthColor =
    strength <= 2
      ? "bg-red-500"
      : strength <= 3
        ? "bg-yellow-500"
        : strength <= 4
          ? "bg-blue-500"
          : "bg-emerald-500";

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (strength !== 5) {
      setError("Please meet all password requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
            emailRedirectTo: `${window.location.origin}/callback`,
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);

      setPassword("");
      setConfirmPassword("");

} catch (err) {
  console.error("SECRETWISH REGISTRATION ERROR:", err);

  const message =
    err instanceof Error
      ? err.message
      : "Unknown registration error";

  setError(message);
} finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08090d]">

      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-[#34243c]/25 blur-[150px]" />

        <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-[#d4af70]/10 blur-[150px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#08090d_85%)]" />
      </div>

      {/* Navigation */}
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
            href="/login"
            className="text-sm text-[#96919d] transition hover:text-[#d4af70]"
          >
            Already have an account?
            <span className="ml-2 font-semibold text-[#d4af70]">
              Log in
            </span>
          </Link>

        </nav>
      </header>

      {/* Registration content */}
      <section className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-5 py-16">

        <div className="grid w-full max-w-6xl items-center gap-16 lg:grid-cols-2">

          {/* Left side */}
          <div className="hidden lg:block">

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#d4af70]/20 bg-[#d4af70]/[0.06] px-4 py-2 text-xs tracking-[0.18em] text-[#d4af70]">
              <Sparkles size={14} />
              CREATE SOMETHING MAGICAL
            </div>

            <h1 className="text-6xl font-semibold leading-[1.2] text-[#f5e8d0]">
              Every surprise
              <br />
              starts with a
              <br />
              <span className="gold-text italic">
                little magic.
              </span>
            </h1>

            <p className="mt-7 max-w-md leading-8 text-[#96919d]">
              Create unforgettable birthday experiences.
              Hide your memories, write secret messages
              and make someone's special day truly magical.
            </p>

            <div className="mt-12 space-y-6">

              {[
                "Personalized birthday surprises",
                "Private messages and photo galleries",
                "Secret questions and answers",
                "Beautiful birthday animations",
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

          {/* Right side - Registration form */}
          <div className="glass-card mx-auto w-full max-w-[480px] p-7 shadow-2xl sm:p-10">

            {!success ? (
              <>
                <div className="mb-8 text-center">

                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/10">
                    <Heart
                      size={25}
                      className="text-[#d4af70]"
                    />
                  </div>

                  <p className="mb-3 text-xs tracking-[0.25em] text-[#d4af70]">
                    JOIN THE EXPERIENCE
                  </p>

                  <h2 className="text-3xl font-semibold text-[#f5e8d0]">
                    Create Account
                  </h2>

                  <p className="mt-3 text-sm text-[#96919d]">
                    Start creating unforgettable surprises.
                  </p>

                </div>

                {/* Error message */}
                {error && (
                  <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-4 text-sm text-red-300"
                  >
                    <AlertCircle
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleRegister}
                  className="space-y-5"
                >

                  {/* Full name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium text-[#e6dccb]"
                    >
                      Full Name
                    </label>

                    <div className="relative">
                      <User
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77717f]"
                      />

                      <input
                        id="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        minLength={2}
                        maxLength={80}
                        disabled={loading}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#08090d]/70 py-3.5 pl-12 pr-4 text-sm text-[#f5e8d0] outline-none transition placeholder:text-[#68636e] focus:border-[#d4af70]/60 focus:ring-2 focus:ring-[#d4af70]/10 disabled:opacity-50"
                      />
                    </div>
                  </div>

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
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-[#e6dccb]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77717f]"
                      />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Create a strong password"
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

                    {/* Password strength */}
                    {password.length > 0 && (
                      <div className="mt-4">

                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="text-[#96919d]">
                            Password strength
                          </span>

                          <span className="font-medium text-[#d4af70]">
                            {strengthLabel}
                          </span>
                        </div>

                        <div className="flex gap-1.5">
                          {passwordRules.map((rule) => (
                            <div
                              key={rule.label}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                rule.valid
                                  ? strengthColor
                                  : "bg-white/[0.08]"
                              }`}
                            />
                          ))}
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {passwordRules.map((rule) => (
                            <div
                              key={rule.label}
                              className={`flex items-center gap-2 text-xs ${
                                rule.valid
                                  ? "text-emerald-400"
                                  : "text-[#77717f]"
                              }`}
                            >
                              <CheckCircle2 size={13} />
                              {rule.label}
                            </div>
                          ))}
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-[#e6dccb]"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77717f]"
                      />

                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        required
                        disabled={loading}
                        className="w-full rounded-xl border border-white/[0.08] bg-[#08090d]/70 py-3.5 pl-12 pr-12 text-sm text-[#f5e8d0] outline-none transition placeholder:text-[#68636e] focus:border-[#d4af70]/60 focus:ring-2 focus:ring-[#d4af70]/10 disabled:opacity-50"
                      />

                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#77717f] transition hover:text-[#d4af70]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <p
                        className={`mt-2 text-xs ${
                          confirmPassword === password
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {confirmPassword === password
                          ? "Passwords match"
                          : "Passwords do not match"}
                      </p>
                    )}
                  </div>

                  {/* Terms */}
                  <p className="text-xs leading-6 text-[#77717f]">
                    By creating an account, you agree to use SecretWish
                    responsibly and keep your account credentials secure.
                  </p>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="luxury-button w-full !py-4 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#111016]/30 border-t-[#111016]" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create My Account
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                </form>

                {/* Login link */}
                <div className="mt-8 border-t border-white/[0.06] pt-6 text-center">
                  <p className="text-sm text-[#96919d]">
                    Already have an account?
                    <Link
                      href="/login"
                      className="ml-2 font-semibold text-[#d4af70] transition hover:text-[#f0d6a4]"
                    >
                      Log in
                    </Link>
                  </p>
                </div>

                {/* Security */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#77717f]">
                  <ShieldCheck size={15} className="text-[#d4af70]" />
                  Secure authentication powered by Supabase
                </div>
              </>
            ) : (
              /* Success screen */
              <div className="py-8 text-center">

                <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
                  <CheckCircle2
                    size={42}
                    className="text-emerald-400"
                  />
                </div>

                <p className="mb-3 text-xs tracking-[0.25em] text-[#d4af70]">
                  ONE STEP AWAY
                </p>

                <h2 className="text-3xl font-semibold text-[#f5e8d0]">
                  Check your email!
                </h2>

                <p className="mt-5 leading-7 text-[#96919d]">
                  Your SecretWish account has been created.
                  Please check your inbox and follow the
                  verification link to activate your account.
                </p>

                <div className="mt-6 rounded-xl border border-[#d4af70]/20 bg-[#d4af70]/[0.06] p-4 text-sm text-[#d4af70]">
                  {email}
                </div>

                <Link
                  href="/login"
                  className="luxury-button mt-8 w-full"
                >
                  Continue to Login
                  <ArrowRight size={17} />
                </Link>

                <p className="mt-5 text-xs text-[#77717f]">
                  If you don't see the email, check your spam folder.
                </p>

              </div>
            )}

          </div>
        </div>
      </section>

    </main>
  );
}
