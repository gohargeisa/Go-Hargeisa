import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { HotelForm } from "@/components/admin/hotel-form";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";

export const metadata: Metadata = { title: "Add Hotel — Admin" };

export default async function NewHotelPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/hotels/new`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const [restaurants, cafes] = await Promise.all([getRestaurants(), getCafes()]);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("addHotelTitle")}</h1>
      <HotelForm
        locale={locale}
        mode="create"
        restaurantOptions={restaurants.map((r) => ({ id: r.id, name: r.name }))}
        cafeOptions={cafes.map((c) => ({ id: c.id, name: c.name }))}
        canAssignOwner
      />
    </section>
  );
}
