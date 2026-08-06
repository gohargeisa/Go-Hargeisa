"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, ShieldCheck, X } from "lucide-react";
import { submitBusinessClaim } from "@/lib/actions/claims";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
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
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  useScrollLock(open);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

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
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("modalTitle")}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t("modalTitle")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
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

                <label htmlFor="claim-full-name" className="sr-only">
                  {t("fullNameLabel")}
                </label>
                <input
                  id="claim-full-name"
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("fullNameLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <label htmlFor="claim-email" className="sr-only">
                  {t("emailLabel")}
                </label>
                <input
                  id="claim-email"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <label htmlFor="claim-phone" className="sr-only">
                  {t("phoneLabel")}
                </label>
                <input
                  id="claim-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("phoneLabel")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                <label htmlFor="claim-message" className="sr-only">
                  {t("messageLabel")}
                </label>
                <textarea
                  id="claim-message"
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
