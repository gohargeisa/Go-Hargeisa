import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ImageOff } from "lucide-react";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";

/**
 * "Go Hargeisa × {Partner}" brand-partnership lockup — the reusable half of
 * the Partner Branding System's footer requirement. Renders ONLY when
 * called with a non-null `theme` (every call site gates on
 * `getPartnerTheme()` returning non-null, the same opt-in check
 * PartnerThemeScope uses) — there is no code path that shows a partner logo
 * here for a listing that doesn't have Partner Branding enabled. This is a
 * page-local component, never the site's own footer
 * (components/layout/site-footer.tsx, rendered once from the root layout
 * for every page) — general pages keep showing Go Hargeisa alone because
 * this component is never mounted there at all, not because of an
 * if/else inside the shared footer.
 *
 * Both logos are used exactly as supplied — this component never redraws,
 * recolors, resizes-to-distort, or generates either mark. When a partner's
 * `partnerLogo` is empty (no official file supplied yet, e.g. Flormar),
 * shows an explicitly-labeled "official logo pending" placeholder instead
 * of guessing or generating one.
 */
export async function PartnerPartnershipFooter({ theme, locale }: { theme: PartnerTheme; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "partnerFooter" });

  return (
    <section
      aria-label={t("lockupLabel", { partner: theme.partnerName })}
      className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-ink sm:py-20"
    >
      <div className="container-px mx-auto max-w-xl text-center">
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
          style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.12)`, color: theme.accentStrong }}
        >
          {t("heading")}
        </span>

        <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-8">
          <div className="relative h-14 w-40 shrink-0 sm:h-16 sm:w-44">
            <Image src="/images/logo.png" alt="Go Hargeisa" fill sizes="176px" className="object-contain" />
          </div>

          <span
            aria-hidden="true"
            className="h-8 w-px shrink-0 bg-ink/15 dark:bg-white/15 sm:h-12"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.4)` }}
          />

          {theme.partnerLogo ? (
            <div className="relative h-14 w-40 shrink-0 sm:h-16 sm:w-44">
              <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="176px" className="object-contain" />
            </div>
          ) : (
            <div className="flex h-14 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink/20 text-ink/40 dark:border-white/20 dark:text-sand/40 sm:h-16 sm:w-44">
              <ImageOff size={18} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-wide">{t("logoPending")}</span>
            </div>
          )}
        </div>

        <p className="mt-6 text-sm font-semibold text-ink/60 dark:text-sand/60">{theme.partnerName}</p>
      </div>
    </section>
  );
}
