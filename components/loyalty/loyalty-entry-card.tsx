import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronRight, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

/**
 * Reusable entry point into a partner's Rewards experience. Rendered on the
 * partner storefront (promo mode) and the customer dashboard (member mode).
 * Purely a styled link — safe in a server component. Only shown by callers
 * that have already confirmed the partner's loyalty program is enabled.
 */
export function LoyaltyEntryCard({
  locale,
  href,
  partnerName,
  programName,
  mode,
  partnerLogo,
  points,
  tierLabel,
  accentColor,
}: {
  locale: Locale;
  href: string;
  partnerName: string;
  programName: string;
  mode: "promo" | "member";
  partnerLogo?: string | null;
  points?: number;
  tierLabel?: string | null;
  accentColor?: string | null;
}) {
  const t = useTranslations("loyalty");

  return (
    <Link
      href={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-primary-800 p-4 text-white shadow-card transition-transform duration-300 ease-premium hover:-translate-y-0.5 sm:p-5"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-10 -top-14 h-40 w-40 rounded-full blur-3xl"
        style={{ background: accentColor ? `${accentColor}40` : "rgba(255,255,255,0.12)" }}
      />
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/12">
        {partnerLogo ? (
          <Image src={partnerLogo} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
        ) : (
          <Sparkles size={18} aria-hidden="true" />
        )}
      </span>

      <span className="relative min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">{programName}</span>
        {mode === "member" ? (
          <span className="mt-0.5 flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tabular-nums">
              {t("pointsAmount", { points: (points ?? 0).toLocaleString(locale) })}
            </span>
            {tierLabel && <span className="text-xs font-semibold text-white/70">· {tierLabel}</span>}
          </span>
        ) : (
          <span className="mt-0.5 block truncate text-sm font-medium text-white/80">
            {t("promoSubtitle", { partner: partnerName })}
          </span>
        )}
      </span>

      <span className="relative shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold transition-colors group-hover:bg-white/25">
        <span className="flex items-center gap-1">
          {mode === "member" ? t("openCard") : t("joinCta")}
          <ChevronRight size={13} aria-hidden="true" className="rtl:rotate-180" />
        </span>
      </span>
    </Link>
  );
}
