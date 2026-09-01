import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyTier } from "@/lib/loyalty/types";
import { tierName, benefitText } from "@/lib/loyalty/helpers";

export function TierProgress({
  locale,
  currentTier,
  nextTier,
  lifetimePoints,
  accentColor,
}: {
  locale: Locale;
  currentTier: LoyaltyTier | null;
  nextTier: LoyaltyTier | null;
  lifetimePoints: number;
  accentColor: string | null;
}) {
  const t = useTranslations("loyalty");

  const pointsToNext = nextTier ? Math.max(0, nextTier.minPoints - lifetimePoints) : 0;
  const floor = currentTier?.minPoints ?? 0;
  const span = nextTier ? Math.max(1, nextTier.minPoints - floor) : 1;
  const pct = nextTier ? Math.min(100, Math.max(0, ((lifetimePoints - floor) / span) * 100)) : 100;
  const barColor = currentTier?.color ?? accentColor ?? undefined;

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
            {t("membershipLabel")}
          </p>
          <p className="mt-0.5 font-display text-lg font-semibold" style={{ color: currentTier?.color ?? undefined }}>
            {currentTier ? tierName(currentTier, locale) : t("noTierYet")}
          </p>
        </div>
        {nextTier && (
          <div className="text-end">
            <p className="text-[11px] font-semibold text-ink/45 dark:text-sand/45">{t("nextTier")}</p>
            <p className="mt-0.5 inline-flex items-center gap-0.5 text-sm font-semibold">
              {tierName(nextTier, locale)}
              <ChevronRight size={14} aria-hidden="true" className="rtl:rotate-180" />
            </p>
          </div>
        )}
      </div>

      {nextTier ? (
        <>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700 ease-premium"
              style={{ width: `${pct}%`, backgroundColor: barColor ?? "currentColor" }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-ink/55 dark:text-sand/55">
            {t("pointsToTier", {
              points: pointsToNext.toLocaleString(),
              tier: tierName(nextTier, locale),
            })}
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs font-medium text-ink/55 dark:text-sand/55">{t("topTierReached")}</p>
      )}

      {currentTier && currentTier.benefits.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-ink/8 pt-4 dark:border-white/10">
          {currentTier.benefits.slice(0, 4).map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink/70 dark:text-sand/70">
              <span
                aria-hidden
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: currentTier.color ?? accentColor ?? "currentColor" }}
              />
              {benefitText(b, locale)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
