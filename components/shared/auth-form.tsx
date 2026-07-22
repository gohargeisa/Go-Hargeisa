"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

export function AuthForm({ mode, locale }: { mode: "login" | "register"; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : `/${locale}/dashboard`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push(next);
      router.refresh();
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
      setError(error.message);
      return;
    }

    // If email confirmation is required, Supabase returns a user with no
    // active session yet — send them to check their inbox instead of the
    // dashboard, where requireUser() would just redirect them back here.
    if (data.user && !data.session) {
      setCheckEmail(true);
      return;
    }

    router.push(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="rounded-xl2 border border-secondary/30 bg-secondary/5 p-5 text-sm text-secondary-700">
        Almost there — check <strong>{email}</strong> for a confirmation link to finish creating your account.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "register" && (
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
        />
      )}
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
      />
      <input
        required
        type="password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
      </button>
    </form>
  );
}
