"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, Heart, MessageCircle, Phone, Share2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getBookingHref } from "@/lib/utils/booking-href";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

const ICON_BUTTON_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white";

/**
 * Mobile bottom action bar for the hotel detail page — 5 buttons (spec:
 * Book Now, WhatsApp, Call Hotel, Share, Save) replacing the previous
 * single "Book Now" pill that opened a bottom sheet. Hotel-only component
 * (restaurant/cafe pages have their own separate bottom bars), safe to
 * redesign in place.
 */
export function MobileBookingBar({
  hotelId,
  name,
  phone,
  website,
  whatsappFallback,
  locale,
  initiallyFavorited = false,
}: {
  hotelId: string;
  name: string;
  priceRange?: string;
  phone?: string;
  website?: string;
  /** site_settings.whatsapp_number — used only when the hotel has no phone of its own. */
  whatsappFallback?: string;
  locale: Locale;
  initiallyFavorited?: boolean;
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
      const result = await toggleFavoriteAction("hotel", hotelId);
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
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-ink/10 bg-white/95 px-3 py-2.5 shadow-[0_-8px_30px_rgba(20,30,45,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-ink/95 lg:hidden">
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("whatsapp")}
          className={`${ICON_BUTTON_CLASS} hover:!border-[#25D366] hover:!text-[#25D366]`}
        >
          <MessageCircle size={19} aria-hidden="true" />
        </a>
      )}

      {phone && (
        <a href={`tel:${phone}`} aria-label={t("callHotel")} className={ICON_BUTTON_CLASS}>
          <Phone size={18} aria-hidden="true" />
        </a>
      )}

      <button
        type="button"
        onClick={onShare}
        aria-label={t("share")}
        className={ICON_BUTTON_CLASS}
      >
        {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        aria-label={t("save")}
        className={`${ICON_BUTTON_CLASS} disabled:opacity-60`}
      >
        <Heart size={18} fill={favorited ? "#F4B400" : "none"} color={favorited ? "#F4B400" : "currentColor"} aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1" />

      {booking ? (
        <a
          href={booking.href}
          target={booking.external ? "_blank" : undefined}
          rel={booking.external ? "noopener noreferrer" : undefined}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {t("bookNow")}
          {booking.external && <ArrowUpRight size={15} aria-hidden="true" />}
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary/40 px-6 text-sm font-semibold text-white/80"
        >
          {t("bookNow")}
        </button>
      )}
    </div>
  );
}
