import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import type { OrderableListingType } from "@/types";
import { getActiveListing } from "@/lib/data/business";
import { getProductOrdersForListing } from "@/lib/data/product-orders";
import { ProductOrdersTable } from "@/components/business/product-orders-table";

export const metadata: Metadata = { title: "Orders — Dashboard", robots: { index: false } };

export default async function OrdersPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/orders`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // Only categories with categories.supports_products get this page — same
  // gate as /business/products (a listing can only receive orders once it
  // has a real product catalog). redirect() rather than notFound() — see
  // the identical comment in app/[locale]/city-services/[slug]/book/page.tsx.
  if (!listing.supportsProducts) redirect(`/${locale}/business`);
  const listingType = listing.listingType as OrderableListingType;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const orders = await getProductOrdersForListing(listingType, listing.id);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("ordersTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("ordersSubtitle")}</p>
      </div>
      <ProductOrdersTable listingType={listingType} listingId={listing.id} orders={orders} revalidatePath={currentPath} />
    </div>
  );
}
