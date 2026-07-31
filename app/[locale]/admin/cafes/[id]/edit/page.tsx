import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { CafeForm, type CafeFormInput } from "@/components/admin/cafe-form";
import type { MediaVideo } from "@/types";

export const metadata: Metadata = { title: "Edit Cafe — Admin" };

export default async function EditCafePage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/cafes/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          {t("editingRequiresSupabaseShort")}
        </p>
      </section>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cafes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const cafe = data as unknown as Database["public"]["Tables"]["cafes"]["Row"];

  if (access?.role === "business_owner" && cafe.owner_id !== access.userId) {
    notFound();
  }

  const gallery = Array.isArray(cafe.gallery)
    ? (cafe.gallery as unknown as { url: string; alt?: string; category?: string }[])
    : [];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editCafeTitle")}</h1>
      <CafeForm
        locale={locale}
        mode="edit"
        cafeId={cafe.id}
        initial={{
          slug: cafe.slug,
          name: cafe.name,
          shortDescription: cafe.short_description,
          description: cafe.description,
          descriptionAr: cafe.description_ar ?? "",
          descriptionSo: cafe.description_so ?? "",
          coverImage: cafe.cover_image,
          logo: cafe.logo_url ?? "",
          gallery: gallery as any,
          videos: Array.isArray(cafe.videos) ? (cafe.videos as unknown as MediaVideo[]) : [],
          address: cafe.address,
          lat: cafe.lat,
          lng: cafe.lng,
          phone: cafe.phone ?? "",
          whatsapp: cafe.whatsapp ?? "",
          email: cafe.email ?? "",
          specialDrinks: cafe.special_drinks ?? [],
          wifi: cafe.wifi,
          workingSpace: cafe.working_space,
          openingHours: cafe.opening_hours ?? "",
          openingHoursStructured: Array.isArray(cafe.opening_hours_structured)
            ? (cafe.opening_hours_structured as unknown as CafeFormInput["openingHoursStructured"])
            : [],
          priceRange: cafe.price_range,
          amenities: cafe.amenities ?? [],
          socialInstagram: cafe.social_instagram ?? "",
          socialFacebook: cafe.social_facebook ?? "",
          menuHighlights: Array.isArray(cafe.menu)
            ? (cafe.menu as unknown as { name: string; price: string; description?: string }[])
            : [],
          menuPdfUrl: cafe.menu_pdf_url ?? "",
          featured: cafe.featured,
        }}
      />
    </section>
  );
}
