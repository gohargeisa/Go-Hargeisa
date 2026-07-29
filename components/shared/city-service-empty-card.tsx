import { ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";

/** Filler for an empty City Services slot. Deliberately never shows a
 * specific business name or contact info — per the Phase 2 product
 * decision, this directory ships with zero seeded/fabricated entries, so
 * an empty slot is always this generic placeholder, never a fake listing. */
export function CityServiceEmptyCard() {
  const t = useTranslations("cityServices");

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-ink/[0.02] p-5 text-center dark:border-white/15 dark:bg-white/[0.02]">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/5 text-ink/30 dark:bg-white/10 dark:text-sand/30">
        <ImageOff size={18} aria-hidden="true" />
      </div>
      <p className="mt-3 font-display text-sm font-bold text-ink/50 dark:text-sand/50">{t("comingSoonTitle")}</p>
      <p className="mt-1.5 text-xs leading-5 text-ink/40 dark:text-sand/40">{t("comingSoonDescription")}</p>
    </div>
  );
}
