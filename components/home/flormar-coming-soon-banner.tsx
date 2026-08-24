import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Gem, Sparkles, Heart, Leaf, Bell } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import type { Locale } from "@/lib/i18n/config";

const FEATURES = [
  { icon: Gem, key: "featurePremium" as const },
  { icon: Sparkles, key: "featureCollection" as const },
  { icon: Heart, key: "featureBeauty" as const },
  { icon: Leaf, key: "featureQuality" as const },
];

/**
 * Homepage teaser for Flormar Hargeisa — the business owner's own supplied
 * banner artwork (public/images/banners/flormar-coming-soon.png, 1717×916),
 * with its marketing copy separated from the pixels so it can actually be
 * localized. The original PNG has three baked-in English text regions
 * (a large left copy block, a small circular "Discover Beauty / Discover
 * You" badge on the right, and a bottom footer strip) — no image-editing
 * tool is available in this environment to remove or regenerate any of
 * them, so only the large left block (the actual headline/CTA a visitor
 * reads first) is addressed: a left-to-right scrim, color-sampled directly
 * from the real image via sharp (RGB ~244,220,222 fading to transparent by
 * ~62% width — same left-biased-scrim-over-photo technique this project's
 * own FlormarStorefront hero already uses), covers just that text region
 * so real, translated HTML can sit on top of it. The product photography,
 * arches, florals, small corner badge, and footer strip are the ORIGINAL
 * image pixels, untouched — same composition, same products, same palette.
 * "Flormar Hargeisa" itself is rendered as real text (not translated — a
 * brand name, same rule as "Go Hargeisa") using the exact heading treatment
 * (font-display, bold, tracking-tight) FlormarStorefront's own hero already
 * uses, so the two experiences read as the same brand.
 *
 * Mobile reuses the same stacked-vs-overlay split FlormarStorefront's own
 * hero already established: below `sm`, the scrim/overlay text becomes
 * illegible at that width, so the product-photography crop (no text in that
 * region) sits on top and the real text block sits below it in a plain
 * color-matched panel instead of overlaid.
 *
 * Deliberately NOT a link: Flormar Hargeisa's real listing is still
 * `status: 'draft'` (see lib/config/partner-themes.ts's FLORMAR_THEME
 * comment) — there is no approved public destination to send a homepage
 * visitor to yet, so this stays a plain, non-interactive teaser rather than
 * implying the storefront is already live.
 */
export async function FlormarComingSoonBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "flormarComingSoonBanner" });

  const textBlock = (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#C0447A] sm:text-sm">{t("eyebrow")}</p>
      <h2 className="mt-2 text-balance font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-[2.75rem]">
        Flormar <span className="text-[#C0447A]">Hargeisa</span>
      </h2>
      <p className="mt-3 max-w-sm text-balance text-sm leading-relaxed text-ink/70 sm:text-base">
        {t.rich("tagline", { hargeisa: (chunks) => <span className="font-semibold text-[#C0447A]">{chunks}</span> })}
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5">
        {FEATURES.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-center gap-1.5 text-xs font-semibold text-ink/70 sm:text-sm">
            <Icon size={14} className="shrink-0 text-[#C0447A]" aria-hidden="true" />
            {t(key)}
          </li>
        ))}
      </ul>

      <div className="mt-6 inline-flex items-center gap-2.5 rounded-full bg-[#C0447A] px-5 py-2.5 text-white shadow-[0_10px_24px_rgba(192,68,122,0.35)]">
        <Bell size={16} className="shrink-0" aria-hidden="true" />
        <span className="text-start leading-tight">
          <span className="block text-sm font-bold">{t("ctaTitle")}</span>
          <span className="block text-[11px] font-medium text-white/85">{t("ctaSubtitle")}</span>
        </span>
      </div>
    </>
  );

  return (
    <section className="container-px mx-auto pb-6 pt-6 sm:pt-8">
      <Reveal>
        <div className="overflow-hidden rounded-xl3 shadow-card">
          {/* Mobile (<sm): product photo (cropped to the right, text-free
              region of the source image) stacked above a real, readable
              text panel — the overlay approach below is illegible this
              narrow, same reasoning as the storefront hero's own mobile split. */}
          <div className="sm:hidden">
            <div className="relative w-full" style={{ aspectRatio: "1717 / 620" }}>
              <Image
                src="/images/banners/flormar-coming-soon.png"
                alt=""
                fill
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: "78% 45%" }}
              />
            </div>
            <div className="px-6 py-8" style={{ backgroundColor: "#FBF0F1" }}>
              {textBlock}
            </div>
          </div>

          {/* sm+: full-bleed artwork with a left-biased scrim (color-sampled
              from the real image) covering the original baked-in text
              region, real HTML text on top of it, product photography on
              the right left fully uncovered and unmodified.

              `dir="ltr"` is pinned here deliberately, same reasoning as
              FlormarStorefront's own hero: the scrim/text panel must stay on
              the PHYSICAL left (where the source image's flat background
              actually is) in every locale — the artwork itself must never
              mirror. Without this, Arabic's RTL flex/text-align would push
              the text block to the physical right, landing on top of the
              unscrimmed product photography instead of the pink panel. */}
          <div dir="ltr" className="relative hidden min-h-[320px] items-center sm:flex md:min-h-[380px]">
            <Image
              src="/images/banners/flormar-coming-soon.png"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover"
              priority={false}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgb(244,220,222) 0%, rgb(244,220,222) 40%, rgba(244,220,222,0.92) 48%, rgba(244,220,222,0) 62%)",
              }}
            />
            <div dir="ltr" className="relative z-10 max-w-md px-8 py-10 text-left md:px-12 lg:px-16">
              {textBlock}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
