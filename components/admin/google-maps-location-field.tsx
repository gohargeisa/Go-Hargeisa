"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MapPin, TriangleAlert } from "lucide-react";
import { parseGoogleMapsUrl } from "@/lib/utils/google-maps";
import { resolveGoogleMapsUrl } from "@/lib/actions/maps";
import { Field, inputClass } from "@/components/admin/form-shared";

/**
 * Replaces manual Latitude/Longitude number inputs with a single Google
 * Maps link field that extracts coordinates automatically — long-form URLs
 * are parsed client-side (parseGoogleMapsUrl), short links (maps.app.goo.gl)
 * are resolved via a server action that follows the redirect. Keeps a
 * collapsed manual-entry fallback for the rare link that can't be parsed
 * (e.g. a Place-ID-only URL with no visible coordinates), since lat/lng are
 * still NOT NULL columns underneath.
 */
export function GoogleMapsLocationField({
  googleMapsUrl,
  onGoogleMapsUrlChange,
  lat,
  lng,
  onCoordsChange,
}: {
  googleMapsUrl: string;
  onGoogleMapsUrlChange: (url: string) => void;
  lat: number;
  lng: number;
  onCoordsChange: (lat: number, lng: number) => void;
}) {
  const t = useTranslations("admin");
  const [resolving, setResolving] = useState(false);
  const [status, setStatus] = useState<"idle" | "found" | "not-found">(lat && lng ? "found" : "idle");
  const [manualOpen, setManualOpen] = useState(false);

  async function extract(url: string) {
    const trimmed = url.trim();
    if (!trimmed) {
      setStatus("idle");
      return;
    }
    const direct = parseGoogleMapsUrl(trimmed);
    if (direct) {
      onCoordsChange(direct.lat, direct.lng);
      setStatus("found");
      return;
    }
    setResolving(true);
    const resolved = await resolveGoogleMapsUrl(trimmed).catch(() => null);
    setResolving(false);
    if (resolved) {
      onCoordsChange(resolved.lat, resolved.lng);
      setStatus("found");
    } else {
      setStatus("not-found");
    }
  }

  return (
    <div className="space-y-2">
      <Field label={t("mapsUrlLabel")}>
        <input
          type="url"
          required
          value={googleMapsUrl}
          onChange={(e) => onGoogleMapsUrlChange(e.target.value)}
          onBlur={(e) => extract(e.target.value)}
          className={inputClass}
          placeholder="https://maps.google.com/?q=…"
        />
      </Field>

      {resolving && (
        <p className="flex items-center gap-1.5 text-xs text-ink/50 dark:text-sand/50">
          <Loader2 size={12} className="animate-spin" /> {t("resolvingMapsLink")}
        </p>
      )}
      {!resolving && status === "found" && (
        <p className="flex items-center gap-1.5 text-xs text-accent-700">
          <MapPin size={12} /> {t("locationDetected", { lat: lat.toFixed(5), lng: lng.toFixed(5) })}
        </p>
      )}
      {!resolving && status === "not-found" && (
        <p className="flex items-center gap-1.5 text-xs text-amber-600">
          <TriangleAlert size={12} /> {t("locationNotDetected")}
        </p>
      )}

      {!manualOpen ? (
        <button type="button" onClick={() => setManualOpen(true)} className="text-xs font-semibold text-primary hover:underline">
          {t("enterCoordinatesManually")}
        </button>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("latitudeLabel")}>
            <input
              type="number"
              step="0.0001"
              value={lat}
              onChange={(e) => {
                onCoordsChange(Number(e.target.value), lng);
                setStatus("found");
              }}
              className={inputClass}
            />
          </Field>
          <Field label={t("longitudeLabel")}>
            <input
              type="number"
              step="0.0001"
              value={lng}
              onChange={(e) => {
                onCoordsChange(lat, Number(e.target.value));
                setStatus("found");
              }}
              className={inputClass}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
