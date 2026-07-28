"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { submitBusinessClaim } from "@/lib/actions/claims";
import type { BusinessListingType } from "@/types";

export function ClaimBusinessButton({
  listingType,
  listingId,
  className,
}: {
  listingType: BusinessListingType;
  listingId: string;
  className?: string;
}) {
  const t = useTranslations("claimBusiness");
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitBusinessClaim({
        listingType,
        listingId,
        fullName,
        email,
        phone: phone || undefined,
        message: message || undefined,
      });
      if (result.ok) setSent(true);
      else setError(result.error || t("error"));
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <ShieldCheck size={15} aria-hidden="true" />
        {t("button")}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("modalTitle")}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t("modalTitle")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <p className="rounded-xl2 border border-accent/30 bg-accent/5 p-4 text-sm text-accent-700">
                {t("success")}
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <p className="text-xs leading-relaxed text-ink/60 dark:text-sand/60">{t("disclaimer")}</p>

                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("fullNameLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phoneLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messageLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {isPending ? t("submitting") : t("submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
