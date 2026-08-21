import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireOwner } from "@/lib/supabase/guards";
import { getTeamMembersOverview, getAllHonoraryMembers, getAllProfilesForPicker, getAllBusinessesForAccessPicker } from "@/lib/data/access-control";
import { TeamAccessManager } from "@/components/admin/team-access-manager";

export const metadata: Metadata = { title: "Team Access — Admin", robots: { index: false, follow: false } };

/**
 * Owner-only. Where the Founder adds team members (brothers/staff) with
 * granular, per-business permissions, and honorary family members
 * (recognition-only, zero access) — see supabase/migrations/
 * 20260901000001_access_control_system.sql for the schema this manages.
 */
export default async function AdminTeamAccessPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireOwner(locale, `/${locale}/admin/team-access`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const [teamMembers, honoraryMembers, allProfiles, allBusinesses] = await Promise.all([
    getTeamMembersOverview(),
    getAllHonoraryMembers(),
    getAllProfilesForPicker(),
    getAllBusinessesForAccessPicker(),
  ]);

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("teamAccessPageTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("teamAccessPageSubtitle")}</p>
      </div>

      <div className="mt-8">
        <TeamAccessManager teamMembers={teamMembers} honoraryMembers={honoraryMembers} allProfiles={allProfiles} allBusinesses={allBusinesses} />
      </div>
    </section>
  );
}
