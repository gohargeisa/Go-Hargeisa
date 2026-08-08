import { createClient } from "@/lib/supabase/server";
import {
  SERVICES_PUBLIC_ENABLED,
  RESTAURANTS_PUBLIC_ENABLED,
  CAFES_PUBLIC_ENABLED,
  HOTELS_PRESENTATION_MODE,
} from "@/lib/config/features";
import type { AnalyticsRange, ViewsSeriesPoint } from "./business";
import type { EssentialServiceCategory } from "@/types";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";

const PARTNER_TABLES = ["hotels", "restaurants", "cafes"] as const;
type PartnerTable = (typeof PARTNER_TABLES)[number];

// ----------------------------------------------------------------------------
// Partner Management + Business Health Monitor
// ----------------------------------------------------------------------------
export interface PartnerHealthRow {
  id: string;
  table: PartnerTable;
  name: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  partnerStatus: "trial" | "official";
  planTier: SubscriptionPlanId | null;
  /** 0-100 — see computeHealthScore for the exact signals. */
  healthScore: number;
  healthIssues: string[];
}

export interface OwnerPartnerOverview {
  partners: PartnerHealthRow[];
  trialCount: number;
  officialCount: number;
  planCounts: Record<SubscriptionPlanId, number>;
  /** Sorted worst-first — the Business Health Monitor only ever needs the tail. */
  needsAttention: PartnerHealthRow[];
}

function computeHealthScore(row: {
  description: string | null;
  gallery: unknown;
  phone: string | null;
  review_count: number;
}): { score: number; issues: string[] } {
  const signals: { ok: boolean; issue: string }[] = [
    { ok: Boolean(row.description?.trim()), issue: "missingDescription" },
    { ok: Array.isArray(row.gallery) && row.gallery.length > 0, issue: "missingPhotos" },
    { ok: Boolean(row.phone?.trim()), issue: "missingPhone" },
    { ok: row.review_count > 0, issue: "noReviewsYet" },
  ];
  const passed = signals.filter((s) => s.ok).length;
  return {
    score: Math.round((passed / signals.length) * 100),
    issues: signals.filter((s) => !s.ok).map((s) => s.issue),
  };
}

/** Every hotel/restaurant/cafe with a linked business owner, its partner
 * status, its assigned plan, and a real (not fabricated) health score
 * derived from profile-completeness signals — the same kind of signal
 * PerformanceTips already uses for a single business, just computed across
 * every partner at once for the owner's view. */
export async function getOwnerPartnerOverview(): Promise<OwnerPartnerOverview> {
  const supabase = await createClient();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: subs }] = await Promise.all([
    supabase.from("hotels").select("id, name, cover_image, rating, review_count, description, gallery, phone, partner_status").not("owner_id", "is", null),
    supabase.from("restaurants").select("id, name, cover_image, rating, review_count, description, gallery, phone, partner_status").not("owner_id", "is", null),
    supabase.from("cafes").select("id, name, cover_image, rating, review_count, description, gallery, phone, partner_status").not("owner_id", "is", null),
    supabase.from("business_subscriptions").select("listing_type, listing_id, plan_tier"),
  ]);

  const planFor = (listingType: string, listingId: string): SubscriptionPlanId | null =>
    (subs ?? []).find((s) => s.listing_type === listingType && s.listing_id === listingId)?.plan_tier ?? null;

  function toRows(rows: typeof hotels, table: PartnerTable, listingType: string): PartnerHealthRow[] {
    return (rows ?? []).map((r) => {
      const { score, issues } = computeHealthScore(r);
      return {
        id: r.id,
        table,
        name: r.name,
        coverImage: r.cover_image,
        rating: Number(r.rating),
        reviewCount: r.review_count,
        partnerStatus: r.partner_status,
        planTier: planFor(listingType, r.id),
        healthScore: score,
        healthIssues: issues,
      };
    });
  }

  const partners = [
    ...toRows(hotels, "hotels", "hotel"),
    ...toRows(restaurants, "restaurants", "restaurant"),
    ...toRows(cafes, "cafes", "cafe"),
  ];

  const planCounts: Record<SubscriptionPlanId, number> = { basic: 0, silver: 0, gold: 0 };
  for (const p of partners) if (p.planTier) planCounts[p.planTier]++;

  return {
    partners,
    trialCount: partners.filter((p) => p.partnerStatus === "trial").length,
    officialCount: partners.filter((p) => p.partnerStatus === "official").length,
    planCounts,
    needsAttention: [...partners].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5).filter((p) => p.healthScore < 100),
  };
}

// ----------------------------------------------------------------------------
// City Coverage Progress
// ----------------------------------------------------------------------------
export interface CityCoverageCategory {
  category: EssentialServiceCategory;
  published: number;
  target: number;
}

const CITY_SERVICE_CATEGORIES: EssentialServiceCategory[] = ["hospital", "school", "mosque", "pharmacy"];
const CITY_SERVICE_TARGET_PER_CATEGORY = 4;

export async function getCityCoverage(): Promise<{ categories: CityCoverageCategory[]; totalPublished: number; totalTarget: number }> {
  const supabase = await createClient();
  // Every published row counts toward coverage now — city_services no
  // longer caps public visibility to a "featured" subset (see
  // lib/actions/city-services.ts), so "published" is the only bar.
  const { data } = await supabase.from("city_services").select("category").eq("status", "published");

  const categories = CITY_SERVICE_CATEGORIES.map((category) => ({
    category,
    published: (data ?? []).filter((r) => r.category === category).length,
    target: CITY_SERVICE_TARGET_PER_CATEGORY,
  }));

  return {
    categories,
    totalPublished: categories.reduce((sum, c) => sum + Math.min(c.published, c.target), 0),
    totalTarget: CITY_SERVICE_CATEGORIES.length * CITY_SERVICE_TARGET_PER_CATEGORY,
  };
}

