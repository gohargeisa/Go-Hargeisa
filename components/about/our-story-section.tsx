import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/home/reveal";
import { Timeline } from "@/components/shared/timeline";
import type { TimelineStep } from "@/components/shared/timeline";

/** Reuses the shared hero photo (see about-hero.tsx) — no dedicated "our story" photo exists yet. */
const STORY_IMAGE = "/images/hero-bg.png";

// Server Component (no "use client") — uses next-intl's async getTranslations
// rather than the client useTranslations hook, matching every other
// server-rendered section in app/[locale]/about/page.tsx.
export async function OurStorySection({ steps }: { steps: TimelineStep[] }) {
  const t = await getTranslations("about");

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl3 shadow-premium sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src={STORY_IMAGE}
              alt="Hargeisa cityscape"
              fill
              sizes="(max-width: 1023px) 92vw, 45vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
            {t("storyEyebrow")}
          </span>
          <h2 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("storyTitle")}
          </h2>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-ink/70 dark:text-sand/70">
            <p>
              {t.rich("paragraph1", {
                highlight: (chunks) => <strong className="font-semibold text-primary-700">{chunks}</strong>,
              })}
            </p>
            <p>
              {t.rich("paragraph2", {
                highlight: (chunks) => <strong className="font-semibold text-primary-700">{chunks}</strong>,
              })}
            </p>
          </div>
        </Reveal>
      </div>

      <div className="mt-16 md:mt-20">
        <Timeline steps={steps} />
      </div>
    </section>
  );
}
