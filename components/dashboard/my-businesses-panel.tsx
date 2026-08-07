"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, ArrowRight, Star } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PrimaryButton } from "@/components/shared/buttons";
import type { Locale } from "@/lib/i18n/config";
import type { OwnedListing } from "@/lib/data/business";

const STATUS_STYLE: Record<OwnedListing["partnerStatus"], string> = {
  official: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export function MyBusinessesPanel({ locale, listings }: { locale: Locale; listings: OwnedListing[] }) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("myBusinessesEyebrow")}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{t("myBusinessesTitle")}</h2>
        </div>
        <Building2 size={22} className="text-primary" />
      </div>

      {listings.length === 0 ? (
        <div>
          <EmptyState icon={Building2} title={t("emptyBusinessesTitle")} description={t("emptyBusinessesDescription")} />
          <div className="mt-5 flex justify-center">
            <PrimaryButton href={`/${locale}/join`}>{t("listYourBusinessCta")}</PrimaryButton>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <div
                key={`${listing.listingType}-${listing.id}`}
                className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
                  {listing.coverImage && (
                    <Image src={listing.coverImage} alt={listing.name} fill sizes="56px" className="object-cover" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{listing.name}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50 dark:text-sand/50">
                    <Star size={11} className="text-primary" fill="currentColor" />
                    {listing.rating.toFixed(1)} ({listing.reviewCount})
                  </p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[listing.partnerStatus]}`}>
                    {t(listing.partnerStatus === "official" ? "partnerStatusOfficial" : "partnerStatusTrial")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Link
            href={`/${locale}/business`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {t("goToBusinessDashboard")}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </>
      )}
    </div>
  );
}
