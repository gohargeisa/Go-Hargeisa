"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { sendContactMessage } from "@/lib/actions/content";

export function ContactForm() {
  const t = useTranslations("contact");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    startTransition(async () => {
      const result = await sendContactMessage(payload);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-4 py-3.5 text-sm outline-none transition-colors duration-200 focus:border-primary dark:border-white/15";

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-xl3 border border-secondary/30 bg-secondary/5 p-6 text-secondary-700 shadow-soft">
        <Check size={18} aria-hidden="true" /> {t("thanksMessage")}
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="sr-only">
            {t("namePlaceholder")}
          </label>
          <input id="contact-name" name="name" required placeholder={t("namePlaceholder")} className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">
            {t("emailPlaceholder")}
          </label>
          <input id="contact-email" name="email" required type="email" placeholder={t("emailPlaceholder")} className={inputClass} />
        </div>
      </div>
      <label htmlFor="contact-subject" className="sr-only">
        {t("subjectPlaceholder")}
      </label>
      <input id="contact-subject" name="subject" placeholder={t("subjectPlaceholder")} className={inputClass} />
      <label htmlFor="contact-message" className="sr-only">
        {t("messagePlaceholder")}
      </label>
      <textarea id="contact-message" name="message" required rows={5} placeholder={t("messagePlaceholder")} className={inputClass} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-card active:scale-95 disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
        {t("sendMessage")}
      </button>
    </form>
  );
}
