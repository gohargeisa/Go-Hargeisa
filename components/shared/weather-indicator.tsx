"use client";

import { Sun, Moon, CloudSun, CloudMoon, Cloud, CloudFog, CloudRain, CloudMoonRain, CloudLightning, CloudSnow } from "lucide-react";
import { useTranslations } from "next-intl";
import type { WeatherSnapshot } from "@/lib/data/weather";

/** Icon per condition, day vs. night — lucide-react (already the app's
 * only icon library, see e.g. cart-button.tsx/notification-bell.tsx), not
 * emoji, so it renders as a crisp, theme-consistent glyph rather than a
 * platform-dependent emoji font. "Cloudy"/"Fog"/"Storm" intentionally use
 * the same glyph for both day and night — matching how this app's other
 * icons (ShoppingCart, Bell, ...) don't have day/night variants either;
 * only clear/partly-cloudy/rain have a real sun-vs-moon distinction. */
const ICONS: Record<WeatherSnapshot["condition"], { day: typeof Sun; night: typeof Sun }> = {
  clear: { day: Sun, night: Moon },
  partlyCloudy: { day: CloudSun, night: CloudMoon },
  cloudy: { day: Cloud, night: Cloud },
  fog: { day: CloudFog, night: CloudFog },
  rain: { day: CloudRain, night: CloudMoonRain },
  storm: { day: CloudLightning, night: CloudLightning },
  snow: { day: CloudSnow, night: CloudSnow },
};

/** Compact "☀️ Hargeisa • 27°C • Clear"-style top-bar badge — informational
 * only (not a button/link), so it takes no part in the header's tab order.
 * Renders nothing at all when weather data couldn't be fetched (see
 * getHargeisaWeather's null-on-failure contract) — same "hide gracefully
 * rather than show a broken/empty state" convention already used by
 * FeaturedPartnersShowcase for zero partners. */
export function WeatherIndicator({ weather, scrolled, className = "" }: { weather: WeatherSnapshot | null; scrolled: boolean; className?: string }) {
  const t = useTranslations("weather");

  if (!weather) return null;

  const Icon = weather.isDay ? ICONS[weather.condition].day : ICONS[weather.condition].night;
  const conditionLabel = t(`condition_${weather.condition}`);
  const text = `${t("location")} • ${weather.temperatureC}${t("unitSuffix")} • ${conditionLabel}`;

  return (
    <span
      role="status"
      aria-label={t("ariaLabel", { location: t("location"), temperature: weather.temperatureC, condition: conditionLabel })}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-300 ${
        scrolled
          ? "border-ink/10 bg-ink/5 text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
          : "border-white/25 bg-white/10 text-white backdrop-blur-md"
      } ${className}`}
    >
      <Icon size={14} aria-hidden="true" />
      <span className="whitespace-nowrap">{text}</span>
    </span>
  );
}
