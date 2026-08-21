"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { sendContactMessage } from "@/lib/actions/content";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";

/** Shared by SubscriptionCard's "Manage Subscription" and SupportCard's "Contact Support" — no payment gateway is integrated, so both route through the existing contact-message pipe rather than a fake checkout. */
export function ContactSupportButton({
  ownerName,
  ownerEmail,
  defaultSubject,
  label,
  className,
}: {
  ownerName: string;
  ownerEmail: string;
  defaultSubject: string;
  label: string;
  className?: string;
}) {
  const t = useTranslations("businessDashboard");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open);
  useScrollLock(open);
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
      const result = await sendContactMessage({ name: ownerName, email: ownerEmail, subject: defaultSubject, message });
      if (result.ok) setSent(true);
      else setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("contactSupport")}
            tabIndex={-1}
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{t("contactSupport")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={tCommon("close")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <p className="rounded-xl2 border border-accent/30 bg-accent/5 p-4 text-sm text-accent-700">
                {t("supportMessageSent")}
              </p>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("supportMessagePlaceholder")}
                  className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />} {t("sendMessage")}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
