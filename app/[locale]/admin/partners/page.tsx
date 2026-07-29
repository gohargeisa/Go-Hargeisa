import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { PartnersList, type PartnerRow } from "@/components/admin/partners-list";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";

export const metadata: Metadata = { title: "Partners — Admin" };

export default async function AdminPartnersPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/partners`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: subs }] = await Promise.all([
    supabase.from("hotels").select("id, name, partner_status").not("owner_id", "is", null),
    supabase.from("restaurants").select("id, name, partner_status").not("owner_id", "is", null),
    supabase.from("cafes").select("id, name, partner_status").not("owner_id", "is", null),
    supabase.from("business_subscriptions").select("listing_type, listing_id, plan_tier"),
  ]);

  const planFor = (listingType: string, listingId: string): SubscriptionPlanId | null =>
    (subs ?? []).find((s) => s.listing_type === listingType && s.listing_id === listingId)?.plan_tier ?? null;

  const rows: PartnerRow[] = [
    ...(hotels ?? []).map((h) => ({
      id: h.id,
      table: "hotels" as const,
      name: h.name,
      partnerStatus: h.partner_status,
      planTier: planFor("hotel", h.id),
    })),
    ...(restaurants ?? []).map((r) => ({
      id: r.id,
      table: "restaurants" as const,
      name: r.name,
      partnerStatus: r.partner_status,
      planTier: planFor("restaurant", r.id),
    })),
    ...(cafes ?? []).map((c) => ({
      id: c.id,
      table: "cafes" as const,
      name: c.name,
      partnerStatus: c.partner_status,
      planTier: planFor("cafe", c.id),
    })),
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
