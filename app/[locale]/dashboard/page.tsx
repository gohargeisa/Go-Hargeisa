import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getFavoritesForUser } from "@/lib/data/favorites";
import { getSavedTripsForUser } from "@/lib/data/saved-trips";
import { getReviewsForUser } from "@/lib/data/reviews";
import { getMyBookings } from "@/lib/data/business";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";

export const metadata: Metadata = { title: "My Dashboard — Go Hargeisa" };

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const user = await requireUser(locale, `/${locale}/dashboard`);
  const t = await getTranslations({ locale, namespace: "dashboard" });

  let profile: Database["public"]["Tables"]["profiles"]["Row"] | null = null;

  if (user && isSupabaseConfigured()) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, phone, bio, notify_activity, notify_marketing")
      .eq("id", user.id)
      .single();

    profile =
      error || !data
        ? null
        : (data as unknown as Database["public"]["Tables"]["profiles"]["Row"]);
  }

  const [favorites, trips, reviews, bookings] = user
    ? await Promise.all([
        getFavoritesForUser(user.id),
        getSavedTripsForUser(user.id),
        getReviewsForUser(user.id),
        getMyBookings(),
      ])
    : [[], [], [], []];

  const userName =
    profile?.full_name || user?.email?.split("@")[0] || "there";

  const avatarUrl = profile?.avatar_url ?? "";
  const phone = profile?.phone ?? "";
  const bio = profile?.bio ?? "";
  const notifyActivity = profile?.notify_activity ?? true;
  const notifyMarketing = profile?.notify_marketing ?? false;
  const hasPassword = user?.identities?.some((identity) => identity.provider === "email") ?? false;
  const memberSince = user?.created_at ?? new Date().toISOString();

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.12] via-white to-secondary/[0.08] px-6 py-8 shadow-[0_16px_45px_rgba(11,94,215,0.10)] dark:from-primary/20 dark:via-ink dark:to-secondary/10 md:px-10 md:py-10">
        <div className="absolute -end-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <p className="relative text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t("eyebrow")}</p>
        <h1 className="relative mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">{t("welcomeBack", { name: userName })}</h1>
        <p className="relative mt-3 max-w-xl text-sm leading-6 text-ink/60 dark:text-sand/65 md:text-base">
          {t("subtitle")}
        </p>
      </div>

      <DashboardTabs
        locale={locale}
        userId={user?.id ?? ""}
        email={user?.email ?? ""}
        favorites={favorites}
        trips={trips}
        bookings={bookings}
        reviews={reviews}
        userName={userName}
        avatarUrl={avatarUrl}
        phone={phone}
        bio={bio}
        hasPassword={hasPassword}
        memberSince={memberSince}
        notifyActivity={notifyActivity}
        notifyMarketing={notifyMarketing}
      />
    </section>
  );
}
