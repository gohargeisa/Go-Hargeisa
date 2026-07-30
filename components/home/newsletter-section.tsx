"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/content";
import type { Locale } from "@/lib/i18n/config";
import { CTASection } from "@/components/shared/cta-section";

export function NewsletterSection({ locale }: { locale: Locale }) {
  const t = useTranslations("home");
  const emailId = useId();
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
        setError(result.error ?? t("newsletterError"));
      }
    });
  }

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <CTASection icon={Mail} title={t("newsletterTitle")} subtitle={t("newsletterSubtitle")}>
        {submitted ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium">
            <Check size={16} aria-hidden="true" /> {t("newsletterSuccess")}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-2.5 sm:flex-row">
            <label htmlFor={emailId} className="sr-only">
              {t("newsletterPlaceholder")}
            </label>
            <input
              id={emailId}
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletterPlaceholder")}
              className="h-12 flex-1 rounded-full px-5 text-sm text-ink outline-none ring-1 ring-transparent transition-shadow focus-visible:ring-2 focus-visible:ring-white"
            />
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-ink shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-400 hover:shadow-[0_14px_30px_rgba(0,0,0,0.28)] disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isPending && <Loader2 size={14} aria-hidden="true" className="animate-spin" />}
              {t("newsletterButton")}
            </button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-white/90">
            {error}
          </p>
        )}
      </CTASection>
    </section>
  );
}
