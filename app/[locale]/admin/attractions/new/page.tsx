import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { AttractionForm } from "@/components/admin/attraction-form";

export const metadata: Metadata = { title: "Add Attraction — Admin" };

export default async function NewAttractionPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/attractions/new`);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Add Attraction</h1>
      <AttractionForm locale={locale} mode="create" />
    </section>
  );
}
