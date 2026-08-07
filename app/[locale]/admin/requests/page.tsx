import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { RequestsList, type RequestRow } from "@/components/admin/requests-list";

export const metadata: Metadata = { title: "Requests — Admin", robots: { index: false, follow: false } };

export default async function AdminRequestsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/requests`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("business_join_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const requestIds = (requests ?? []).map((r) => r.id);
  const { data: notesRaw } =
    requestIds.length > 0
      ? await supabase
          .from("business_join_request_notes")
          .select("id, request_id, note, created_at")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false })
      : { data: [] as { id: string; request_id: string; note: string; created_at: string }[] };

  const categoryIds = Array.from(new Set((requests ?? []).map((r) => r.category_id).filter((v): v is string => !!v)));
  const { data: categoryRows } =
    categoryIds.length > 0
      ? await supabase.from("categories").select("id, slug, name").in("id", categoryIds)
      : { data: [] as { id: string; slug: string; name: string }[] };
  const categoryById = new Map((categoryRows ?? []).map((c) => [c.id, c]));

  const rows: RequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    categoryId: r.category_id,
    categoryName: r.category_id ? (categoryById.get(r.category_id)?.name ?? null) : null,
    categorySlug: r.category_id ? (categoryById.get(r.category_id)?.slug ?? null) : null,
    customFields: r.custom_fields ?? {},
    businessName: r.business_name,
    ownerName: r.owner_name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    address: r.address,
    city: r.city,
    district: r.district,
    lat: r.lat,
    lng: r.lng,
    mapsUrl: r.maps_url,
    description: r.description,
    logo: r.logo,
    coverImage: r.cover_image,
    gallery: ((r.gallery as { url: string; alt?: string; category?: string }[] | null) ?? []).map((g) => g.url),
    videos: (r.videos as { url: string; caption?: string }[] | null) ?? [],
    documents: (r.documents as { url: string; name: string }[] | null) ?? [],
    menuPdfUrl: r.menu_pdf_url,
    bookingUrl: r.booking_url,
    website: r.website,
    instagram: r.instagram,
    facebook: r.facebook,
    openingHours: (r.opening_hours as RequestRow["openingHours"]) ?? [],
    amenities: r.amenities ?? [],
    priceRange: r.price_range,
    status: r.status,
    convertedListingType: r.converted_listing_type,
    convertedListingId: r.converted_listing_id,
    createdAt: r.created_at,
    notes: (notesRaw ?? [])
      .filter((n) => n.request_id === r.id)
      .map((n) => ({ id: n.id, note: n.note, createdAt: n.created_at })),
  }));

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("requestsTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("requestsSubtitle", { count: pendingCount })}
        </p>
      </div>

      <div className="mt-8">
        <RequestsList locale={locale} rows={rows} />
      </div>
    </section>
  );
}
