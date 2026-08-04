"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ExternalLink, EyeOff, Eye, Loader2, Star, Trash2, User, X } from "lucide-react";
import { dismissReviewReport, deleteReportedReview, hideReview, unhideReview } from "@/lib/actions/reviews-moderation";
import type { Locale } from "@/lib/i18n/config";
import type { ReportedReview } from "@/lib/data/reviews";

export function ReviewsModerationList({ locale, reviews }: { locale: Locale; reviews: ReportedReview[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="font-semibold">{t("noReportedReviews")}</p>
      </div>
    );
  }

  const revalidatePaths = [`/${locale}/admin/reviews`];

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => {
        const busy = isPending && pendingId === review.id;
        return (
          <div key={review.id} className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10">
                  <User size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{review.authorName}</p>
                  <Link
                    href={`/${locale}${review.href}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    {review.listingName} <ExternalLink size={10} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-600">{t("reportedBadge")}</span>
                {review.status === "hidden" && (
                  <span className="rounded-full bg-ink/8 px-2.5 py-1 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-sand/60">
                    {t("hiddenBadge")}
                  </span>
                )}
                <div className="flex gap-0.5 text-accent">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-sm text-ink/70 dark:text-sand/70">{review.comment}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => run(review.id, () => dismissReviewReport(review.id, revalidatePaths))}
                disabled={busy}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-secondary-600 hover:text-secondary-700 disabled:opacity-60 dark:border-white/15"
              >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />} {t("dismissReportAction")}
              </button>
              {review.status === "hidden" ? (
                <button
                  type="button"
                  onClick={() => run(review.id, () => unhideReview(review.id, revalidatePaths))}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-secondary-600 hover:text-secondary-700 disabled:opacity-60 dark:border-white/15"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} {t("unhideReviewAction")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => run(review.id, () => hideReview(review.id, revalidatePaths))}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-ink/30 disabled:opacity-60 dark:border-white/15"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <EyeOff size={12} />} {t("hideReviewAction")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!confirm(t("deleteReviewConfirm"))) return;
                  run(review.id, () => deleteReportedReview(review.id, revalidatePaths));
                }}
                disabled={busy}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
              >
                <Trash2 size={12} /> {t("deleteReviewAction")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
