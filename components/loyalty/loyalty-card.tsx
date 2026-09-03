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
 *
 * `variant`:
 *  - "solid" (default) — the partner's deepest brand shade with white text.
 *  - "light" — a premium warm-white card: brand-colour headings / points /
 *    labels, refined dark-neutral functional text, hairline brand dividers,
 *    brand-tinted MEMBER / ACTIVE pills, a soft brand-toned shadow, and a
 *    black-on-white QR. Same structure, hierarchy, element order and
 *    proportions — surface treatment only. Opted in per partner
 *    (PartnerTheme.lightRewardsCard); Flormar uses it.
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
  variant = "solid",
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
  variant?: "solid" | "light";
}) {
  const t = useTranslations("loyalty");
  const isLarge = size === "large";
  const light = variant === "light";

  return (
    <div
      className={
        light
          ? "relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[#FFFCFD] text-ink shadow-[0_14px_44px_-16px_rgba(199,0,92,0.18)]"
          : "relative overflow-hidden rounded-3xl bg-primary-800 text-white shadow-[0_24px_60px_-15px_rgba(0,0,0,0.45)]"
      }
      style={{
        padding: light
          ? isLarge
            ? "1.9rem"
            : "1.6rem"
          : isLarge
            ? "1.75rem"
            : "1.5rem",
      }}
    >
      {/* soft brand glow — a whisper of warmth on the light card */}
      <div
        aria-hidden
        className={
          light
            ? "pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-primary/5 blur-3xl"
            : "pointer-events-none absolute -end-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl"
        }
      />
      {!light && (
        <div
          aria-hidden
          className="pointer-events-none absolute -start-20 bottom-[-30%] h-56 w-56 rounded-full"
          style={{ background: accentColor ? `${accentColor}33` : "rgba(255,255,255,0.08)" }}
        />
      )}

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-bold uppercase ${
              light ? "tracking-[0.26em] text-primary-700" : "tracking-[0.22em] text-white/70"
            }`}
          >
            {programName}
          </p>
          <p
            className={`truncate font-display text-lg font-semibold ${
              light ? "mt-1.5 tracking-tight text-primary-700" : "mt-1"
            }`}
          >
            {partnerName}
          </p>
        </div>
        {partnerLogo && (
          <span
            className={`relative shrink-0 ${
              light ? "h-9 w-[4.5rem] sm:h-10 sm:w-20" : "h-10 w-20"
            }`}
          >
            <Image src={partnerLogo} alt={partnerName} fill sizes="80px" className="object-contain object-right" />
          </span>
        )}
      </div>

      <div
        className={`relative flex items-end justify-between gap-4 ${
          light ? (isLarge ? "mt-9" : "mt-7") : isLarge ? "mt-8" : "mt-6"
        }`}
      >
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${
              light ? "text-primary/50" : "text-white/60"
            }`}
          >
            {t("pointsLabel")}
          </p>
          <p
            className={`font-display font-bold leading-none tabular-nums ${
              light
                ? "mt-1 text-[2.5rem] tracking-tight text-primary-700 sm:text-5xl"
                : "mt-0.5 text-3xl sm:text-4xl"
            }`}
          >
            {points.toLocaleString(locale)}
          </p>
        </div>
        {tierLabel && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              light ? "border border-primary/25 bg-primary/5 text-primary-700" : ""
            }`}
            style={
              light
                ? { color: tierColor ?? undefined }
                : {
                    backgroundColor: tierColor ? `${tierColor}22` : "rgba(255,255,255,0.12)",
                    color: tierColor ?? "#fff",
                    boxShadow: tierColor ? `inset 0 0 0 1px ${tierColor}55` : "inset 0 0 0 1px rgba(255,255,255,0.25)",
                  }
            }
          >
            {tierLabel}
          </span>
        )}
      </div>

      <div
        className={`relative flex items-center justify-between gap-4 border-t pt-4 text-xs ${
          light ? "mt-6 border-primary/15" : "mt-5 border-white/15"
        }`}
      >
        <div className="min-w-0">
          <p className={`truncate font-semibold ${light ? "text-ink" : ""}`}>{holderName}</p>
          <p
            className={`mt-0.5 font-mono text-[11px] tracking-wide ${
              light ? "text-ink/50" : "text-white/60"
            }`}
          >
            {membershipNumber}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            light ? "inline-flex items-center gap-1.5" : ""
          } ${
            light
              ? status === "active"
                ? "border border-primary/25 bg-primary/8 text-primary-700"
                : "bg-ink/8 text-ink/50"
              : status === "active"
                ? "bg-emerald-400/20 text-emerald-100"
                : "bg-white/15 text-white/70"
          }`}
        >
          {light && (
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-primary-700" : "bg-ink/40"}`}
            />
          )}
          {t(`status_${status}`)}
        </span>
      </div>

      {qrSlot && <div className={`relative ${light ? "mt-6" : "mt-5"}`}>{qrSlot}</div>}
    </div>
  );
}
