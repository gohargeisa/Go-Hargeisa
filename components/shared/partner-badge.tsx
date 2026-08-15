import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

/**
 * A real, reusable "Go Hargeisa Partner" indicator — shown on any listing
 * that's actually live on the platform (`status === 'published'`), not
 * hardcoded to any specific business. Every published listing is a real
 * Go Hargeisa partner in the same sense; this isn't gated on a paid
 * subscription tier (that's a separate, admin-only concept — see
 * lib/actions/partners.ts) or on claimed ownership, since an unclaimed but
 * genuinely live, verified listing is still a real platform partner.
 */
export async function PartnerBadge({ locale, className }: { locale: Locale; className?: string }) {
  const t = await getTranslations({ locale, namespace: "partnerAcquisition" });
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary-600 to-primary-800 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm ${className ?? ""}`}
    >
      <ShieldCheck size={12} aria-hidden="true" />
      {t("badgeLabel")}
    </span>
  );
}
