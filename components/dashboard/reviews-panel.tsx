"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, Trash2, Loader2 } from "lucide-react";
import { deleteReview } from "@/lib/actions/content";
import type { MyReview } from "@/lib/data/reviews";
import type { Locale } from "@/lib/i18n/config";

export function ReviewsPanel({ locale, reviews }: { locale: Locale; reviews: MyReview[] }) {
  const [isPending, startTransition] = useTransition();

  function onDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    startTransition(async () => {
      await deleteReview(locale, id);
    });
  }

  return (
    <div>
      <h2 className="font-display text-lg font-semibold mb-4">My Reviews</h2>
      {reviews.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-sand/50">
          You haven't written any reviews yet. Visit a hotel, restaurant, cafe or attraction page to
          leave one.
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/${locale}${r.href}`} className="text-sm font-semibold hover:text-primary">
                    {r.listingName}
                  </Link>
                  <div className="mt-1 flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  disabled={isPending}
                  aria-label={`Delete review of ${r.listingName}`}
                  className="shrink-0 text-ink/40 hover:text-red-500"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              {r.comment && <p className="mt-2 text-sm text-ink/70 dark:text-sand/70">{r.comment}</p>}
              <p className="mt-2 text-xs text-ink/40 dark:text-sand/40">
                {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
