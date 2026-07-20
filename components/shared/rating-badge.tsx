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
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent-700 font-semibold ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
    >
      <Star size={size === "sm" ? 12 : 14} fill="currentColor" strokeWidth={0} />
      {rating.toFixed(1)}
      {reviewCount !== undefined && (
        <span className="font-normal opacity-70">({reviewCount})</span>
      )}
    </div>
  );
}
