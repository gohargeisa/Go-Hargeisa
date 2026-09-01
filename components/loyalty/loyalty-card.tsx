import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyMemberStatus } from "@/lib/loyalty/types";

/**
 * The digital membership card — a presentational block reused by the Rewards
 * home (compact) and the full-screen card page (large). Deliberately
 * partner-agnostic: brand colour comes from the enclosing
 * <PartnerThemeScope> (the `bg-primary*` / `text-primary*` utilities below
 * retint automatically), the logo + name are passed in.
 */
export function LoyaltyCard({
  locale,
  partnerName,
  partnerLogo,
  programName,
  membershipNumber,
  holderName,
  points,
  tierLabel,
  tierColor,
  status,
  accentColor,
  qrSlot,
  size = "compact",
}: {
  locale: Locale;
  partnerName: string;
  partnerLogo: string | null;
  programName: string;
  membershipNumber: string;
  holderName: string;
  points: number;
  tierLabel: string | null;
  tierColor: string | null;
  status: LoyaltyMemberStatus;
  accentColor: string | null;
  /** The QR block — passed in so this stays a server-safe component. */
  qrSlot?: React.ReactNode;
  size?: "compact" | "large";
}) {
  const t = useTranslations("loyalty");
  const isLarge = size === "large";

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-primary-800 text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)]"
      style={{ padding: isLarge ? "1.75rem" : "1.5rem" }}
    >
      {/* soft brand glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -start-20 bottom-[-30%] h-56 w-56 rounded-full"
        style={{ background: accentColor ? `${accentColor}33` : "rgba(255,255,255,0.08)" }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
            {programName}
          </p>
          <p className="mt-1 truncate font-display text-lg font-semibold">{partnerName}</p>
        </div>
        {partnerLogo && (
          <span className="relative h-10 w-20 shrink-0">
            <Image src={partnerLogo} alt={partnerName} fill sizes="80px" className="object-contain object-right" />
          </span>
        )}
      </div>

      <div className={`relative ${isLarge ? "mt-8" : "mt-6"} flex items-end justify-between gap-4`}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">
            {t("pointsLabel")}
          </p>
          <p className="mt-0.5 font-display text-3xl font-bold leading-none tabular-nums sm:text-4xl">
            {points.toLocaleString(locale)}
          </p>
        </div>
        {tierLabel && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
            style={{
              backgroundColor: tierColor ? `${tierColor}22` : "rgba(255,255,255,0.12)",
              color: tierColor ?? "#fff",
              boxShadow: tierColor ? `inset 0 0 0 1px ${tierColor}55` : "inset 0 0 0 1px rgba(255,255,255,0.25)",
            }}
          >
            {tierLabel}
          </span>
        )}
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-4 text-xs">
        <div className="min-w-0">
          <p className="truncate font-semibold">{holderName}</p>
          <p className="mt-0.5 font-mono text-[11px] tracking-wide text-white/60">{membershipNumber}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            status === "active" ? "bg-emerald-400/20 text-emerald-100" : "bg-white/15 text-white/70"
          }`}
        >
          {t(`status_${status}`)}
        </span>
      </div>

      {qrSlot && <div className="relative mt-5">{qrSlot}</div>}
    </div>
  );
}
