"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyMemberStatus } from "@/lib/loyalty/types";
import { LoyaltyCard } from "./loyalty-card";
import { LoyaltyQr } from "./loyalty-qr";

/**
 * Full-screen "show your card" view — a focused dark stage with the card
 * enlarged and the QR front-and-centre for a staff scan.
 */
export function LoyaltyCardStage({
  backHref,
  partnerName,
  partnerLogo,
  programName,
  membershipNumber,
  holderName,
  points,
  tierLabel,
  tierColor,
  status,
  qrSvg,
  accentColor,
  programId,
  memberId,
}: {
  locale: Locale;
  backHref: string;
  partnerName: string;
  partnerLogo: string | null;
  programName: string;
  membershipNumber: string;
  holderName: string;
  points: number;
  tierLabel: string | null;
  tierColor: string | null;
  status: LoyaltyMemberStatus;
  qrSvg: string;
  accentColor: string | null;
  programId: string;
  memberId: string;
}) {
  const t = useTranslations("loyalty");

  return (
    <div className="min-h-[100dvh] bg-ink text-white">
      <div
        className="container-px mx-auto max-w-md pb-16"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
      >
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/20"
        >
          <ArrowLeft size={15} aria-hidden="true" className="rtl:rotate-180" />
          {t("backToRewards")}
        </Link>

        <div className="mt-6">
          <LoyaltyCard
            size="large"
            partnerName={partnerName}
            partnerLogo={partnerLogo}
            programName={programName}
            membershipNumber={membershipNumber}
            holderName={holderName}
            points={points}
            tierLabel={tierLabel}
            tierColor={tierColor}
            status={status}
            accentColor={accentColor}
            qrSlot={
              <LoyaltyQr
                svg={qrSvg}
                programId={programId}
                memberId={memberId}
                caption={t("showQrAt", { partner: partnerName })}
              />
            }
          />
        </div>

        <p className="mt-6 text-center text-sm text-white/60">
          {t("showQrAt", { partner: partnerName })}
        </p>
      </div>
    </div>
  );
}
