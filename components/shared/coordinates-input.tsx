"use client";

import { useState } from "react";
import { Link2, MapPin } from "lucide-react";
import { parseGoogleMapsUrl } from "@/lib/utils/google-maps";
import type { Coordinates } from "@/types";

/**
 * No-map coordinate entry — paste a Google Maps link (auto-extracts lat/
 * lng) or type them in directly. Replaces the old click-a-pin-on-a-map
 * picker now that the app doesn't embed any map anywhere; the resulting
 * {lat, lng} is stored exactly the same way either input path was reached.
 */
export function CoordinatesInput({
  value,
  onChange,
  pasteLabel,
  pastePlaceholder = "https://maps.google.com/…",
  pasteErrorLabel,
  latLabel,
  lngLabel,
  confirmedLabel,
}: {
  value: Coordinates | null;
  onChange: (coords: Coordinates | null) => void;
  pasteLabel: string;
  pastePlaceholder?: string;
  pasteErrorLabel: string;
  latLabel: string;
  lngLabel: string;
  confirmedLabel: (lat: string, lng: string) => string;
}) {
  const [latText, setLatText] = useState(value ? String(value.lat) : "");
  const [lngText, setLngText] = useState(value ? String(value.lng) : "");
  const [pasteText, setPasteText] = useState("");
  const [pasteError, setPasteError] = useState(false);

  function commit(nextLat: string, nextLng: string) {
    const lat = parseFloat(nextLat);
    const lng = parseFloat(nextLng);
    onChange(Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null);
  }

  function onLatChange(v: string) {
    setLatText(v);
    commit(v, lngText);
  }

  function onLngChange(v: string) {
    setLngText(v);
    commit(latText, v);
  }

  function onPasteChange(v: string) {
    setPasteText(v);
    if (!v.trim()) {
      setPasteError(false);
      return;
    }
    const parsed = parseGoogleMapsUrl(v);
    if (parsed) {
      setPasteError(false);
      setLatText(String(parsed.lat));
      setLngText(String(parsed.lng));
      onChange(parsed);
    } else {
      setPasteError(true);
    }
  }

  const inputClass =
    "h-10 w-full rounded-lg border border-ink/15 bg-transparent px-3 text-sm outline-none focus:border-primary dark:border-white/20";

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink/60 dark:text-sand/60">
          <Link2 size={13} aria-hidden="true" />
          {pasteLabel}
        </label>
        <input
          type="url"
          value={pasteText}
          onChange={(e) => onPasteChange(e.target.value)}
          placeholder={pastePlaceholder}
          className={inputClass}
        />
        {pasteError && <p className="mt-1.5 text-xs text-red-600">{pasteErrorLabel}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-sand/60">{latLabel}</label>
          <input
            type="text"
            inputMode="decimal"
            value={latText}
            onChange={(e) => onLatChange(e.target.value)}
            placeholder="9.5624"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-sand/60">{lngLabel}</label>
          <input
            type="text"
            inputMode="decimal"
            value={lngText}
            onChange={(e) => onLngChange(e.target.value)}
            placeholder="44.0650"
            className={inputClass}
          />
        </div>
      </div>

      {value && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-secondary-700 dark:text-sand/70">
          <MapPin size={13} className="shrink-0" aria-hidden="true" />
          {confirmedLabel(value.lat.toFixed(5), value.lng.toFixed(5))}
        </p>
      )}
    </div>
  );
}
