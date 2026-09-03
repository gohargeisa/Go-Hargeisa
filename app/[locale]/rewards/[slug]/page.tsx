import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getLoyaltyContextBySlug } from "@/lib/data/loyalty";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { generateLoyaltyQrSvg } from "@/lib/loyalty/qr";
import { buildLoyaltyQrPayload } from "@/lib/loyalty/constants";
import { programName, programDescription } from "@/lib/loyalty/helpers";
import { LoyaltyJoinGate } from "@/components/loyalty/loyalty-join-gate";
import { LoyaltyExperience } from "@/components/loyalty/loyalty-experience";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const ctx = await getLoyaltyContextBySlug(slug, locale);
  if (!ctx) return {};
  const t = await getTranslations({ locale, namespace: "loyalty" });
  return {
    title: `${programName(ctx.program, locale)} — ${ctx.listing.name}`,
    description: t("metaDescription", { partner: ctx.listing.name }),
    robots: { index: false, follow: false },
  };
}

export default async function RewardsPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const ctx = await getLoyaltyContextBySlug(slug, locale);
  if (!ctx) notFound();

  const t = await getTranslations({ locale, namespace: "loyalty" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Partner branding for the loyalty experience comes from the SAME config
  // that themes the partner's storefront — keyed on the listing the program
  // points at, so it's automatic for any future partner that has a theme.
  const theme =
    ctx.program.listingType === "city_service"
      ? getPartnerTheme("city_service", ctx.listing.slug)
      : null;

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();

  const breadcrumbs = (
    <Breadcrumbs
      items={[
        { label: tNav("cityServices"), href: `/${locale}/city-services` },
        { label: ctx.listing.name, href: `/${locale}/city-services/${ctx.listing.slug}` },
        { label: t("breadcrumb"), href: `/${locale}/rewards/${ctx.listing.slug}` },
      ]}
    />
  );

  // Not a member yet (signed out, or signed in without a membership).
  if (!ctx.member) {
    return (
      <PartnerThemeScope theme={theme}>
        {breadcrumbs}
        <LoyaltyJoinGate
          locale={locale}
          slug={ctx.listing.slug}
          partnerName={ctx.listing.name}
          partnerLogo={theme?.partnerLogoLight ?? ctx.listing.logoUrl ?? theme?.partnerLogo ?? null}
          programId={ctx.program.id}
          programName={programName(ctx.program, locale)}
          programDescription={programDescription(ctx.program, locale)}
          listingType={ctx.program.listingType}
          listingId={ctx.program.listingId}
          welcomeBonus={ctx.program.welcomeBonusPoints}
          tiers={ctx.tiers.map((tier) => ({
            id: tier.id,
            name: (locale === "ar" && tier.nameAr) || (locale === "so" && tier.nameSo) || tier.name,
            minPoints: tier.minPoints,
            color: tier.color,
          }))}
          isSignedIn={!!user}
          accentColor={theme?.accentStrong ?? null}
        />
      </PartnerThemeScope>
    );
  }

  const qrSvg = await generateLoyaltyQrSvg(buildLoyaltyQrPayload(ctx.member.memberUid));
  const holderName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || t("member");

  return (
    <PartnerThemeScope theme={theme}>
      {breadcrumbs}
      <LoyaltyExperience
        locale={locale}
        context={ctx}
        qrSvg={qrSvg}
        holderName={holderName}
        // White membership card ⇒ its normal brand-colour logo; the solid
        // (dark) card would want the white knockout instead.
        partnerLogo={
          theme?.lightRewardsCard
            ? (ctx.listing.logoUrl ?? theme?.partnerLogo ?? null)
            : (theme?.partnerLogoLight ?? ctx.listing.logoUrl ?? theme?.partnerLogo ?? null)
        }
        cardVariant={theme?.lightRewardsCard ? "light" : "solid"}
        accentColor={theme?.accentStrong ?? null}
        cardHref={`/${locale}/rewards/${ctx.listing.slug}/card`}
      />
    </PartnerThemeScope>
  );
}
