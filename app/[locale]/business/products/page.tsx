import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import type { OrderableListingType } from "@/types";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapProduct, mapProductOption, mapProductAddon } from "@/lib/data/mappers";
import { ProductsManager, type ProductManagerRow } from "@/components/business/products-manager";
import { AddonGroupsManager, type AddonGroupManagerRow } from "@/components/business/addon-groups-manager";

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

  // Listing-wide add-on groups (e.g. "Side Dishes") — see
  // components/business/addon-groups-manager.tsx and supabase/migrations/
  // 20260907000017_addon_groups_and_village_side_dishes.sql. Same graceful-
  // degradation pattern as product_options above.
  const { data: groupRows, error: groupError } = await supabase
    .from("addon_groups")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listing.id)
    .order("sort_order", { ascending: true });

  const { data: groupAddonRows, error: groupAddonError } = groupError
    ? { data: null, error: groupError }
    : await supabase
        .from("product_addons")
        .select("*")
        .in("group_id", (groupRows ?? []).map((g) => g.id))
        .order("sort_order", { ascending: true });

  const { data: assignmentRows, error: assignmentError } = groupError
    ? { data: null, error: groupError }
    : await supabase
        .from("product_addon_groups")
        .select("*")
        .in("group_id", (groupRows ?? []).map((g) => g.id));

  const addonsByGroup = new Map<string, ReturnType<typeof mapProductAddon>[]>();
  if (!groupAddonError) {
    for (const row of groupAddonRows ?? []) {
      const addon = mapProductAddon(row);
      const key = row.group_id as string;
      const list = addonsByGroup.get(key) ?? [];
      list.push(addon);
      addonsByGroup.set(key, list);
    }
  }
  const assignedProductsByGroup = new Map<string, string[]>();
  if (!assignmentError) {
    for (const row of assignmentRows ?? []) {
      const list = assignedProductsByGroup.get(row.group_id) ?? [];
      list.push(row.product_id);
      assignedProductsByGroup.set(row.group_id, list);
    }
  }
  const addonGroups: AddonGroupManagerRow[] = groupError
    ? []
    : (groupRows ?? []).map((g) => ({
        id: g.id,
        name: g.name,
        nameAr: g.name_ar ?? undefined,
        nameSo: g.name_so ?? undefined,
        sortOrder: g.sort_order,
        addons: addonsByGroup.get(g.id) ?? [],
        assignedProductIds: assignedProductsByGroup.get(g.id) ?? [],
      }));

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
        <AddonGroupsManager
          listingType={listingType}
          listingId={listing.id}
          initialGroups={addonGroups}
          products={rows.map((r) => ({ id: r.id, name: r.name }))}
          revalidatePaths={[currentPath]}
          t={t}
        />
      </div>

      <div className="pt-4">
        <ProductsManager listingId={listing.id} initialProducts={rows} revalidatePaths={[currentPath]} locale={locale} listingType={listingType} />
      </div>
    </div>
  );
}
