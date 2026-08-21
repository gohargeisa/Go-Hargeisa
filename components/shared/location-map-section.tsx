import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton } from "@/components/shared/buttons";
import type { Locale } from "@/lib/i18n/config";
import type { Coordinates } from "@/types";

/**
 * ONE reusable "Location" section for every business/place detail page
 * (hotels/restaurants/cafes/attractions/events/city-services/services/
 * flowers) — replaces each page's own near-duplicate Location block.
 * Deliberately takes the caller's ALREADY-RESOLVED `mapsHref` (built via
 * lib/utils/google-maps.ts's resolveMapsUrl, which already prefers a
 * business's own saved Google Maps link over one generated from
 * coordinates) rather than re-deriving it — this component only renders,
 * it never decides which URL is "correct".
 *
 * "A missing location is better than a wrong location": renders nothing at
 * all when there's neither a usable address, coordinates, nor a resolved
 * maps link — never a generic Hargeisa fallback pin.
 *
 * The embedded map uses Google's key-less, no-billing embed endpoint
 * (maps.google.com/maps?...&output=embed) — the same "no API key, no paid
 * service" constraint the project's existing Google Maps link-out helpers
 * were already built under (see google-maps.ts's own header comment); it
 * only ever needs verified coordinates, never a Places/Maps API key.
 */
/** `events`/`city_services` rows that never got real coordinates were
 * backfilled to this exact Hargeisa-center value by
 * 20260803000015_events_upgrade.sql / 20260803000016_city_services_upgrade.sql
 * (and it remains each column's default for any future row that skips
 * lat/lng entirely). A handful of published businesses still sit at this
 * literal value — audited 2026-08-21, e.g. Mama Baby Care and Pinnacle
 * Perfumes and Cosmetics both have a correct saved Maps link but this
 * placeholder pair of coordinates. Never draw a pin at this exact
 * fallback: "missing location beats wrong location" means these rows get
 * the button (from their own real saved link) with no misleading embed,
 * same as a row with no coordinates at all — never a silent guess. */
const HARGEISA_DEFAULT_COORDS = { lat: 9.5624, lng: 44.065 };

function isGenericFallbackCoords(coords: Coordinates): boolean {
  return Math.abs(coords.lat - HARGEISA_DEFAULT_COORDS.lat) < 1e-6 && Math.abs(coords.lng - HARGEISA_DEFAULT_COORDS.lng) < 1e-6;
}

export async function LocationMapSection({
  locale,
  address,
  coords,
  mapsHref,
  name,
}: {
  locale: Locale;
  address?: string | null;
  coords?: Coordinates | null;
  mapsHref?: string;
  name: string;
}) {
  const hasCoords = !!coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) && !isGenericFallbackCoords(coords);
  if (!address && !hasCoords && !mapsHref) return null;

  const td = await getTranslations({ locale, namespace: "detail" });
  const embedSrc = hasCoords
    ? `https://maps.google.com/maps?q=${coords!.lat},${coords!.lng}&z=16&output=embed`
    : null;

  return (
    <Reveal>
      <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
        <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
          {td("location")}
        </h2>
        <div className="overflow-hidden rounded-xl3 border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.03]">
          {embedSrc && (
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
              <iframe
                src={embedSrc}
                title={`${name} — ${td("location")}`}
                loading="lazy"
                // Google's key-less embed endpoint applies its own
                // server-side referrer heuristics and is known to reject
                // requests carrying a `localhost` referrer ("This content
                // is blocked. Contact the site owner to fix the issue.")
                // while accepting the exact same URL from a real public
                // domain. Sending no referrer at all sidesteps that
                // environment-specific rejection in both places.
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
          )}
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            {address && (
              <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                {address}
              </p>
            )}
            {mapsHref && (
              <PrimaryButton href={mapsHref} external size="sm" className="shrink-0">
                {td("openInGoogleMaps")}
                <ExternalLink size={14} aria-hidden="true" />
              </PrimaryButton>
            )}
          </div>
        </div>
      </section>
    </Reveal>
  );
}
