import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

/**
 * Daily Lunch Buffet — verified text only ("Available daily. Affordable
 * daily lunch buffet. Customers can eat according to their preference.",
 * from the business owner's own supplied information.txt). No hours or
 * price are invented; the official buffet signage photo stands in for the
 * missing numbers rather than a guessed figure.
 */
export async function ExcellenceCafeBuffet({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl2 border border-ink/10 dark:border-white/10">
        <Image
          src="/images/partners/excellence-cafe/atmosphere/lunch-buffet-spread-banner.jpg"
          alt={t("buffetPhotoAlt")}
          fill
          sizes="(max-width: 1023px) 90vw, 45vw"
          className="object-cover"
        />
      </div>
      <div>
        <span className="mb-2 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
          <UtensilsCrossed size={14} aria-hidden="true" />
          {t("buffetEyebrow")}
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("buffetHeading")}</h2>
        <p className="mt-5 leading-relaxed text-ink/75 dark:text-sand/75">{t("buffetBody")}</p>
      </div>
    </div>
  );
}
