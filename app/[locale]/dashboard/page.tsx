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
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.12] via-white to-secondary/[0.08] px-6 py-8 shadow-[0_16px_45px_rgba(11,94,215,0.10)] dark:from-primary/20 dark:via-ink dark:to-secondary/10 md:px-10 md:py-10">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-primary">Your Hargeisa guide</p>
        <h1 className="relative mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">Welcome back, {userName}.</h1>
        <p className="relative mt-3 max-w-xl text-sm leading-6 text-ink/60 dark:text-sand/65 md:text-base">
          Keep your favorite places, personal trips, and local reviews organized in one place.
        </p>
      </div>

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
