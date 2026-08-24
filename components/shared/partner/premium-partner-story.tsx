import type { ElementType } from "react";

/**
 * Reusable "brand story" section for any Premium Partner page — an
 * editorial presentation of a partner's own real description text (never
 * invented copy) plus an optional highlight-icon row built from real,
 * already-fetched listing data (wifi, delivery, reservations, etc — never
 * fabricated claims). First built for Lavender Flowers' inline "Overview"
 * section, extracted here so any current or future Premium Partner page
 * (see lib/config/partner-themes.ts) can reuse the exact same premium
 * typography/spacing instead of a plain generic-listing paragraph.
 *
 * Colors resolve through the surrounding `PartnerThemeScope`'s CSS variable
 * overrides (see app/globals.css) via the ordinary `text-primary` /
 * `bg-primary/…` utility classes already used everywhere else on themed
 * pages — this component never reads `PartnerTheme` directly, so it works
 * unchanged whether or not a page ends up wrapping it in a theme scope.
 *
 * Purely presentational: every string is a prop resolved by the caller's
 * own `getTranslations()` call, so this component adds no localization
 * surface of its own and can't render a raw i18n key.
 */
export function PremiumPartnerStory({
  id = "overview",
  eyebrow,
  title,
  description,
  highlightsLabel,
  highlights,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  highlightsLabel?: string;
  highlights?: { icon: ElementType; label: string }[];
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-36">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</span>
      <h2 id={`${id}-heading`} className="mb-5 font-display text-2xl font-semibold sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-lg leading-relaxed text-ink/75 dark:text-sand/75">{description}</p>

      {highlights && highlights.length > 0 && (
        <div className="mt-8">
          {highlightsLabel && (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-ink/40 dark:text-sand/40">{highlightsLabel}</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="group flex flex-col items-center gap-3 rounded-xl2 border border-ink/8 bg-white p-5 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform duration-300 ease-premium group-hover:scale-110">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <span className="text-xs font-semibold leading-tight text-ink/75 dark:text-sand/75">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
