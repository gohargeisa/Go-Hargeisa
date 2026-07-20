import type { Database } from "@/types/database";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getFavoritesForUser } from "@/lib/data/favorites";
import { getSavedTripsForUser } from "@/lib/data/saved-trips";
import { getReviewsForUser } from "@/lib/data/reviews";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export const metadata: Metadata = { title: "My Dashboard — Go Hargeisa" };

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const user = await requireUser(locale, `/${locale}/dashboard`);

  let profile: Database["public"]["Tables"]["profiles"]["Row"] | null = null;

  if (user && isSupabaseConfigured()) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single();

    profile =
      error || !data
        ? null
        : (data as unknown as Database["public"]["Tables"]["profiles"]["Row"]);
  }

  const [favorites, trips, reviews] = user
    ? await Promise.all([
        getFavoritesForUser(user.id),
        getSavedTripsForUser(user.id),
        getReviewsForUser(user.id),
      ])
    : [[], [], []];

  const userName =
    profile?.full_name || user?.email?.split("@")[0] || "there";

  const avatarUrl = profile?.avatar_url ?? "";

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-3xl font-semibold">
        My Dashboard
      </h1>

      <p className="mt-1 text-ink/60 dark:text-sand/60">
        Welcome back, {userName}. Manage your saved places and trips.
      </p>

      <DashboardTabs
        locale={locale}
        userId={user?.id ?? ""}
        email={user?.email ?? ""}
        favorites={favorites}
        trips={trips}
        reviews={reviews}
        userName={userName}
        avatarUrl={avatarUrl}
      />
    </section>
  );
}