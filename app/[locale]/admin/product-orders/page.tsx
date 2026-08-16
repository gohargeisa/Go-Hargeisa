import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllProductOrdersForAdmin } from "@/lib/data/product-orders";
import { AdminProductOrdersList } from "@/components/admin/admin-product-orders-list";

export const metadata: Metadata = { title: "Product Orders — Admin", robots: { index: false, follow: false } };

/**
 * Platform-wide view of every order placed through the universal cart —
 * Restaurants, Cafes, Flower Shops, Perfume Shops, any future
 * OrderableListingType — same shape as /admin/bookings. getAllProductOrdersForAdmin
 * never filters by owner_id, so a listing nobody has claimed yet still shows
 * up here; an order never becomes invisible just because the business has
 * no linked owner.
 */
export default async function AdminProductOrdersPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/product-orders`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const orders = await getAllProductOrdersForAdmin();

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("productOrdersAdminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("productOrdersAdminSubtitle", { count: orders.length })}
        </p>
      </div>

      <div className="mt-8">
        <AdminProductOrdersList orders={orders} />
      </div>
    </section>
  );
}
