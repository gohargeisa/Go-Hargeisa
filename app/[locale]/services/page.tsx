import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";

/**
 * /services (the bare index, not /services/[category]) never had its own
 * content — it rendered the exact same city_services data as /city-services
 * (same getCityServicesGroupedByCategory call, same CityServicesPageClient),
 * because the real `services` table (target_table='services': Travel
 * Agencies, Apartments, Real Estate, Electronics, Transportation) has zero
 * rows in production and never had a hub of its own to show. That made this
 * a literal duplicate render of /city-services under a second URL — the
 * exact confusing "generic Services vs City Services" overlap this route
 * existed to paper over. /city-services is the one canonical page for this
 * content now.
 *
 * The real redirect happens in middleware.ts (a page-level redirect() here
 * doesn't reliably produce a real HTTP redirect behind app/[locale]/
 * loading.tsx's Suspense boundary — see that file's own comment on the
 * identical Lavender case) — this component is just a defensive fallback
 * for that same target, never expected to actually render in practice.
 *
 * /services/[category] and /services/[category]/[slug] (the real generic
 * `services`-table routes) have since been removed entirely — that whole
 * vertical was retired in favor of City Services as the one public category
 * system (see SERVICES_PUBLIC_ENABLED in lib/config/features.ts). The
 * `services` table itself and its category rows are untouched.
 */
export default function ServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const qs = searchParams.q ? `?q=${encodeURIComponent(searchParams.q)}` : "";
  redirect(`/${locale}/city-services${qs}`);
}
