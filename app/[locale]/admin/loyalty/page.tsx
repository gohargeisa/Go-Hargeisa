import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getLoyaltyAdminOverview } from "@/lib/data/loyalty-admin";
import { getAllProfilesForPicker } from "@/lib/data/access-control";
import { LoyaltyAdminManager } from "@/components/admin/loyalty-admin-manager";

export const metadata: Metadata = { title: "Loyalty — Admin", robots: { index: false, follow: false } };

/**
 * Owner-only. Loyalty program overview + staff management for every partner
 * that has a program (only Flormar today). Rewards / tiers / offers editing
 * is the full Loyalty admin — a later phase; this covers what's needed to
 * operate the program: metrics visibility, staff onboarding, on/off switch.
 */
export default async function AdminLoyaltyPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin/loyalty`);
  const t = await getTranslations({ locale, namespace: "loyalty" });

  const [programs, allProfiles] = await Promise.all([
    getLoyaltyAdminOverview(),
    getAllProfilesForPicker(),
  ]);

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("adminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("adminSubtitle")}</p>
      </div>

      <div className="mt-8">
        <LoyaltyAdminManager locale={locale} programs={programs} allProfiles={allProfiles} />
      </div>
    </section>
  );
}
