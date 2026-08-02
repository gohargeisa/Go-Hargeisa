import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getBusinessClaims, getOwnedListings } from "@/lib/actions/claims";
import { ClaimsList } from "@/components/admin/claims-list";

export const metadata: Metadata = { title: "Business Claims — Admin" };

export default async function AdminClaimsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/claims`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const [claims, ownedListings] = await Promise.all([getBusinessClaims(), getOwnedListings()]);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold">{t("claimsTitle")}</h1>
      <p className="mt-1 mb-8 text-sm text-ink/60 dark:text-sand/60">{t("claimsSubtitle")}</p>
      <ClaimsList locale={locale} claims={claims} ownedListings={ownedListings} />
    </section>
  );
}
