"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { sendContactMessage } from "@/lib/actions/content";

export function ContactForm() {
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
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 rounded-xl2 border border-secondary/30 bg-secondary/5 p-6 text-secondary-700">
        <Check size={18} /> Thanks — we'll get back to you within 1–2 business days.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder="Full name" className="rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary" />
        <input name="email" required type="email" placeholder="Email address" className="rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary" />
      </div>
      <input name="subject" placeholder="Subject" className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary" />
      <textarea name="message" required rows={5} placeholder="Your message" className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Send Message
      </button>
    </form>
  );
}
