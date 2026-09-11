import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

/**
 * Daily Lunch Buffet — verified text only (from the business owner's own
 * supplied information.txt: an affordable daily lunch buffet, priced per
 * person, self-serve). No hours or price figure are invented. The photo is
 * a real owner shot of the buffet spread; the official "Daily Lunch Buffet"
 * banner is shown in the visual-story section above.
 */
export async function ExcellenceCafeBuffet({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });

  return (
    <div className="grid items-center gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div className="relative aspect-[5/4] w-full overflow-hidden rounded-2xl border border-ink/8 shadow-card dark:border-white/10">
        <Image
          src="/images/partners/excellence-cafe/atmosphere/buffet-spread-closeup.jpg"
          alt={t("buffetPhotoAlt")}
          fill
          sizes="(max-width: 1023px) 90vw, 45vw"
          className="object-cover"
        />
      </div>
      <div className="lg:max-w-md">
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
          <UtensilsCrossed size={14} aria-hidden="true" />
          {t("buffetEyebrow")}
        </span>
        <h2 className="mt-3 font-display text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-[2.05rem]">
          {t("buffetHeading")}
        </h2>
        <p className="mt-4 text-[15px] leading-[1.75] text-ink/70 dark:text-sand/70">{t("buffetBody")}</p>
      </div>
    </div>
  );
}
