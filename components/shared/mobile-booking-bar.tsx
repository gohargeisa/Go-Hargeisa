"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, Heart, MessageCircle, Phone, Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getBookingHref } from "@/lib/utils/booking-href";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import type { BusinessListingType } from "@/types";

const ICON_BUTTON_CLASS =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-all duration-150 hover:border-primary hover:text-primary active:scale-90 dark:border-white/20 dark:text-white";

/**
 * Compact mobile bottom action bar (WhatsApp, Call, Share, Save, primary
 * CTA) shared by the hotel, restaurant, and cafe detail pages — replacing
 * the restaurant/cafe pages' previous "price strip + open a bottom sheet"
 * pattern so all three listing types share one mobile booking experience.
 * `showPrimary` hides the right-aligned pill entirely for listing types/
 * states with no booking concept (cafes, non-reservable restaurants);
 * `primaryLabel` lets each type word the pill correctly ("Book Now" vs
 * "Reserve a Table"). `env(safe-area-inset-bottom)` keeps the bar clear of
 * the home indicator on notched iPhones (app/[locale]/layout.tsx sets
 * viewport-fit: "cover" so that value is actually non-zero there).
 */
export function MobileBookingBar({
  listingType,
  listingId,
  name,
  phone,
  website,
  whatsappFallback,
  locale,
  initiallyFavorited = false,
  showPrimary = true,
  primaryLabel,
}: {
  listingType: BusinessListingType;
  listingId: string;
  name: string;
  phone?: string;
  website?: string;
  /** site_settings.whatsapp_number — used only when the listing has no phone of its own. */
  whatsappFallback?: string;
  locale: Locale;
  initiallyFavorited?: boolean;
  showPrimary?: boolean;
  primaryLabel?: string;
}) {
  const t = useTranslations("hotelDetail");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const booking = getBookingHref({ website, phone });
  const whatsappNumber = phone || whatsappFallback;
  const whatsappHref = whatsappNumber
    ? toWhatsAppHref(whatsappNumber, `Hi, I'd like to know more about ${name}.`)
    : undefined;

  function onSave() {
    startTransition(async () => {
      const result = await toggleFavoriteAction(listingType, listingId);
      if (!result.ok) {
        if (result.error === "sign-in-required") router.push(`/${locale}/auth/login`);
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url });
      } catch {
        // user cancelled the native share sheet — nothing to do
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="animate-fadeUp fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-ink/10 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_22px_rgba(20,30,45,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-ink/95 lg:hidden">
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("whatsapp")} — ${name}`}
          className={`${ICON_BUTTON_CLASS} hover:!border-[#25D366] hover:!text-[#25D366]`}
        >
          <MessageCircle size={19} aria-hidden="true" />
        </a>
      )}

      {phone && (
        <a href={`tel:${phone}`} aria-label={`${t("call")} — ${name}`} className={ICON_BUTTON_CLASS}>
          <Phone size={18} aria-hidden="true" />
        </a>
      )}

      <button type="button" onClick={onShare} aria-label={t("share")} className={ICON_BUTTON_CLASS}>
        {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        aria-label={t("save")}
        className={`${ICON_BUTTON_CLASS} disabled:opacity-60`}
      >
        <Heart
          size={18}
          fill={favorited ? "#F4B400" : "none"}
          color={favorited ? "#F4B400" : "currentColor"}
          aria-hidden="true"
        />
      </button>

      <div className="min-w-0 flex-1" />

      {showPrimary &&
        (booking ? (
          <a
            href={booking.href}
            target={booking.external ? "_blank" : undefined}
            rel={booking.external ? "noopener noreferrer" : undefined}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-7 text-sm font-bold text-white transition-all duration-150 hover:bg-primary-700 active:scale-95"
          >
            {primaryLabel ?? t("bookNow")}
            {booking.external && <ArrowUpRight size={15} aria-hidden="true" />}
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex h-12 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary/40 px-7 text-sm font-bold text-white/80"
          >
            {primaryLabel ?? t("bookNow")}
          </button>
        ))}
    </div>
  );
}
