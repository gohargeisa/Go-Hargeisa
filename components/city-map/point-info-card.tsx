import { ExternalLink, MapPin } from "lucide-react";
import type { CityServicePoint } from "@/types";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";

export function PointInfoCard({ point }: { point: CityServicePoint }) {
  const meta = CATEGORY_CONFIG[point.category];
  const Icon = meta.icon;
  const hasCoordinates = Number.isFinite(point.location?.lat) && Number.isFinite(point.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${point.location.lat},${point.location.lng}`
    : undefined;

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

      {hasCoordinates && (
        <p className="flex items-center gap-1.5 text-xs text-ink/50 dark:text-sand/50">
          <MapPin size={13} className="shrink-0" aria-hidden="true" />
          {point.location.lat.toFixed(5)}, {point.location.lng.toFixed(5)}
        </p>
      )}

      {googleMapsHref && (
        <a
          href={googleMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
        >
          Open in Google Maps
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
