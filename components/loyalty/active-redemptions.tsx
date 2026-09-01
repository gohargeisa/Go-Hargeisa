import { useTranslations } from "next-intl";
import { Ticket } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyRedemption } from "@/lib/loyalty/types";

/** The member's issued-but-not-yet-used redemption codes — shown near the top
 * of the Rewards home so they're easy to pull up at the counter. */
export function ActiveRedemptions({
  locale,
  redemptions,
  partnerName,
}: {
  locale: Locale;
  redemptions: LoyaltyRedemption[];
  partnerName: string;
}) {
  const t = useTranslations("loyalty");
  const issued = redemptions.filter((r) => r.status === "issued");
  if (issued.length === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <section aria-labelledby="loyalty-ready-heading">
      <h2 id="loyalty-ready-heading" className="mb-3 font-display text-lg font-semibold">
        {t("readyToUse")}
      </h2>
      <ul className="space-y-2">
        {issued.map((r) => {
          const name =
            (locale === "ar" && r.rewardSnapshot?.name_ar) ||
            (locale === "so" && r.rewardSnapshot?.name_so) ||
            r.rewardSnapshot?.name ||
            t("reward");
          return (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3.5 dark:border-primary/25"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Ticket size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="font-mono text-xs font-bold tracking-[0.15em] text-primary-700 dark:text-primary-300">
                  {r.redemptionCode}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="text-[11px] font-semibold text-ink/45 dark:text-sand/45">{t("showAtCounter")}</p>
                {r.expiresAt && (
                  <p className="text-[11px] text-ink/40 dark:text-sand/40">
                    {t("expiresOn", { date: dateFmt.format(new Date(r.expiresAt)) })}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-ink/45 dark:text-sand/45">{t("showCodeHint", { partner: partnerName })}</p>
    </section>
  );
}
