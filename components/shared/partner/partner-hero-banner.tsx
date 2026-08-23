import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";
import { isPlaceholderImage } from "@/lib/utils/is-placeholder-image";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";

/**
 * Brand-atmosphere band shown above the existing logo/name block
 * (HotelHeaderTop) on a themed partner's page — the "hero" moment. Reusable
 * across any future partner: every partner-specific detail (which image,
 * how to fit it, the theme colors) comes from `theme` (see
 * lib/config/partner-themes.ts), nothing is hardcoded here. Deliberately
 * does not repeat the business name/logo/rating (those stay exclusively in
 * HotelHeaderTop right below, a shared/locked component this intentionally
 * does not touch or duplicate).
 *
 * Two fit modes, chosen per-partner via `theme.heroImageFit`:
 * - "contain": the partner supplied a finished, self-contained hero graphic
 *   (their own logo/wordmark/copy already baked into the artwork, like
 *   Lavender's). Rendered at its native aspect ratio, width 100%, height
 *   auto — never cropped, on any screen size — with no dark overlay (the
 *   art needs none) and the "Featured Partner" badge as a separate strip
 *   below it rather than layered on top of the artwork's own content.
 * - "cover": an ordinary photo with no baked-in text, filling a full-bleed
 *   banner with a brand-color gradient wash for legibility and the badge
 *   overlaid at the bottom — the previous behavior, still available for a
 *   future partner whose "hero" is just a great photo rather than a
 *   designed graphic.
 */
export async function PartnerHeroBanner({ theme, alt, locale }: { theme: PartnerTheme; alt: string; locale: Locale }) {
  const td = await getTranslations({ locale, namespace: "detail" });

  // Callers already gate on `theme.heroImage` before rendering this
  // component (see each page's `{partnerTheme?.heroImage && <PartnerHeroBanner .../>}`),
  // but this guard keeps the component safe to call directly too, and
  // narrows `heroImage` from optional to string for everything below.
  if (!theme.heroImage) return null;
  const heroImage = theme.heroImage;

  const badge = (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide"
      style={{
        backgroundColor: `rgba(${theme.accentRgb}, 0.12)`,
        border: `1px solid rgba(${theme.accentRgb}, 0.6)`,
        color: theme.accentStrong,
      }}
    >
      <Sparkles size={12} style={{ color: theme.accent }} aria-hidden="true" />
      {td("featuredPartner")}
    </span>
  );

  if (theme.heroImageFit === "contain") {
    return (
      <Reveal y={0}>
        <div className="w-full">
          <Image
            src={heroImage}
            alt={alt}
            width={theme.heroImageWidth ?? 1600}
            height={theme.heroImageHeight ?? 900}
            priority
            quality={95}
            sizes="100vw"
            className="h-auto w-full"
          />
          <div className="flex justify-center py-3" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
            {badge}
          </div>
        </div>
      </Reveal>
    );
  }

  const hasPhoto = !isPlaceholderImage(heroImage);

  return (
    <Reveal y={0}>
      <div className="relative h-[42vh] max-h-[420px] min-h-[260px] w-full overflow-hidden sm:h-[50vh] sm:max-h-[480px]">
        {hasPhoto ? (
          <Image
            src={heroImage}
            alt={alt}
            fill
            priority
            quality={90}
            sizes="100vw"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR_DATA_URL}
            className={`object-cover ${theme.heroImagePosition ?? "object-[50%_50%]"}`}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(150deg, ${theme.primaryStrong} 0%, ${theme.primary} 55%, ${theme.primaryMid} 100%)` }}
            aria-hidden="true"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(${theme.primaryRgb}, 0.12) 0%, rgba(${theme.primaryRgb}, 0.28) 55%, rgba(${theme.primaryRgb}, 0.88) 100%)`,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 90% at 85% 0%, rgba(${theme.accentRgb}, 0.22) 0%, rgba(${theme.accentRgb}, 0) 55%)`,
          }}
          aria-hidden="true"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 pb-6 text-center sm:pb-8">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.12)", border: `1px solid rgba(${theme.accentRgb}, 0.75)` }}
          >
            <Sparkles size={12} style={{ color: theme.accentSoft }} aria-hidden="true" />
            {td("featuredPartner")}
          </span>
          <span className="h-px w-10 rounded-full" style={{ backgroundColor: theme.accentSoft, opacity: 0.8 }} aria-hidden="true" />
        </div>
      </div>
    </Reveal>
  );
}
