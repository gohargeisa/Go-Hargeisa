"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mail, Check, Loader2 } from "lucide-react";
import { subscribeToNewsletter } from "@/lib/actions/content";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

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
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-xl3 bg-gradient-to-br from-primary via-primary-700 to-secondary-700 px-6 py-16 text-center text-white shadow-card md:px-16 md:py-20">
          <div
            className="absolute -top-16 -end-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -start-10 h-56 w-56 rounded-full bg-primary-300/20 blur-3xl"
            aria-hidden="true"
          />

          <span className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Mail size={26} aria-hidden="true" />
          </span>
          <h2 className="relative mt-6 font-display text-2xl font-semibold md:text-3xl">
            {t("newsletterTitle")}
          </h2>
          <p className="relative mx-auto mt-3 max-w-md text-white/80">
            {t("newsletterSubtitle")}
          </p>

          {submitted ? (
            <p className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-medium">
              <Check size={16} aria-hidden="true" /> Thanks — you're subscribed.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="relative mx-auto mt-7 flex max-w-md flex-col gap-2 sm:flex-row"
            >
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
                className="flex-1 rounded-full px-5 py-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-white"
              />
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-accent-400 disabled:opacity-70"
              >
                {isPending && <Loader2 size={14} aria-hidden="true" className="animate-spin" />}
                {t("newsletterButton")}
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="relative mt-3 text-sm text-white/90">
              {error}
            </p>
          )}
        </div>
      </Reveal>
    </section>
  );
}
