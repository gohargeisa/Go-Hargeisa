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

  const rows: RequestRow[] = (requests ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    businessName: r.business_name,
    ownerName: r.owner_name,
    phone: r.phone,
    whatsapp: r.whatsapp,
    email: r.email,
    address: r.address,
    mapsUrl: r.maps_url,
    description: r.description,
    logo: r.logo,
    gallery: (r.gallery as string[] | null) ?? [],
    menuPdfUrl: r.menu_pdf_url,
    bookingUrl: r.booking_url,
    website: r.website,
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
