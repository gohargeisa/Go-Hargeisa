import type { ReactNode } from "react";

/**
 * Reusable "learn about this" section for any partner/listing page that
 * benefits from explaining a topic visually — built first for Al-Hikma's
 * Hijama education (what it is, wet vs dry cupping, preparation, aftercare,
 * hygiene, cupping points), but partner-agnostic: every string and every
 * illustration is a prop the caller resolves (via its own
 * `getTranslations()` + its own SVG/Image), so this component adds no
 * localization surface of its own and can never render a raw i18n key.
 *
 * Deliberately NOT an <img> wall: `illustration` is a ReactNode so callers
 * pass an inline, translatable SVG (labels are real <text>, swappable per
 * locale) rather than a rasterised graphic with baked-in English — see the
 * "text inside images" rule. `alt`-style meaning lives in the surrounding
 * heading + body, and decorative SVGs are marked aria-hidden by the caller.
 *
 * Colours resolve through the surrounding `PartnerThemeScope` via the
 * ordinary `text-primary` / `bg-primary/…` utilities, so a themed page
 * (Al-Hikma green, Flormar pink) tints this for free and an un-themed page
 * gets the Go Hargeisa default. RTL-safe: logical spacing only, `dir="auto"`
 * on user-facing text, the media/text split is a plain responsive flex that
 * mirrors correctly.
 */
export interface EducationalCard {
  /** Stable, unique within the section — used for the key and heading id. */
  id: string;
  title: string;
  /** One or more paragraphs. */
  body: string | string[];
  /** Inline SVG / <Image> / icon lockup. Omit for a text-only card. */
  illustration?: ReactNode;
  /** Small caption under the illustration (e.g. a diagram label). */
  illustrationCaption?: string;
  /** Optional short caution line, rendered visually distinct (used for the
   * "consult a doctor if…" / "this is wellness support, not a cure" notes). */
  note?: string;
}

export function EducationalCardsSection({
  id,
  eyebrow,
  title,
  intro,
  cards,
  variant = "default",
  footnote,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  cards: EducationalCard[];
  /** "sunnah" renders each card as a quotation block, kept visually and
   * semantically separate from any health/wellness claim. */
  variant?: "default" | "sunnah";
  /** Section-level disclaimer / source line under the whole block. */
  footnote?: string;
}) {
  if (cards.length === 0) return null;

  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-36">
      {eyebrow && (
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</span>
      )}
      <h2 id={`${id}-heading`} className="mb-4 font-display text-2xl font-semibold sm:text-3xl">
        {title}
      </h2>
      {intro && <p dir="auto" className="mb-8 max-w-2xl text-lg leading-relaxed text-ink/75 dark:text-sand/75">{intro}</p>}

      <div className={variant === "sunnah" ? "grid gap-5 sm:grid-cols-2" : "space-y-6"}>
        {cards.map((card) => {
          const paragraphs = Array.isArray(card.body) ? card.body : [card.body];
          if (variant === "sunnah") {
            return (
              <figure
                key={card.id}
                className="flex flex-col gap-3 rounded-xl3 border border-primary/15 bg-primary/[0.03] p-6 dark:border-primary/20 dark:bg-primary/[0.06]"
              >
                <blockquote dir="auto" className="space-y-2 text-ink/80 dark:text-sand/80">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="leading-relaxed">
                      {p}
                    </p>
                  ))}
                </blockquote>
                <figcaption className="text-sm font-semibold text-primary">{card.title}</figcaption>
              </figure>
            );
          }
          return (
            <article
              key={card.id}
              aria-labelledby={`${id}-${card.id}-heading`}
              className="flex flex-col gap-5 rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-start sm:gap-7 sm:p-7"
            >
              {card.illustration && (
                <div className="flex shrink-0 flex-col items-center gap-2 sm:w-44">
                  <div className="flex w-full items-center justify-center rounded-xl2 bg-primary/[0.06] p-4 dark:bg-primary/10">
                    {card.illustration}
                  </div>
                  {card.illustrationCaption && (
                    <span className="text-center text-[11px] font-medium text-ink/45 dark:text-sand/45">
                      {card.illustrationCaption}
                    </span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 id={`${id}-${card.id}-heading`} className="mb-2 font-display text-lg font-semibold">
                  {card.title}
                </h3>
                <div dir="auto" className="space-y-2 leading-relaxed text-ink/75 dark:text-sand/75">
                  {paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                {card.note && (
                  <p
                    dir="auto"
                    className="mt-3 rounded-lg border-s-2 border-primary/40 bg-primary/[0.04] px-3 py-2 text-sm text-ink/70 dark:bg-primary/10 dark:text-sand/70"
                  >
                    {card.note}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {footnote && (
        <p dir="auto" className="mt-6 text-xs leading-relaxed text-ink/45 dark:text-sand/45">
          {footnote}
        </p>
      )}
    </section>
  );
}
