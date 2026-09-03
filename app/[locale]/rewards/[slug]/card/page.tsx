import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getLoyaltyContextBySlug } from "@/lib/data/loyalty";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { generateLoyaltyQrSvg } from "@/lib/loyalty/qr";
import { buildLoyaltyQrPayload } from "@/lib/loyalty/constants";
import { programName, tierName } from "@/lib/loyalty/helpers";
import { LoyaltyCardStage } from "@/components/loyalty/loyalty-card-stage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoyaltyCardPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const ctx = await getLoyaltyContextBySlug(slug, locale);
  if (!ctx) notFound();

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  // The full-screen card only makes sense for a member. Send everyone else to
  // the Rewards home, which handles sign-in / join.
  if (!user || !ctx.member) {
    redirect(`/${locale}/rewards/${ctx.listing.slug}`);
  }

  const t = await getTranslations({ locale, namespace: "loyalty" });
  const theme =
    ctx.program.listingType === "city_service"
      ? getPartnerTheme("city_service", ctx.listing.slug)
      : null;

  const qrSvg = await generateLoyaltyQrSvg(buildLoyaltyQrPayload(ctx.member.memberUid));

  return (
    <PartnerThemeScope theme={theme}>
      <LoyaltyCardStage
        locale={locale}
        backHref={`/${locale}/rewards/${ctx.listing.slug}`}
        partnerName={ctx.listing.name}
        // White membership card ⇒ its normal brand-colour logo.
        partnerLogo={
          theme?.lightRewardsCard
            ? (ctx.listing.logoUrl ?? theme?.partnerLogo ?? null)
            : (theme?.partnerLogoLight ?? ctx.listing.logoUrl ?? theme?.partnerLogo ?? null)
        }
        cardVariant={theme?.lightRewardsCard ? "light" : "solid"}
        programName={programName(ctx.program, locale)}
        membershipNumber={ctx.member.membershipNumber}
        holderName={user.user_metadata?.full_name || user.email?.split("@")[0] || t("member")}
        points={ctx.member.currentPoints}
        tierLabel={ctx.currentTier ? tierName(ctx.currentTier, locale) : null}
        tierColor={ctx.currentTier?.color ?? theme?.accentStrong ?? null}
        status={ctx.member.status}
        qrSvg={qrSvg}
        accentColor={theme?.accentStrong ?? null}
        programId={ctx.program.id}
        memberId={ctx.member.id}
      />
    </PartnerThemeScope>
  );
}
