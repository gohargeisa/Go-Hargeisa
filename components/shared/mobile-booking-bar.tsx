"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Phone, Share2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { Locale } from "@/lib/i18n/config";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { BusinessListingType } from "@/types";

const ICON_BUTTON_CLASS =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/70 transition-all duration-150 hover:bg-ink/5 hover:text-primary active:scale-90 dark:text-white/80 dark:hover:bg-white/10";

/**
 * Compact mobile bottom SECONDARY-action bar (Save, Call, WhatsApp, Share)
 * shared by the hotel, restaurant, and cafe detail pages. Deliberately has
 * no primary conversion CTA of its own — every page that renders this also
 * renders components/shared/hotel-action-bar.tsx, which is the single
 * source of truth for the primary CTA (Book Now / Reserve a Table / Order
 * Now) at every breakpoint, including mobile. This bar used to mount its
 * own separate copy of that same button, producing two on-screen instances
 * of the same action; removing it here (rather than passing a suppression
 * prop from each page) fixes it for every current AND future category that
 * reuses this component, since there's no primary-CTA branch left to
 * accidentally re-enable. Directions is the same story: the page's own
 * "Location" section already renders it (alongside "Open in Google Maps")
 * as the single, canonical location/map experience — a second, always-
 * floating Directions control here read as a duplicate map experience, so
 * it isn't repeated in this bar either. `env(safe-area-inset-bottom)` keeps
 * the bar clear of the home indicator on notched iPhones
 * (app/[locale]/layout.tsx sets viewport-fit: "cover" so that value is
 * actually non-zero there).
 */
export function MobileBookingBar({
  listingType,
  listingId,
  name,
  phone,
  whatsappFallback,
  locale,
  initiallyFavorited = false,
}: {
  listingType: BusinessListingType;
  listingId: string;
  name: string;
  phone?: string;
  /** site_settings.whatsapp_number — used only when the listing has no phone of its own. */
  whatsappFallback?: string;
  locale: Locale;
  initiallyFavorited?: boolean;
}) {
  const t = useTranslations("hotelDetail");
  const [copied, setCopied] = useState(false);

  const whatsappNumber = phone || whatsappFallback;
  const whatsappHref = whatsappNumber
    ? toWhatsAppHref(whatsappNumber, `Hi, I'd like to know more about ${name}.`)
    : undefined;

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
    <div
      className="animate-fadeUp glass fixed inset-x-3 z-chrome flex items-center justify-around rounded-[1.75rem] px-2 py-2 shadow-premium lg:hidden"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <FavoriteButton
        listingType={listingType}
        listingId={listingId}
        initiallyFavorited={initiallyFavorited}
        locale={locale}
        size={18}
        showSpinner={false}
        className={`${ICON_BUTTON_CLASS} disabled:opacity-60`}
        addLabel={t("save")}
        removeLabel={t("save")}
      />

      {phone && (
        <a href={`tel:${phone}`} aria-label={`${t("call")} — ${name}`} className={ICON_BUTTON_CLASS}>
          <Phone size={18} aria-hidden="true" />
        </a>
      )}

      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t("whatsapp")} — ${name}`}
          className={`${ICON_BUTTON_CLASS} hover:!text-[#25D366]`}
        >
          <WhatsAppIcon size={18} aria-hidden="true" />
        </a>
      )}

      <button type="button" onClick={onShare} aria-label={t("share")} className={ICON_BUTTON_CLASS}>
        {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
      </button>
    </div>
  );
}
