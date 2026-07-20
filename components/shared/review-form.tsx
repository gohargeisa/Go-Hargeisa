"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Star, Loader2 } from "lucide-react";
import { submitReview } from "@/lib/actions/content";
import type { Locale } from "@/lib/i18n/config";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export function ReviewForm({
  listingType,
  listingId,
  locale,
  pathToRevalidate,
}: {
  listingType: ListingType;
  listingId: string;
  locale: Locale;
  pathToRevalidate: string;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReview({ listingType, listingId, rating, comment, locale, pathToRevalidate });
      if (result.ok) {
        setSuccess(true);
        setComment("");
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  if (success) {
    return (
      <p className="rounded-xl2 border border-secondary/30 bg-secondary/5 p-4 text-sm text-secondary-700">
        Thanks for your review — it's now live.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-5">
      <p className="text-sm font-semibold mb-3">Leave a review</p>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            aria-label={`Rate ${i + 1} stars`}
            className="text-accent"
          >
            <Star size={20} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={3}
        placeholder="Share details of your own experience…"
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}{" "}
          {error.includes("sign in") && (
            <Link href={`/${locale}/auth/login`} className="font-semibold underline">
              Sign in
            </Link>
          )}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        Submit Review
      </button>
    </form>
  );
}
