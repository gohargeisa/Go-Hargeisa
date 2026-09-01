"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, IdCard } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyContext } from "@/lib/loyalty/types";
import { programName } from "@/lib/loyalty/helpers";
import { LoyaltyCard } from "./loyalty-card";
import { LoyaltyQr } from "./loyalty-qr";
import { TierProgress } from "./tier-progress";
import { RewardsGrid } from "./rewards-grid";
import { OffersRow } from "./offers-row";
import { ActivityFeed } from "./activity-feed";
import { ActiveRedemptions } from "./active-redemptions";

export function LoyaltyExperience({
  locale,
  context,
  qrSvg,
  holderName,
  partnerLogo,
  accentColor,
  cardHref,
}: {
  locale: Locale;
  context: LoyaltyContext;
  qrSvg: string;
  holderName: string;
  partnerLogo: string | null;
  accentColor: string | null;
  cardHref: string;
}) {
  const t = useTranslations("loyalty");
  const { program, listing, member, currentTier, nextTier, rewards, offers, transactions, redemptions } = context;

  const usedByReward = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of redemptions) {
      if (r.status === "cancelled") continue;
      map[r.rewardId] = (map[r.rewardId] ?? 0) + 1;
    }
    return map;
  }, [redemptions]);

  if (!member) return null;

  const pathToRevalidate = `/${locale}/rewards/${listing.slug}`;

  return (
    <div className="container-px mx-auto max-w-2xl space-y-8 pb-16 pt-[calc(env(safe-area-inset-top)+5.25rem)]">
      <header>
        <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("greeting", { name: holderName })}</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {programName(program, locale)}
        </h1>
      </header>

      <section aria-label={t("cardLabel")}>
        <LoyaltyCard
          size="compact"
          partnerName={listing.name}
          partnerLogo={partnerLogo}
          programName={programName(program, locale)}
          membershipNumber={member.membershipNumber}
          holderName={holderName}
          points={member.currentPoints}
          tierLabel={currentTier ? (locale === "ar" && currentTier.nameAr) || (locale === "so" && currentTier.nameSo) || currentTier.name : null}
          tierColor={currentTier?.color ?? accentColor ?? null}
          status={member.status}
          accentColor={accentColor}
          qrSlot={
            <LoyaltyQr
              svg={qrSvg}
              programId={program.id}
              memberId={member.id}
              caption={t("showQrAt", { partner: listing.name })}
            />
          }
        />
        <div className="mt-2 text-center">
          <Link
            href={cardHref}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-primary-700 transition-colors hover:text-primary-800 dark:text-primary-300"
          >
            <IdCard size={15} aria-hidden="true" />
            {t("viewFullCard")}
            <ChevronRight size={14} aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </div>
      </section>

      <TierProgress
        locale={locale}
        currentTier={currentTier}
        nextTier={nextTier}
        lifetimePoints={member.lifetimePoints}
        accentColor={accentColor}
      />

      <ActiveRedemptions locale={locale} redemptions={redemptions} partnerName={listing.name} />

      <section aria-labelledby="loyalty-rewards-heading">
        <h2 id="loyalty-rewards-heading" className="mb-3 font-display text-lg font-semibold">
          {t("rewardsHeading")}
        </h2>
        <RewardsGrid
          locale={locale}
          currency={program.currency}
          rewards={rewards}
          currentPoints={member.currentPoints}
          memberTier={currentTier}
          tiers={context.tiers}
          usedByReward={usedByReward}
          accentColor={accentColor}
          pathToRevalidate={pathToRevalidate}
        />
      </section>

      <OffersRow locale={locale} offers={offers} accentColor={accentColor} />

      <section aria-labelledby="loyalty-activity-heading">
        <h2 id="loyalty-activity-heading" className="mb-3 font-display text-lg font-semibold">
          {t("activityHeading")}
        </h2>
        <ActivityFeed
          locale={locale}
          memberId={member.id}
          initial={transactions}
          initialHasMore={context.hasMoreTransactions}
        />
      </section>
    </div>
  );
}
