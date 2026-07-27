import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { GalleryManagerPanel } from "@/components/business/gallery-manager-panel";
import type { GalleryImage } from "@/types";

export const metadata: Metadata = { title: "Gallery — Dashboard", robots: { index: false } };

export default async function GalleryPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/gallery`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const supabase = await createClient();
  const table = listing.listingType === "hotel" ? "hotels" : listing.listingType === "restaurant" ? "restaurants" : "cafes";
  const { data: row } = await supabase.from(table).select("cover_image, logo_url, gallery").eq("id", listing.id).single();

  const gallery: GalleryImage[] = Array.isArray(row?.gallery)
    ? (row!.gallery as unknown as { url: string; alt?: string; category?: string }[]).map((g) => ({
        url: g.url,
        alt: g.alt,
        category: g.category,
      }))
    : [];

  return (
    <div className="max-w-3xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navGallery")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("gallerySubtitle")}</p>
      </div>

      <div className="pt-4">
        <GalleryManagerPanel
          listingType={listing.listingType}
          listingId={listing.id}
          initialCover={row?.cover_image ?? listing.coverImage}
          initialLogo={row?.logo_url ?? listing.logo ?? ""}
          initialGallery={gallery}
          currentPath={currentPath}
        />
      </div>
    </div>
  );
}
