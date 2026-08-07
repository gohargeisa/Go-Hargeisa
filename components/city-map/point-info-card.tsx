"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ExternalLink, MapPin, Navigation, Phone } from "lucide-react";
import type { CityServicePoint } from "@/types";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import { ClaimBusinessButton } from "@/components/shared/claim-business-button";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import type { VisitorLocation } from "@/lib/hooks/use-visitor-location";
import { serviceHref } from "@/lib/utils/service-categories";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { distanceKm } from "@/lib/utils/geo";

export function PointInfoCard({
  point,
  locale = "en",
  visitorLocation,
}: {
  point: CityServicePoint;
  locale?: string;
  /** Browser-geolocation coords, requested once by the caller (CityMapExperience)
   * and shared across every card so only one permission prompt is ever shown. */
  visitorLocation?: VisitorLocation | null;
}) {
  const t = useTranslations("nearby");
  const td = useTranslations("detail");
  const tl = useTranslations("listings");
  const meta = CATEGORY_CONFIG[point.category];
  const Icon = meta.icon;
  const hasCoordinates = Number.isFinite(point.location?.lat) && Number.isFinite(point.location?.lng);
  const googleMapsHref = resolveMapsUrl(point.location);
  const directionsHref = resolveDirectionsUrl(point.location);
  const km =
    visitorLocation && hasCoordinates
      ? distanceKm(visitorLocation.lat, visitorLocation.lng, point.location.lat, point.location.lng)
      : null;

  // Only Phase 2 `services` points carry a slug — that's what distinguishes
  // them from legacy map_points pins, which have no detail page to link to.
  const isServicePoint = Boolean(point.slug);
  const detailHref = point.slug && point.categorySlug ? `/${locale}${serviceHref(point.categorySlug, point.slug)}` : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: meta.color }}
          >
            {meta.label}
          </span>
          <h3 className="mt-1.5 truncate font-display text-lg font-bold text-ink dark:text-white">
            {point.name}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <OpenStatusBadge groups={point.openingHoursStructured ?? []} />
        {km !== null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-sand/60">
            {t("distanceAway", { km: km < 1 ? km.toFixed(1) : km.toFixed(0) })}
          </span>
        )}
      </div>

      {point.description && (
        <p className="text-sm leading-relaxed text-ink/70 dark:text-sand/70">{point.description}</p>
      )}

      {point.address && (
        <p className="flex items-start gap-1.5 text-xs text-ink/60 dark:text-sand/60">
          <MapPin size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
          {point.address}
        </p>
      )}

      {!point.address && hasCoordinates && (
        <p className="flex items-center gap-1.5 text-xs text-ink/70 dark:text-sand/70">
          <MapPin size={13} className="shrink-0" aria-hidden="true" />
          {point.location.lat.toFixed(5)}, {point.location.lng.toFixed(5)}
        </p>
      )}

      {point.phone && (
        <div className={`grid gap-2.5 ${directionsHref ? "grid-cols-2" : "grid-cols-1"}`}>
          <a
            href={`tel:${point.phone}`}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          >
            <Phone size={14} aria-hidden="true" />
            {tl("call")}
          </a>
          {directionsHref && (
            <a
              href={directionsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
            >
              <Navigation size={14} aria-hidden="true" />
              {td("directions")}
            </a>
          )}
        </div>
      )}

      <div className="space-y-2.5">
        {detailHref && (
          <Link
            href={detailHref}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
          >
            {tl("viewDetails")}
          </Link>
        )}

        {!point.phone && directionsHref && (
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          >
            <Navigation size={14} aria-hidden="true" />
            {td("directions")}
          </a>
        )}

        {!directionsHref && googleMapsHref && (
          <a
            href={googleMapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
          >
            {td("openInGoogleMaps")}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}

        {isServicePoint && point.slug && (
          <ClaimBusinessButton
            listingType="service"
            listingId={point.id}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          />
        )}
      </div>
    </div>
  );
}
