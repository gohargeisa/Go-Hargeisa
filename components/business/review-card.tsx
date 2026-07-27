"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Flag, Loader2, Star, User } from "lucide-react";
import { replyToReview, reportReview } from "@/lib/actions/business";
import type { BusinessListingType, Review } from "@/types";

export function ReviewCard({
  review,
  listingType,
  listingId,
  revalidatePath,
}: {
  review: Review;
  listingType: BusinessListingType;
  listingId: string;
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerReply ?? "");
  const [reported, setReported] = useState(review.isReported ?? false);
  const [isPending, startTransition] = useTransition();

  function submitReply() {
    if (!replyText.trim()) return;
    startTransition(async () => {
      await replyToReview(review.id, listingType, listingId, replyText.trim(), [revalidatePath]);
      setReplying(false);
      router.refresh();
    });
  }

  function onReport() {
    if (reported) return;
    startTransition(async () => {
      const result = await reportReview(review.id, listingType, listingId, [revalidatePath]);
      if (result.ok) setReported(true);
    });
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10">
            <User size={17} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">{review.authorName}</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              <span className="text-xs text-ink/45 dark:text-sand/45">
                {new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        {reported && (
          <span className="shrink-0 rounded-full bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-600">
            {t("reported")}
          </span>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink/75 dark:text-sand/75">{review.comment}</p>

      {review.ownerReply && !replying && (
        <div className="mt-3 rounded-xl2 border-s-2 border-primary bg-primary/[0.04] p-3 dark:bg-primary/[0.08]">
          <p className="text-xs font-semibold text-primary">{t("yourReply")}</p>
          <p className="mt-1 text-sm text-ink/75 dark:text-sand/75">{review.ownerReply}</p>
        </div>
      )}

      {replying ? (
        <div className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder={t("writeReplyPlaceholder")}
            className="w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={submitReply}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />} {t("postReply")}
            </button>
            <button
              type="button"
              onClick={() => setReplying(false)}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setReplying(true)}
            className="rounded-full border border-ink/15 px-4 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            {review.ownerReply ? t("editReply") : t("reply")}
          </button>
          <button
            type="button"
            onClick={onReport}
            disabled={reported || isPending}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-50 dark:border-white/20 dark:text-sand/60"
          >
            <Flag size={11} aria-hidden="true" /> {reported ? t("reported") : t("report")}
          </button>
        </div>
      )}
    </div>
  );
}