// ----------------------------------------------------------------------------
// Mission Progress — real launch-readiness checklist, derived from actual
// feature flags and data, not invented targets.
// ----------------------------------------------------------------------------
export interface MissionChecklistItem {
  key: string;
  label: string;
  done: boolean;
  detail: string;
}

export async function getMissionChecklist(): Promise<MissionChecklistItem[]> {
  const supabase = await createClient();
  const [{ count: hotelCount }, { count: officialCount }, { count: citySvcCount }, { count: subCount }] = await Promise.all([
    supabase.from("hotels").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("hotels").select("id", { count: "exact", head: true }).eq("partner_status", "official"),
    supabase.from("city_services").select("id", { count: "exact", head: true }).eq("status", "published").eq("featured", true),
    supabase.from("business_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  return [
    {
      key: "hotelsLive",
      label: "Hotels published",
      done: (hotelCount ?? 0) > 0,
      detail: `${hotelCount ?? 0} live`,
    },
    {
      key: "restaurantsPublic",
      label: "Restaurants public",
      done: RESTAURANTS_PUBLIC_ENABLED,
      detail: RESTAURANTS_PUBLIC_ENABLED ? "Enabled" : "Hidden (lib/config/features.ts)",
    },
    {
      key: "cafesPublic",
      label: "Cafés public",
      done: CAFES_PUBLIC_ENABLED,
      detail: CAFES_PUBLIC_ENABLED ? "Enabled" : "Hidden (lib/config/features.ts)",
    },
    {
      key: "servicesPublic",
      label: "Essential Services public",
      done: SERVICES_PUBLIC_ENABLED,
      detail: SERVICES_PUBLIC_ENABLED ? "Enabled" : "Hidden (lib/config/features.ts)",
    },
    {
      key: "hotelsPresentationMode",
      label: "Full hotel catalog visible",
      done: !HOTELS_PRESENTATION_MODE,
      detail: HOTELS_PRESENTATION_MODE ? "Presentation mode active — only one hotel shown publicly" : "All published hotels visible",
    },
    {
      key: "cityServicesPopulated",
      label: "City Services populated",
      done: (citySvcCount ?? 0) > 0,
      detail: `${citySvcCount ?? 0} of 16 slots filled`,
    },
    {
      key: "firstPartnerActivated",
      label: "First partner activated",
      done: (officialCount ?? 0) > 0,
      detail: `${officialCount ?? 0} official partner(s)`,
    },
    {
      key: "firstSubscriptionAssigned",
      label: "First subscription assigned",
      done: (subCount ?? 0) > 0,
      detail: `${subCount ?? 0} subscription(s) on file`,
    },
  ];
}

// ----------------------------------------------------------------------------
// Premium Analytics — platform-wide, reuses the exact bucketing shape
// components/business/views-chart.tsx already renders (ViewsSeriesPoint /
// AnalyticsRange), just aggregated across every listing instead of one.
// ----------------------------------------------------------------------------
function bucketByRange(rows: { created_at: string }[], range: AnalyticsRange): ViewsSeriesPoint[] {
  const now = new Date();
  const byMonth = range === "12m";
  const days = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range];

  const buckets = new Map<string, number>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    const key = byMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const points: ViewsSeriesPoint[] = [];
  if (byMonth) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      points.push({ label: d.toLocaleDateString("en-US", { month: "short" }), count: buckets.get(key) ?? 0 });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      points.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: buckets.get(key) ?? 0 });
    }
  }
  return points;
}

export async function getOwnerViewsSeries(): Promise<Record<AnalyticsRange, ViewsSeriesPoint[]>> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - 365);

  const { data } = await supabase
    .from("business_metric_events")
    .select("created_at")
    .eq("event_type", "view")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const rows = data ?? [];
  return {
    "7d": bucketByRange(rows, "7d"),
    "30d": bucketByRange(rows, "30d"),
    "90d": bucketByRange(rows, "90d"),
    "12m": bucketByRange(rows, "12m"),
  };
}

export interface OwnerKpis {
  totalViews: number;
  totalClicks: number;
  totalBookings: number;
  todayViews: number;
  weekViews: number;
  monthViews: number;
}

export async function getOwnerKpis(): Promise<OwnerKpis> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [
    { count: totalViews },
    { count: totalClicks },
    { count: totalBookings },
    { count: todayViews },
    { count: weekViews },
    { count: monthViews },
  ] = await Promise.all([
    supabase.from("business_metric_events").select("id", { count: "exact", head: true }).eq("event_type", "view"),
    supabase.from("business_metric_events").select("id", { count: "exact", head: true }).in("event_type", ["website_click", "call_click", "whatsapp_click"]),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("business_metric_events").select("id", { count: "exact", head: true }).eq("event_type", "view").gte("created_at", todayStart),
    supabase.from("business_metric_events").select("id", { count: "exact", head: true }).eq("event_type", "view").gte("created_at", weekStart),
    supabase.from("business_metric_events").select("id", { count: "exact", head: true }).eq("event_type", "view").gte("created_at", monthStart),
  ]);

  return {
    totalViews: totalViews ?? 0,
    totalClicks: totalClicks ?? 0,
    totalBookings: totalBookings ?? 0,
    todayViews: todayViews ?? 0,
    weekViews: weekViews ?? 0,
    monthViews: monthViews ?? 0,
  };
}
