"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/config";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=/${locale}/auth/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return <p className="rounded-xl2 border border-secondary/30 bg-secondary/5 p-5 text-sm text-secondary-700">{t("resetLinkSent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}
        placeholder={t("emailPlaceholder")} className="w-full rounded-xl border border-ink/12 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary dark:border-white/15" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60">
        {loading && <Loader2 size={14} className="animate-spin" />} {t("sendResetLink")}
      </button>
    </form>
  );
}
