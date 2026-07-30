import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServices } from "@/lib/data/services";
import { PageHero } from "@/components/shared/page-hero";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import {
  SERVICE_CATEGORY_ORDER,
  SERVICE_CATEGORY_SLUGS,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_SINGULAR_LABELS,
  categoryFromSlug,
} from "@/lib/utils/service-categories";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Services is temporarily hidden from the public site — see
  // lib/config/features.ts. Returning no params here means no category
  // pages get statically generated while disabled.
  if (!SERVICES_PUBLIC_ENABLED) return [];
  return SERVICE_CATEGORY_ORDER.map((category) => ({ category: SERVICE_CATEGORY_SLUGS[category] }));
}

export async function generateMetadata({
  params: { locale, category: categorySlug },
}: {
  params: { locale: string; category: string };
}): Promise<Metadata> {
  if (!SERVICES_PUBLIC_ENABLED) return {};
  const category = categoryFromSlug(categorySlug);
  if (!category) return {};
  const label = SERVICE_CATEGORY_LABELS[category];
  const singular = SERVICE_CATEGORY_SINGULAR_LABELS[category];
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

  const category = categoryFromSlug(categorySlug);
  if (!category) notFound();

  const services = await getServices({ category, q: searchParams.q });
  const label = SERVICE_CATEGORY_LABELS[category];
  const tNav = await getTranslations("nav");

  return (
    <>
      <PageHero eyebrow={`🧭 ${tNav("services")}`} title={label} subtitle={`Real ${label.toLowerCase()} in Hargeisa, Somaliland`} image="/images/hero-bg.png" />

      <ServicesPageClient locale={locale} initialServices={services} searchParams={searchParams} category={category} />
    </>
  );
}
