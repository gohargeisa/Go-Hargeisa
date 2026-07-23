"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "text-red-600" };
  if (score <= 2) return { score, label: "Fair", color: "text-amber-600" };
  if (score <= 3) return { score, label: "Good", color: "text-blue-600" };
  return { score, label: "Strong", color: "text-green-600" };
}

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "Uppercase & lowercase letters", check: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: "At least one number", check: (p: string) => /\d/.test(p) },
  { label: "At least one special character", check: (p: string) => /[^a-zA-Z\d]/.test(p) },
];

export function AuthForm({ mode, locale }: { mode: "login" | "register"; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : `/${locale}/dashboard`;

  const passwordStrength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        // Better error messages
        if (error.message.includes("Invalid login credentials")) {
          setError("Email or password is incorrect.");
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please confirm your email address first.");
        } else {
          setError(error.message);
        }
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    // Register mode
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);
    if (error) {
      if (error.message.includes("already registered")) {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(error.message);
      }
      return;
    }

    if (data.user && !data.session) {
      setCheckEmail(true);
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6 text-sm">
        <p className="font-semibold text-secondary-700">Check your email</p>
        <p className="mt-2 text-secondary-600">
          We sent a confirmation link to <strong>{email}</strong>. Click it to verify your account and sign in.
        </p>
      </div>
    );
  }

  const nameError = mode === "register" && !name.trim() ? "Name is required" : "";
  const emailError = !email.includes("@") && email ? "Invalid email address" : "";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {mode === "register" && (
        <div>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="w-full rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          {nameError && <p className="mt-2 text-xs text-red-600">{nameError}</p>}
        </div>
      )}

      <div>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="w-full rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
        />
        {emailError && <p className="mt-2 text-xs text-red-600">{emailError}</p>}
      </div>

      <div>
        <div className="relative">
          <input
            required
            type={showPassword ? "text" : "password"}
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "register" ? "Create a strong password" : "Password"}
            className="w-full rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 pr-10 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/60 dark:hover:text-white/60 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {mode === "register" && (
          <>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 space-y-1.5">
                {passwordRequirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {req.check(password) ? (
                      <Check size={14} className="text-green-600 shrink-0" />
                    ) : (
                      <X size={14} className="text-ink/30 dark:text-white/30 shrink-0" />
                    )}
                    <span className={req.check(password) ? "text-ink/60 dark:text-white/60" : "text-ink/40 dark:text-white/40"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {password && (
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-ink/60 dark:text-white/60">Strength:</span>
                <span className={`font-semibold ${passwordStrength.color}`}>{passwordStrength.label}</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-2 rounded-full transition-colors ${
                        i < passwordStrength.score ? "bg-green-600" : "bg-ink/10 dark:bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || (mode === "register" && !isPasswordValid)}
        className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
      </button>
    </form>
  );
}
