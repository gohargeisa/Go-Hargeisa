"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, Trash2, Loader2, MessageSquareText } from "lucide-react";
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
      <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your perspective</p><h2 className="mt-1 font-display text-2xl font-semibold">My reviews</h2></div>
      {reviews.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center dark:bg-primary/[0.08]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink"><MessageSquareText size={22} /></span><h3 className="mt-4 font-display text-xl font-semibold">Share your local knowledge</h3><p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">Visit a hotel, restaurant, cafe, or attraction to leave a helpful review.</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/8 p-5 transition-shadow hover:shadow-sm dark:border-white/10">
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
