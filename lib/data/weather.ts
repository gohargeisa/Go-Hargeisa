import { cache } from "react";

/**
 * Hargeisa city-center coordinates — the same point every real business
 * location in this app clusters around (see lib/mock-data.ts's lat/lng
 * values, all ~9.55-9.57 / 44.06-44.09). A fixed constant, not the
 * admin-editable site_settings.map_center_lat/lng (that field drives the
 * interactive city map's own view and is a separate concern) — this
 * feature's target is explicitly "Hargeisa, Somaliland", not wherever an
 * admin last panned the map.
 */
const HARGEISA_LAT = 9.56;
const HARGEISA_LNG = 44.065;

/**
 * Open-Meteo (open-meteo.com) — chosen because it requires NO API key at
 * all (nothing to leak, nothing to provision/rotate) and its free tier
 * has no rate limit for this app's traffic. Returns WMO weather codes
 * (a fixed, documented international standard) plus `is_day`, so day/night
 * comes directly from the provider rather than being guessed from the
 * server's clock.
 */
const OPEN_METEO_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${HARGEISA_LAT}&longitude=${HARGEISA_LNG}` +
  `&current=temperature_2m,weather_code,is_day&timezone=auto`;

export type WeatherCondition = "clear" | "partlyCloudy" | "cloudy" | "fog" | "rain" | "storm" | "snow";

export interface WeatherSnapshot {
  temperatureC: number;
  condition: WeatherCondition;
  isDay: boolean;
}

/** WMO weather_code -> this app's own small condition vocabulary. Every
 * code Open-Meteo documents is covered; unrecognized/future codes fall
 * back to "cloudy" (the safest default: never falsely claims "Clear"
 * for something that isn't). https://open-meteo.com/en/docs (WMO Weather
 * interpretation codes table). */
function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partlyCloudy";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "cloudy";
}

/**
 * Server-only fetch, cached at the Next.js data-cache layer for 30 minutes
 * (`next.revalidate`) so this never runs on every request/every visitor —
 * one shared, periodically-refreshed value for the whole site, the same
 * ISR-style pattern already used elsewhere in lib/data/*. `cache()` on top
 * only dedupes repeat calls within a single render pass (there are none
 * today, but matches the existing lib/data/categories.ts convention).
 * Returns null on any failure — never throws — so a slow/unreachable
 * weather provider degrades to "no indicator shown", never a broken page
 * or a visible error for site visitors.
 */
export const getHargeisaWeather = cache(async function _getHargeisaWeather(): Promise<WeatherSnapshot | null> {
  try {
    const res = await fetch(OPEN_METEO_URL, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number; is_day?: number };
    };
    const current = data.current;
    if (!current || typeof current.temperature_2m !== "number" || typeof current.weather_code !== "number") {
      return null;
    }

    return {
      temperatureC: Math.round(current.temperature_2m),
      condition: conditionFromWmoCode(current.weather_code),
      isDay: current.is_day !== 0,
    };
  } catch {
    return null;
  }
});
