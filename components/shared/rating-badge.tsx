"use client";

import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

export function RatingBadge({
  rating,
  reviewCount,
  size = "sm",
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const t = useTranslations("common");
  const noReviews = reviewCount === 0;

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${
        noReviews ? "bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-sand/50" : "bg-primary/10 text-primary-800"
      } ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}
    >
      {noReviews ? (
        t("noReviewsYet")
      ) : (
        <>
          <Star size={size === "sm" ? 12 : 14} fill="currentColor" strokeWidth={0} />
          {rating.toFixed(1)}
          {reviewCount !== undefined && <span className="font-normal opacity-70">({reviewCount})</span>}
        </>
      )}
    </div>
  );
}
