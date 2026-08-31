import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";
import { THE_VILLAGE_STORY_PHOTOS, type VillageStoryPhoto } from "@/lib/config/the-village-photos";

/**
 * The Village Hargeisa — "The Village, up close" visual-story section.
 * Village-only. Editorial photography of the restaurant's own space
 * (public/images/partners/the-village/atmosphere/, curated in
 * lib/config/the-village-photos.ts) — a feature spread, two alternating
 * image/text rows, one cinematic band, a three-up detail set and a
 * closing frame.
 * Every headline + body + alt is EN/AR/SO (`theVillage` namespace) and
 * describes only what the photo actually shows. No stock imagery. Sits
 * between Signature Selection and the menu; food photography stays in the
 * Signature section.
 *
 * Sources are phone-portrait, so each frame carries its own tuned
 * `objectPosition` and the wide blocks use fixed aspect ratios (never `vh`)
 * so the crop is predictable across desktop / tablet / mobile. All images
 * lazy-load (next/image default; none are `priority`).
 */

const FEATURE_SIZES = "(max-width: 1023px) 92vw, 58vw";
const SPLIT_SIZES = "(max-width: 1023px) 92vw, 46vw";
const WIDE_SIZES = "(max-width: 1279px) 100vw, 1152px";
const DETAIL_SIZES = "(max-width: 639px) 92vw, 46vw";

const imgClass = "object-cover transition-transform duration-700 ease-premium group-hover:scale-[1.03]";

export async function VillageExperienceStories({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "theVillage" });

  const byRole = (role: VillageStoryPhoto["role"]) => THE_VILLAGE_STORY_PHOTOS.filter((p) => p.role === role);
  const feature = byRole("feature")[0];
  const splits = byRole("split");
  const band = byRole("band")[0];
  const details = byRole("detail");
  const closer = byRole("closer")[0];

  return (
    <section id="experience" className="container-px mx-auto max-w-6xl py-16 sm:py-24" style={{ scrollMarginTop: 80 }}>
      <Reveal>
        <div className="mx-auto max-w-2xl text-center">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
            {t("storyEyebrow")}
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("storyHeading")}</h2>
          <p className="mx-auto mt-4 text-[15px] leading-relaxed text-ink/60 dark:text-sand/60">{t("storyIntro")}</p>
        </div>
      </Reveal>

      {/* Feature — asymmetric large image + editorial text */}
      {feature && (
        <Reveal>
          <div className="mt-12 grid items-center gap-8 lg:mt-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
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
            <div className="max-w-md text-start">
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
      <div className="mt-14 space-y-14 lg:mt-20 lg:space-y-20">
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
              <div className="max-w-md text-start">
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
          <div className="relative isolate mt-14 flex aspect-[4/3] items-end overflow-hidden rounded-xl sm:aspect-[2/1] lg:mt-20 lg:aspect-[5/2]">
            <Image
              src={band.src}
              alt={t(`photoAlt_${band.key}`)}
              fill
              sizes={WIDE_SIZES}
              style={{ objectPosition: band.objectPosition }}
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/35 to-ink/5" />
            <div className="relative w-full p-6 text-start text-white sm:p-9 lg:p-12">
              <h3 className="max-w-lg font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t(`story_${band.key}_title`)}
              </h3>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/75">{t(`story_${band.key}_body`)}</p>
            </div>
          </div>
        </Reveal>
      )}

      {/* Detail set — hand-worked wall, arched niche, woven pendant */}
      {details.length > 0 && (
        <Reveal>
          <div className="mt-14 grid gap-8 sm:grid-cols-3 sm:gap-5 lg:mt-20 lg:gap-10">
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
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{t(`story_${photo.key}_title`)}</h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                  {t(`story_${photo.key}_body`)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* Closer */}
      {closer && (
        <Reveal>
          <div className="relative isolate mt-14 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl sm:aspect-[3/2] lg:mt-20 lg:aspect-[21/9]">
            <Image
              src={closer.src}
              alt={t(`photoAlt_${closer.key}`)}
              fill
              sizes={WIDE_SIZES}
              style={{ objectPosition: closer.objectPosition }}
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/45 to-ink/35" />
            <div className="relative mx-auto max-w-lg px-6 text-center text-white">
              <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t(`story_${closer.key}_title`)}
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">
                {t(`story_${closer.key}_body`)}
              </p>
            </div>
          </div>
        </Reveal>
      )}
    </section>
  );
}
