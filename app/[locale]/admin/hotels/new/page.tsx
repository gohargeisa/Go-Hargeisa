import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { HotelForm } from "@/components/admin/hotel-form";

export const metadata: Metadata = { title: "Add Hotel — Admin" };

export default async function NewHotelPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/hotels/new`);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Add Hotel</h1>
      <HotelForm locale={locale} mode="create" />
    </section>
  );
}
