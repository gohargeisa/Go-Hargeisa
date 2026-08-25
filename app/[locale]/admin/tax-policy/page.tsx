import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getAllTaxPolicies } from "@/lib/actions/tax-admin";
import { TaxPolicyManager } from "@/components/admin/tax-policy-manager";

export const metadata: Metadata = { title: "Tax Policy — Admin" };

export default async function AdminTaxPolicyPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin/tax-policy`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const policies = await getAllTaxPolicies();

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="mb-2 font-display text-2xl font-semibold">{t("taxPolicyTitle")}</h1>
      <p className="mb-8 max-w-2xl text-sm text-ink/60 dark:text-sand/60">{t("taxPolicySubtitle")}</p>
      <TaxPolicyManager initial={policies} />
    </section>
  );
}
