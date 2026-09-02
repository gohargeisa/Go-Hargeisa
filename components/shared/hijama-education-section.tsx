import { getTranslations } from "next-intl/server";
import { Clock } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { EducationalCardsSection, type EducationalCard } from "@/components/shared/educational-cards-section";
import { Reveal } from "@/components/home/reveal";

/**
 * Hijama education for any clinic with `clinic_type = 'hijama'` — NOT a
 * per-partner hack: it renders for every Hijama clinic in the directory,
 * driven purely by the category field. Al-Hikma is simply the first.
 *
 * Content is general, responsibly-worded wellness information (recreated
 * from public sources, no third-party clinic branding/graphics), all in
 * i18n so it translates. The cupping-point card uses a recreated inline SVG
 * body map (labels are real <text>, so they localise) rather than a
 * rasterised diagram with baked-in English.
 *
 * Health language is deliberately soft ("may support", "commonly used
 * for") and the "Hijama in the Sunnah" block is kept visually and
 * semantically separate from any wellness claim.
 */

/** Recreated, schematic back/torso cupping-point map. Decorative + labelled;
 * the meaning is carried by the adjacent text, so it's aria-hidden. */
function CuppingPointsDiagram({ nape, shoulders, midBack, lowBack }: { nape: string; shoulders: string; midBack: string; lowBack: string }) {
  return (
    <svg viewBox="0 0 120 170" className="h-40 w-auto" role="img" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/40">
        {/* simplified torso from behind */}
        <path d="M60 14c7 0 12 5 12 12s-5 12-12 12-12-5-12-12 5-12 12-12Z" />
        <path d="M40 44c6-4 34-4 40 0 6 4 8 40 6 66-1 14-4 30-6 40H40c-2-10-5-26-6-40-2-26 0-62 6-66Z" />
      </g>
      <g className="text-primary" fill="currentColor">
        {/* nape (al-kahil) */}
        <circle cx="60" cy="42" r="4" />
        {/* shoulders */}
        <circle cx="47" cy="58" r="4" />
        <circle cx="73" cy="58" r="4" />
        {/* mid back */}
        <circle cx="52" cy="86" r="4" />
        <circle cx="68" cy="86" r="4" />
        {/* low back */}
        <circle cx="50" cy="116" r="4" />
        <circle cx="70" cy="116" r="4" />
      </g>
      <g fontSize="7" fill="currentColor" className="text-ink/55 dark:text-sand/55">
        <text x="2" y="44">{nape}</text>
        <text x="2" y="60">{shoulders}</text>
        <text x="2" y="88">{midBack}</text>
        <text x="2" y="118">{lowBack}</text>
      </g>
    </svg>
  );
}

export async function HijamaEducationSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "hijamaEducation" });

  const cards: EducationalCard[] = [
    { id: "what-is", title: t("whatIs.title"), body: [t("whatIs.body1"), t("whatIs.body2")] },
    { id: "wet-dry", title: t("wetVsDry.title"), body: [t("wetVsDry.body1"), t("wetVsDry.body2")] },
    { id: "uses", title: t("commonUses.title"), body: t("commonUses.body"), note: t("commonUses.note") },
    {
      id: "points",
      title: t("points.title"),
      body: t("points.body"),
      illustration: (
        <CuppingPointsDiagram
          nape={t("points.labelNape")}
          shoulders={t("points.labelShoulders")}
          midBack={t("points.labelMidBack")}
          lowBack={t("points.labelLowBack")}
        />
      ),
      illustrationCaption: t("points.caption"),
    },
    { id: "prep", title: t("preparation.title"), body: t("preparation.body") },
    { id: "aftercare", title: t("aftercare.title"), body: t("aftercare.body") },
    { id: "hygiene", title: t("hygiene.title"), body: t("hygiene.body") },
  ];

  const sunnahCards: EducationalCard[] = [
    { id: "s1", title: t("sunnah.source1"), body: t("sunnah.text1") },
    { id: "s2", title: t("sunnah.source2"), body: t("sunnah.text2") },
  ];

  return (
    <>
      <Reveal>
        <EducationalCardsSection
          id="hijama-education"
          eyebrow={t("eyebrow")}
          title={t("title")}
          intro={t("intro")}
          cards={cards}
          footnote={t("medicalDisclaimer")}
        />
      </Reveal>

      <Reveal>
        <EducationalCardsSection
          id="hijama-sunnah"
          title={t("sunnah.title")}
          intro={t("sunnah.intro")}
          cards={sunnahCards}
          variant="sunnah"
          footnote={t("sunnah.footnote")}
        />
      </Reveal>

      <Reveal>
        <section id="hijama-womens" aria-labelledby="hijama-womens-heading" className="scroll-mt-36">
          <div className="rounded-xl3 border border-primary/15 bg-primary/[0.03] p-6 dark:border-primary/20 dark:bg-primary/[0.06] sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="hijama-womens-heading" className="font-display text-xl font-semibold sm:text-2xl">
                {t("womens.title")}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary-800 dark:text-primary-300">
                <Clock size={12} aria-hidden="true" /> {t("womens.comingSoon")}
              </span>
            </div>
            <p dir="auto" className="mt-3 max-w-2xl leading-relaxed text-ink/75 dark:text-sand/75">
              {t("womens.body")}
            </p>
          </div>
        </section>
      </Reveal>
    </>
  );
}
