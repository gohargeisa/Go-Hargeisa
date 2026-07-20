"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/content";
import type { Locale } from "@/lib/i18n/config";

export function NewsletterSection({ locale }: { locale: Locale }) {
  const t = useTranslations("home");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await subscribeToNewsletter(email, locale);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <section className="container-px mx-auto pb-20 md:pb-24">
      <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-primary via-primary-700 to-secondary-700 px-6 py-14 md:px-16 md:py-16 text-center text-white">
        <div className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <Mail className="mx-auto mb-4" size={28} />
        <h2 className="font-display text-2xl md:text-3xl font-semibold">{t("newsletterTitle")}</h2>
        <p className="mt-2 text-white/80 max-w-md mx-auto">{t("newsletterSubtitle")}</p>

        {submitted ? (
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium">
            <Check size={16} /> Thanks — you're subscribed.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 mx-auto flex max-w-md flex-col sm:flex-row gap-2">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletterPlaceholder")}
              className="flex-1 rounded-full px-5 py-3 text-sm text-ink outline-none"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent-400 transition-colors disabled:opacity-70"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {t("newsletterButton")}
            </button>
          </form>
        )}
        {error && <p className="mt-3 text-sm text-white/90">{error}</p>}
      </div>
    </section>
  );
}
