import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { CafeForm } from "@/components/admin/cafe-form";

export const metadata: Metadata = { title: "Add Cafe — Admin" };

export default async function NewCafePage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/cafes/new`);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Add Cafe</h1>
      <CafeForm locale={locale} mode="create" />
    </section>
  );
}
