import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServices } from "@/lib/data/services";
import { getServiceCategories, getCategoryBySlug } from "@/lib/data/categories";
import { singularize } from "@/lib/utils/service-categories";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const SERVICE_CATEGORY_HERO_IMAGE = "/images/hero-bg.png";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Services is temporarily hidden from the public site — see
  // lib/config/features.ts. Returning no params here means no category
  // pages get statically generated while disabled.
  if (!SERVICES_PUBLIC_ENABLED) return [];
  const categories = await getServiceCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params: { locale, category: categorySlug },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  if (!SERVICES_PUBLIC_ENABLED) return {};
  const category = await getCategoryBySlug(categorySlug);
  if (!category || category.targetTable !== "services") return {};
  const label = category.name;
  const singular = singularize(label);
  return {
    title: `Best ${label} in Hargeisa — ${singular} Directory`,
    description: `Find real, up-to-date ${label.toLowerCase()} in Hargeisa, Somaliland — addresses, phone numbers, opening hours and directions.`,
    alternates: localeAlternates(locale as Locale, `/services/${categorySlug}`),
  };
}

export default async function ServiceCategoryPage({
  params: { locale, category: categorySlug },
  searchParams,
}: {
  params: { locale: Locale; category: string };
  searchParams: { q?: string; minRating?: string; sortBy?: string };
}) {
  if (!SERVICES_PUBLIC_ENABLED) notFound();

  const category = await getCategoryBySlug(categorySlug);
  if (!category || category.targetTable !== "services") notFound();

  const services = await getServices({ categoryId: category.id, q: searchParams.q });
  const label = category.name;
  const t = await getTranslations("home");

  return (
    <>
      <PremiumPageHero
        image={SERVICE_CATEGORY_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("servicesEyebrow")}
        title={label}
        subtitle={`Real ${label.toLowerCase()} in Hargeisa, Somaliland`}
        scrollHint={t("servicesScrollHint")}
      />

      <ServicesPageClient locale={locale} initialServices={services} searchParams={searchParams} category={category} />
    </>
  );
}
