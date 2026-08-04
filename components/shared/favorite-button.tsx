"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import type { PolymorphicListingType } from "@/types";

type ListingType = PolymorphicListingType;

const DEFAULT_CLASS =
  "absolute end-3.5 bottom-3.5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] active:scale-95 disabled:opacity-60 dark:bg-ink/90 dark:text-white";

/**
 * Consolidates the heart-icon favorite-toggle logic that was previously
 * duplicated (each with its own useState/useTransition/sign-in-redirect) in
 * 11 files: listing-card, hotel-card, cafe-card, service-card,
 * attractions/attraction-card, mobile-booking-bar, and 5
 * components/home/premium-*-card.tsx variants. Visual chrome stays
 * per-caller via `className`/`size` (the cards and the mobile bottom bar
 * genuinely look different — a shared component enforcing one look would be
 * the wrong kind of consolidation) — only the state/action logic and the
 * default card-overlay style are shared.
 */
export function FavoriteButton({
  listingType,
  listingId,
  locale,
  initiallyFavorited = false,
  addLabel,
  removeLabel,
  /** Appended as `?next=` on the sign-in redirect when set — omit for
   * contexts (e.g. the mobile booking bar) that redirect to a plain login
   * page without a return path. */
  redirectPath,
  size = 17,
  className,
  /** Swap the icon for a spinner while pending — off for contexts (e.g.
   * mobile-booking-bar) that only dim the button instead. */
  showSpinner = true,
  /** Only the old attractions/attraction-card.tsx used a different gold
   * (#F59E0B vs #F4B400 everywhere else) — standardized to the dominant
   * color here rather than preserving that one-off drift. */
  color = "#F4B400",
  /** Set when this button lives inside a `<Link>` that wraps the whole
   * card (components/shared/listing-card.tsx is the one caller that needs
   * this) so the click doesn't also navigate. */
  stopPropagation = false,
  count,
}: {
  listingType: ListingType;
  listingId: string;
  locale?: string;
  initiallyFavorited?: boolean;
  addLabel: string;
  removeLabel: string;
  redirectPath?: string;
  size?: number;
  className?: string;
  showSpinner?: boolean;
  color?: string;
  stopPropagation?: boolean;
  /** Optional visible count (e.g. on a detail page's action card) — omitted
   * entirely (not just hidden) when unset, matching every other optional
   * section's "hide when absent" rule. */
  count?: number;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle(e: React.MouseEvent) {
    if (stopPropagation) {
      e.preventDefault();
      e.stopPropagation();
    }
    startTransition(async () => {
      const result = await toggleFavoriteAction(listingType, listingId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          const next = redirectPath ? `?next=${encodeURIComponent(redirectPath)}` : "";
          router.push(`/${locale}/auth/login${next}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  const button = (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-label={favorited ? removeLabel : addLabel}
      className={className ?? DEFAULT_CLASS}
    >
      {isPending && showSpinner ? (
        <Loader2 size={size} className="animate-spin" aria-hidden="true" />
      ) : (
        <Heart size={size} fill={favorited ? color : "none"} color={favorited ? color : "currentColor"} aria-hidden="true" />
      )}
    </button>
  );

  if (count === undefined) return button;

  return (
    <span className="flex w-full items-center justify-center gap-2">
      {button}
      <span className="text-sm font-medium text-ink/60 dark:text-sand/60">{count}</span>
    </span>
  );
}
