import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requirePlatformPermission } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { PartnersList, type PartnerRow } from "@/components/admin/partners-list";
import { AddPartnerPanel, type UnclaimedListing } from "@/components/admin/add-partner-panel";
import { getUserDisplayInfo } from "@/lib/actions/claims";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";
import type { SubscriptionStatus } from "@/types";
import { validatePartnerListing, qualityStatusFor } from "@/lib/validation/partner-quality";

export const metadata: Metadata = { title: "Partners — Admin" };

// The five category-agnostic partner-manageable tables — every current and
// future business category is one of these. Hotels/restaurants/cafes are
// their own tables; every other category (florists, perfumeries, clinics,
// salons, health, education, supermarkets/shops, ...) lives in either
// city_services or services, selected by that category's own
// `categories.target_table` — so this list never needs a new entry just
// because a new category is added. Attractions/events are deliberately
// excluded: they have no owner_id/partner_status/is_suspended columns
// today (confirmed against the live schema), so they can't participate
// without a real migration — see the note this produces if that ever
// needs revisiting.
const PARTNER_TABLES = [
  { table: "hotels" as const, listingType: "hotel" as const },
  { table: "restaurants" as const, listingType: "restaurant" as const },
  { table: "cafes" as const, listingType: "cafe" as const },
  { table: "city_services" as const, listingType: "city_service" as const },
  { table: "services" as const, listingType: "service" as const },
];

type PartnerTable = PartnerRow["table"];

interface RawRow {
  id: string;
  name: string;
  owner_id: string | null;
  partner_status: "trial" | "official";
  status: "draft" | "published" | "archived";
  trial_expires_at: string | null;
  featured: boolean;
  is_pinned: boolean;
  is_suspended: boolean;
  description: string | null;
  phone: string | null;
  cover_image: string | null;
  gallery: unknown;
  lat: number | null;
  lng: number | null;
}

export default async function AdminPartnersPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requirePlatformPermission(locale, `/${locale}/admin/partners`, "partners_view");
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();

  const SELECT_COMMON = "id, name, owner_id, partner_status, status, trial_expires_at, featured, is_pinned, is_suspended, description, phone, gallery, lat, lng";
  // city_services is the one table of the five whose cover-image column is
  // named `image`, not `cover_image` (see lib/data/mappers.ts's
  // mapCityService) — aliased here so RawRow/validatePartnerListing never
  // need to know about that difference.
  const selectFor = (table: PartnerTable) =>
    table === "city_services" ? `${SELECT_COMMON}, cover_image:image` : `${SELECT_COMMON}, cover_image`;

  const [byTable, subsResult] = await Promise.all([
    // Owner assignment is NOT a prerequisite for appearing here — a listing
    // shows up once EITHER it has an owner OR an admin has explicitly
    // promoted it to Official via "Add Partner"/"Make Official". Same query
    // shape for every table — nothing hotel/restaurant/cafe-specific.
    Promise.all(
      PARTNER_TABLES.map(({ table }) => supabase.from(table).select(selectFor(table)).or("owner_id.not.is.null,partner_status.eq.official"))
    ),
    supabase.from("business_subscriptions").select("id, listing_type, listing_id, plan_tier, status, renews_at, custom_price_usd"),
  ]);

  const { data: subs } = subsResult;

  // "Add Partner" candidates — existing listings, of any category, with
  // neither an owner nor an explicit Official promotion yet (i.e. not
  // already shown above). Reused as-is, never a new business/listing.
  const candidateResults = await Promise.all(
    PARTNER_TABLES.map(({ table }) => supabase.from(table).select("id, name").is("owner_id", null).eq("partner_status", "trial"))
  );

  const unclaimedListings: UnclaimedListing[] = PARTNER_TABLES.flatMap(({ table, listingType }, i) =>
    (candidateResults[i].data ?? []).map((r) => ({ id: r.id, name: r.name, table, listingType }))
  );

  // Batch-resolve display info for every owner that shows up among the rows
  // above (deduped across all five tables) — getUserDisplayInfo is
  // admin-gated, so this only ever runs for role='owner'. Listings with no
  // owner simply aren't in this map.
  const ownerIds = Array.from(
    new Set(byTable.flatMap((r) => (r.data ?? []) as RawRow[]).map((r) => r.owner_id).filter((id): id is string => !!id))
  );
  const ownerInfoEntries = await Promise.all(ownerIds.map(async (id) => [id, await getUserDisplayInfo(id)] as const));
  const ownerById = new Map(ownerInfoEntries);

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

  const toRow = (table: PartnerTable, listingType: string, entry: RawRow): PartnerRow => {
    const sub = subFor(listingType, entry.id);
    const ownerInfo = entry.owner_id ? ownerById.get(entry.owner_id) : null;
    // Internal-only signal (Partner Production Quality System — see
    // lib/validation/partner-quality.ts) — never rendered anywhere a
    // customer can see it, only this admin list.
    const quality = validatePartnerListing({
      name: entry.name,
      description: entry.description,
      phone: entry.phone,
      cover_image: entry.cover_image,
      gallery: entry.gallery,
      lat: entry.lat,
      lng: entry.lng,
    });
    return {
      id: entry.id,
      table,
      name: entry.name,
      owner: ownerInfo ? { id: ownerInfo.id, name: ownerInfo.fullName, email: ownerInfo.email } : null,
      partnerStatus: entry.partner_status,
      listingStatus: entry.status,
      featured: entry.featured,
      isPinned: entry.is_pinned,
      isSuspended: entry.is_suspended,
      trialExpiresAt: entry.trial_expires_at,
      planTier: (sub?.plan_tier as SubscriptionPlanId | undefined) ?? null,
      subscriptionStatus: (sub?.status as SubscriptionStatus | undefined) ?? "active",
      renewsAt: sub?.renews_at ?? null,
      customPriceUsd: sub?.custom_price_usd ?? null,
      notes: notesFor(sub?.id),
      qualityStatus: qualityStatusFor(quality),
      qualityIssues: [...quality.errors, ...quality.warnings].map((i) => i.message),
    };
  };

  const rows: PartnerRow[] = PARTNER_TABLES.flatMap(({ table, listingType }, i) =>
    ((byTable[i].data ?? []) as RawRow[]).map((entry) => toRow(table, listingType, entry))
  );

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("partnersTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("partnersSubtitle")}</p>
      </div>

      <div className="mt-8">
        <AddPartnerPanel locale={locale} candidates={unclaimedListings} />
        <PartnersList locale={locale} rows={rows} />
      </div>
    </section>
  );
}
