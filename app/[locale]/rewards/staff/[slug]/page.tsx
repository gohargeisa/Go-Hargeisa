import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getStaffProgramContext } from "@/lib/data/loyalty-staff";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { StaffConsole } from "@/components/loyalty/staff/staff-console";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function LoyaltyStaffPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const ctx = await getStaffProgramContext(slug, locale);
  const t = await getTranslations({ locale, namespace: "loyalty" });

  if (ctx.state === "not_found") notFound();
  if (ctx.state === "unauthenticated") {
    redirect(`/${locale}/auth/login?next=${encodeURIComponent(ctx.loginNext)}`);
  }

  const theme = getPartnerTheme("city_service", slug);

  if (ctx.state === "forbidden") {
    return (
      <PartnerThemeScope theme={theme}>
        <section className="container-px mx-auto max-w-md pb-16 pt-[calc(env(safe-area-inset-top)+6rem)] text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert size={24} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-xl font-semibold">{t("staffForbiddenTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-ink/60 dark:text-sand/60">{t("staffForbiddenBody")}</p>
          <Link
            href={`/${locale}/rewards/${slug}`}
            className="mt-6 inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          >
            {t("backToRewards")}
          </Link>
        </section>
      </PartnerThemeScope>
    );
  }

  return (
    <PartnerThemeScope theme={theme}>
      <StaffConsole
        locale={locale}
        role={ctx.role}
        program={ctx.program}
        partnerName={ctx.listing.name}
        partnerLogo={ctx.listing.logoUrl ?? theme?.partnerLogo ?? null}
        exitHref={`/${locale}/rewards/${slug}`}
      />
    </PartnerThemeScope>
  );
}
