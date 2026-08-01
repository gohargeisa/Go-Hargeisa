import { MapPinOff } from "lucide-react";

/** Shown instead of a live map when no Google Maps API key is configured
 * (see lib/config/google-maps.ts) — every map component checks
 * GOOGLE_MAPS_CONFIGURED and renders this rather than letting
 * @vis.gl/react-google-maps fail without a key. */
export function MapUnavailable({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-ink/5 text-center dark:bg-white/5 ${className}`}>
      <MapPinOff size={22} className="text-ink/30 dark:text-sand/30" aria-hidden="true" />
      <p className="max-w-[220px] text-xs text-ink/50 dark:text-sand/50">Map unavailable — Google Maps is not configured.</p>
    </div>
  );
}
