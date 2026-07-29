import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { PartnerHealthRow } from "@/lib/data/owner-dashboard";

const ISSUE_LABEL: Record<string, string> = {
  missingDescription: "No description",
  missingPhotos: "No gallery photos",
  missingPhone: "No phone number",
  noReviewsYet: "No reviews yet",
};

export function PartnerHealthMonitor({ locale, rows }: { locale: Locale; rows: PartnerHealthRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5 dark:bg-accent/10 sm:p-6">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="shrink-0 text-accent-600" aria-hidden="true" />
          <div>
            <h3 className="font-display text-base font-bold">Business Health Monitor</h3>
            <p className="mt-0.5 text-sm text-ink/60 dark:text-sand/60">Every partner profile is complete — nothing needs attention.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="text-amber-500" aria-hidden="true" />
        <h3 className="font-display text-base font-bold">Business Health Monitor</h3>
      </div>
      <p className="mt-1 text-sm text-ink/50 dark:text-sand/50">Partners with incomplete profiles, ranked worst-first.</p>

      <ul className="mt-4 flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/${locale}/admin/${row.table}/${row.id}/edit`}
              className="flex items-center gap-3 rounded-xl border border-ink/8 p-3 transition-colors hover:border-primary/30 dark:border-white/10"
            >
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                <Image src={row.coverImage} alt={row.name} fill sizes="44px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{row.name}</p>
                <p className="truncate text-xs text-ink/45 dark:text-sand/45">
                  {row.healthIssues.map((i) => ISSUE_LABEL[i]).join(" · ")}
                </p>
              </div>
              <div className="shrink-0 text-end">
                <p className="font-display text-lg font-bold text-amber-600">{row.healthScore}%</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
