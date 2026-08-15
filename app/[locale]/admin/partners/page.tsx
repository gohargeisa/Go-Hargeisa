import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { PartnersList, type PartnerRow } from "@/components/admin/partners-list";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";
import type { SubscriptionStatus } from "@/types";

export const metadata: Metadata = { title: "Partners — Admin" };

export default async function AdminPartnersPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/partners`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: subs }] = await Promise.all([
    supabase.from("hotels").select("id, name, partner_status, status, trial_expires_at, featured, is_pinned").not("owner_id", "is", null),
    supabase.from("restaurants").select("id, name, partner_status, status, trial_expires_at, featured, is_pinned").not("owner_id", "is", null),
    supabase.from("cafes").select("id, name, partner_status, status, trial_expires_at, featured, is_pinned").not("owner_id", "is", null),
    supabase.from("business_subscriptions").select("id, listing_type, listing_id, plan_tier, status, renews_at, custom_price_usd"),
  ]);

  const subIds = (subs ?? []).map((s) => s.id);
  const { data: notesRaw } =
    subIds.length > 0
      ? await supabase
          .from("business_subscription_notes")
          .select("id, subscription_id, note, created_at")
          .in("subscription_id", subIds)
          .order("created_at", { ascending: false })
      : { data: [] as { id: string; subscription_id: string; note: string; created_at: string }[] };

  const notesFor = (subscriptionId: string | undefined) =>
    (notesRaw ?? [])
      .filter((n) => n.subscription_id === subscriptionId)
      .map((n) => ({ id: n.id, note: n.note, createdAt: n.created_at }));

  const subFor = (listingType: string, listingId: string) =>
    (subs ?? []).find((s) => s.listing_type === listingType && s.listing_id === listingId);

  const toRow = (
    table: "hotels" | "restaurants" | "cafes",
    listingType: string,
    entry: {
      id: string;
      name: string;
      partner_status: "trial" | "official";
      status: "draft" | "published" | "archived";
      trial_expires_at: string | null;
      featured: boolean;
      is_pinned: boolean;
    }
  ): PartnerRow => {
    const sub = subFor(listingType, entry.id);
    return {
      id: entry.id,
      table,
      name: entry.name,
      partnerStatus: entry.partner_status,
      listingStatus: entry.status,
      featured: entry.featured,
      isPinned: entry.is_pinned,
      trialExpiresAt: entry.trial_expires_at,
      planTier: (sub?.plan_tier as SubscriptionPlanId | undefined) ?? null,
      subscriptionStatus: (sub?.status as SubscriptionStatus | undefined) ?? "active",
      renewsAt: sub?.renews_at ?? null,
      customPriceUsd: sub?.custom_price_usd ?? null,
      notes: notesFor(sub?.id),
    };
  };

  const rows: PartnerRow[] = [
    ...(hotels ?? []).map((h) => toRow("hotels", "hotel", h)),
    ...(restaurants ?? []).map((r) => toRow("restaurants", "restaurant", r)),
    ...(cafes ?? []).map((c) => toRow("cafes", "cafe", c)),
  ];

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("partnersTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("partnersSubtitle")}</p>
      </div>

      <div className="mt-8">
        <PartnersList locale={locale} rows={rows} />
      </div>
    </section>
  );
}
