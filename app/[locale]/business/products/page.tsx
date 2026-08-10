import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapProduct } from "@/lib/data/mappers";
import { ProductsManager, type ProductManagerRow } from "@/components/business/products-manager";

export const metadata: Metadata = { title: "Products — Dashboard", robots: { index: false } };

export default async function ProductsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/products`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // Only Perfume & Cosmetics shops (categories.supports_products) get this
  // page — every other listing type/category has no products table concept.
  // redirect() rather than notFound() — see the identical comment in
  // app/[locale]/city-services/[slug]/book/page.tsx for why.
  if (!listing.supportsProducts) redirect(`/${locale}/business`);

  const t = await getTranslations({ locale, namespace: "products" });
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("listing_type", "city_service")
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const rows: ProductManagerRow[] = (data ?? []).map((row) => {
    const p = mapProduct(row);
    return {
      id: p.id,
      name: p.name,
      nameAr: p.nameAr,
      nameSo: p.nameSo,
      description: p.description,
      descriptionAr: p.descriptionAr,
      descriptionSo: p.descriptionSo,
      brand: p.brand,
      category: p.category,
      gender: p.gender,
      price: p.price,
      currency: p.currency,
      image: p.image,
      gallery: p.gallery,
      isAvailable: p.isAvailable,
      isFeatured: p.isFeatured,
      isHidden: p.isHidden,
      sortOrder: p.sortOrder,
    };
  });

  return (
    <div className="max-w-3xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("pageSubtitle")}</p>
      </div>

      <div className="pt-4">
        <ProductsManager listingId={listing.id} initialProducts={rows} revalidatePaths={[currentPath]} locale={locale} />
      </div>
    </div>
  );
}
