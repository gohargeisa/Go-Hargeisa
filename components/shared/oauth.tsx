"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

/**
 * OAuth & Phone OTP Component
 *
 * Production-ready infrastructure for multiple auth methods.
 *
 * TODO (Supabase Dashboard Setup Required):
 * 1. For Google OAuth:
 *    - Go to Supabase Dashboard > Authentication > Providers
 *    - Enable Google provider
 *    - Configure OAuth2 credentials (Client ID, Client Secret)
 *    - Add authorized redirect URI: {YOUR_SITE_URL}/auth/callback
 *
 * 2. For Phone OTP:
 *    - Go to Supabase Dashboard > Authentication > Providers
 *    - Enable Phone provider
 *    - Configure SMS service (Twilio, MessageBird, or Vonage)
 */

export function OAuth({ locale, mode }: { locale: Locale; mode: "login" | "register" }) {
  const [loading, setLoading] = useState<"google" | "phone" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next = requestedNext?.startsWith(`/${locale}/`) ? requestedNext : `/${locale}/dashboard`;

  async function signInWithGoogle() {
    try {
      setLoading("google");
      setError(null);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      // OAuth redirect will handle navigation
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google");
    } finally {
      setLoading(null);
    }
  }

  async function sendOtp() {
    try {
      setLoading("phone");
      setError(null);

      if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
        setError("Please enter a valid phone number");
        setLoading(null);
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
        options: {
          shouldCreateUser: mode === "register",
        },
      });

      if (error) {
        setError(error.message);
        setLoading(null);
        return;
      }

      setShowOtpInput(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
      setLoading(null);
    }
  }

  async function verifyOtp() {
    try {
      setLoading("phone");
      setError(null);

      if (!otpCode.match(/^\d{6}$/)) {
        setError("Please enter a valid 6-digit code");
        setLoading(null);
        return;
      }

      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        setError(error.message);
        setLoading(null);
        return;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ink/10 dark:border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white dark:bg-ink px-2 text-ink/60 dark:text-white/60">Or continue with</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {showOtpInput ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink dark:text-white mb-1.5">
              Enter the 6-digit code sent to {phoneNumber}
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-center text-sm font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <button
            onClick={verifyOtp}
            disabled={loading === "phone" || otpCode.length !== 6}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "phone" && <Loader2 size={14} className="animate-spin" />}
            {loading === "phone" ? "Verifying…" : "Verify Code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowOtpInput(false);
              setOtpCode("");
              setPhoneNumber("");
            }}
            className="w-full rounded-lg border border-ink/12 dark:border-white/15 py-2.5 text-sm font-medium hover:bg-ink/5 dark:hover:bg-white/5 transition-colors"
          >
            Change Phone Number
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Google OAuth */}
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading !== null}
            className="w-full rounded-lg border border-ink/12 dark:border-white/15 py-2.5 px-4 text-sm font-medium hover:bg-ink/5 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === "google" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {loading === "google" ? "Signing in…" : "Continue with Google"}
          </button>

          {/* Phone OTP */}
          <div>
            <label className="block text-xs font-medium text-ink dark:text-white mb-1.5">Phone number</label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading !== null}
                className="flex-1 rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={sendOtp}
                disabled={loading !== null || !phoneNumber.trim()}
                className="rounded-lg border border-ink/12 dark:border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-ink/5 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                {loading === "phone" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  "Send Code"
                )}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink/50 dark:text-white/50">Include country code (e.g., +1)</p>
          </div>
        </div>
      )}
    </div>
  );
}
