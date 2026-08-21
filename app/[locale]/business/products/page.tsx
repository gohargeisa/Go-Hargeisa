import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import type { OrderableListingType } from "@/types";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapProduct, mapProductOption } from "@/lib/data/mappers";
import { ProductsManager, type ProductManagerRow } from "@/components/business/products-manager";

export const metadata: Metadata = { title: "Products — Dashboard", robots: { index: false } };

export default async function ProductsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/products`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // Only listings the universal cart/order system is enabled on get this
  // page — every other listing type has no products table concept.
  // redirect() rather than notFound() — see the identical comment in
  // app/[locale]/city-services/[slug]/book/page.tsx for why.
  if (!listing.supportsProducts) redirect(`/${locale}/business`);
  // supportsProducts is only ever true for OrderableListingType listings —
  // see lib/data/business.ts — so this narrowing is safe.
  const listingType = listing.listingType as OrderableListingType;

  const t = await getTranslations({ locale, namespace: "products" });
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const products = (data ?? []).map(mapProduct);

  // Graceful degradation, same pattern as getProductsForListing — a missing
  // table (migration not applied yet) just means "no options anywhere",
  // not a failed page.
  const { data: optionRows, error: optionError } = await supabase
    .from("product_options")
    .select("*")
    .in("product_id", products.map((p) => p.id))
    .order("sort_order", { ascending: true });
  const optionsByProduct = new Map<string, ProductManagerRow["options"]>();
  if (!optionError) {
    for (const row of optionRows ?? []) {
      const option = mapProductOption(row);
      const list = optionsByProduct.get(option.productId) ?? [];
      list.push(option);
      optionsByProduct.set(option.productId, list);
    }
  }

  const rows: ProductManagerRow[] = products.map((p) => ({
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
    size: p.size,
    options: optionsByProduct.get(p.id) ?? [],
  }));

  return (
    <div className="max-w-3xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("pageSubtitle")}</p>
      </div>

      <div className="pt-4">
        <ProductsManager listingId={listing.id} initialProducts={rows} revalidatePaths={[currentPath]} locale={locale} listingType={listingType} />
      </div>
    </div>
  );
}
