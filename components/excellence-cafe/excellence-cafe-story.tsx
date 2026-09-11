import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";
import {
  EXCELLENCE_CAFE_STORY_PHOTOS,
  type ExcellenceCafeStoryPhoto,
} from "@/lib/config/excellence-cafe-photos";

/**
 * Excellence Café — "The Dining Experience" visual story. Excellence-Café
 * only. Editorial photography of the café's own rooftop terrace, lunch
 * buffet, coffee counter and service (real owner-supplied photos, curated
 * in lib/config/excellence-cafe-photos.ts) — a feature frame, two
 * alternating image/text rows, one cinematic band, and a three-up detail
 * set. Every headline / body / alt is EN/AR/SO (`excellenceCafe` namespace)
 * and describes only what the photo actually shows. Mirrors
 * components/the-village/village-experience-stories.tsx; no stock imagery,
 * no new global component. Food photography stays in Featured Dishes / the
 * gallery.
 */

const FEATURE_SIZES = "(max-width: 1023px) 92vw, 58vw";
const SPLIT_SIZES = "(max-width: 1023px) 92vw, 46vw";
const WIDE_SIZES = "(max-width: 1279px) 100vw, 1152px";
const DETAIL_SIZES = "(max-width: 639px) 92vw, 31vw";

const imgClass = "object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]";

export async function ExcellenceCafeStory({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });

  const byRole = (role: ExcellenceCafeStoryPhoto["role"]) =>
    EXCELLENCE_CAFE_STORY_PHOTOS.filter((p) => p.role === role);
  const feature = byRole("feature")[0];
  const splits = byRole("split");
  const band = byRole("band")[0];
  const details = byRole("detail");

  return (
    <section id="experience" className="container-px mx-auto max-w-6xl py-14 sm:py-20" style={{ scrollMarginTop: 128 }}>
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-2.5 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
            {t("experienceEyebrow")}
          </span>
          <h2 className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight sm:text-[2.05rem]">
            {t("experienceHeading")}
          </h2>
          <p className="mx-auto mt-4 text-[15px] leading-relaxed text-ink/60 dark:text-sand/60">{t("experienceIntro")}</p>
        </div>
      </Reveal>

      {/* Feature — large frame + editorial text */}
      {feature && (
        <Reveal>
          <div className="mt-11 grid items-center gap-8 lg:mt-14 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
            <div className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-ink/10 sm:aspect-[3/4] dark:border-white/10">
              <Image
                src={feature.src}
                alt={t(`photoAlt_${feature.key}`)}
                fill
                sizes={FEATURE_SIZES}
                style={{ objectPosition: feature.objectPosition }}
                className={imgClass}
              />
            </div>
            <div dir="auto" className="max-w-md text-start">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {t(`story_${feature.key}_title`)}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-ink/70 dark:text-sand/70">
                {t(`story_${feature.key}_body`)}
              </p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Alternating image / text rows */}
      <div className="mt-12 space-y-12 lg:mt-16 lg:space-y-16">
        {splits.map((photo, i) => (
          <Reveal key={photo.key}>
            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div
                className={`group relative aspect-[4/5] overflow-hidden rounded-xl border border-ink/10 sm:aspect-[16/13] lg:aspect-[4/5] dark:border-white/10 ${
                  i % 2 === 1 ? "lg:order-2" : ""
                }`}
              >
                <Image
                  src={photo.src}
                  alt={t(`photoAlt_${photo.key}`)}
                  fill
                  sizes={SPLIT_SIZES}
                  style={{ objectPosition: photo.objectPosition }}
                  className={imgClass}
                />
              </div>
              <div dir="auto" className="max-w-md text-start">
                <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                  {t(`story_${photo.key}_title`)}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-ink/70 dark:text-sand/70">
                  {t(`story_${photo.key}_body`)}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Cinematic band */}
      {band && (
        <Reveal>
          <div className="relative isolate mt-12 flex aspect-[4/3] items-end overflow-hidden rounded-xl sm:aspect-[2/1] lg:mt-16 lg:aspect-[5/2]">
            <Image
              src={band.src}
              alt={t(`photoAlt_${band.key}`)}
              fill
              sizes={WIDE_SIZES}
              style={{ objectPosition: band.objectPosition }}
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/5" />
            <div dir="auto" className="relative w-full p-6 text-start text-white sm:p-9 lg:p-12">
              <h3 className="max-w-lg font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t(`story_${band.key}_title`)}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">{t(`story_${band.key}_body`)}</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Detail set */}
      {details.length > 0 && (
        <Reveal>
          <div className="mt-12 grid gap-8 sm:grid-cols-3 sm:gap-5 lg:mt-16 lg:gap-8">
            {details.map((photo) => (
              <div key={photo.key}>
                <div className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
                  <Image
                    src={photo.src}
                    alt={t(`photoAlt_${photo.key}`)}
                    fill
                    sizes={DETAIL_SIZES}
                    style={{ objectPosition: photo.objectPosition }}
                    className={imgClass}
                  />
                </div>
                <h3 dir="auto" className="mt-5 font-display text-xl font-semibold tracking-tight">
                  {t(`story_${photo.key}_title`)}
                </h3>
                <p dir="auto" className="mt-2 max-w-sm text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                  {t(`story_${photo.key}_body`)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      )}
    </section>
  );
}
