import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Sparkles, ImageOff } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { PartnerAcquisitionCta } from "@/components/shared/partner-acquisition-cta";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * The reusable, DATA-DRIVEN half of Go Hargeisa's partnership branding —
 * works for any listing type (hotel/restaurant/cafe/city_service and any
 * future category) purely from the real `isPartner`/`partnerStatus`/logo
 * fields every listing row already carries, never a hardcoded business
 * name/slug. This is what closes the gap the curated `PartnerTheme` system
 * (lib/config/partner-themes.ts, used by Flormar/Pinnacle/Lavender/Grand
 * Haadi's bespoke storefronts) never covered: an ordinary approved partner
 * with no custom brand colors/hero image still deserves a real "Go Hargeisa
 * × {business}" section instead of either nothing, or — worse — the "Want
 * your business on Go Hargeisa?" acquisition pitch implying they haven't
 * joined yet, which is what several listing pages showed to real partners
 * (e.g. The Village Hargeisa, `is_partner: true`) before this component
 * existed.
 *
 * A page that already renders the curated `PartnerPartnershipFooter` (a
 * themed partner) should keep doing exactly that and never also render
 * this component — one partnership section per page, never two. This
 * component is for every OTHER listing: renders the acquisition CTA for a
 * genuine non-partner, or this same "Go Hargeisa × {name}" lockup (using
 * the site's own default premium palette, not a per-partner color) for an
 * approved one — using the business's own real logo field, or the existing
 * "official logo pending" placeholder card, never a substitute image.
 *
 * `partnerStatus === "official"` (vs. `"trial"`) drives the small "Premium
 * Partner" badge — the DB's existing two-tier partner-approval signal
 * (already public, already read on every listing page) rather than the
 * separate, deliberately private `business_subscriptions.plan_tier`
 * billing field (owner/admin-only RLS — see that table's migration
 * comments), which this component does not read.
 */
export async function PartnerStatusSection({
  isPartner,
  partnerStatus,
  logoUrl,
  businessName,
  locale,
}: {
  isPartner: boolean;
  partnerStatus?: "trial" | "official";
  logoUrl?: string | null;
  businessName: string;
  locale: Locale;
}) {
  if (!isPartner) return <PartnerAcquisitionCta locale={locale} />;

  const t = await getTranslations({ locale, namespace: "partnerFooter" });
  const ta = await getTranslations({ locale, namespace: "partnerAcquisition" });

  return (
    <section
      aria-label={t("lockupLabel", { partner: businessName })}
      className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-ink sm:py-20"
    >
      <div className="container-px mx-auto max-w-xl text-center">
        <div className="flex flex-col items-center gap-3">
          {partnerStatus === "official" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700 dark:bg-primary/20 dark:text-primary-300">
              <Sparkles size={12} aria-hidden="true" />
              {t("premiumPartnerBadge")}
            </span>
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary-800 dark:bg-primary/15 dark:text-primary-300">
            {t("heading")}
          </span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative h-14 w-40 shrink-0 sm:h-16 sm:w-44">
            <Image src="/images/logo.png" alt="Go Hargeisa" fill sizes="176px" className="object-contain" />
          </div>

          <span aria-hidden="true" className="h-8 w-px shrink-0 bg-ink/15 dark:bg-white/15 sm:h-12" />

          {logoUrl ? (
            <div className="relative h-14 w-40 shrink-0 sm:h-16 sm:w-44">
              <Image src={logoUrl} alt={businessName} fill sizes="176px" className="object-contain" />
            </div>
          ) : (
            <div className="flex h-14 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/20 text-ink/40 dark:border-white/20 dark:text-sand/40 sm:h-16 sm:w-44">
              <ImageOff size={18} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{t("logoPending")}</span>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm font-semibold text-ink/60 dark:text-sand/60">{businessName}</p>
        <p className="mt-1 text-xs text-ink/45 dark:text-sand/45">{t("discoverOnGoHargeisa")}</p>

        <div className="mt-6">
          <PrimaryButton href={`/${locale}/join`} size="sm">
            {ta("cta")}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
