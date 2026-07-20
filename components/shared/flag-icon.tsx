import type { Locale } from "@/lib/i18n/config";
import { localeConfig } from "@/lib/i18n/config";

/**
 * Renders a locale's flag — an emoji where Unicode has a correct one, or a
 * real SVG asset where it doesn't (Somaliland has no emoji flag, and must
 * never fall back to Somalia's flag).
 *
 * Uses a plain <img> rather than next/image: it's a tiny local vector icon,
 * so Next's image optimizer (which also requires extra config to allow
 * SVGs at all) would be pure overhead here.
 */
export function FlagIcon({ locale, size = 16 }: { locale: Locale; size?: number }) {
  const meta = localeConfig[locale];

  if (meta.flagSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={meta.flagSrc}
        alt={`${meta.label} flag`}
        width={size}
        height={Math.round(size * 0.75)}
        className="inline-block shrink-0 rounded-sm object-cover"
        style={{ width: size, height: Math.round(size * 0.75) }}
      />
    );
  }

  return (
    <span aria-hidden style={{ fontSize: size * 0.85, lineHeight: 1 }}>
      {meta.flagEmoji}
    </span>
  );
}
