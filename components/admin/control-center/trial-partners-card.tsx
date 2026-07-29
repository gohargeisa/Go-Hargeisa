import Link from "next/link";
import Image from "next/image";
import { Handshake, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { PartnerHealthRow } from "@/lib/data/owner-dashboard";

export function TrialPartnersCard({ locale, trialPartners }: { locale: Locale; trialPartners: PartnerHealthRow[] }) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Handshake size={17} className="text-primary" aria-hidden="true" />
          <h3 className="font-display text-base font-bold">Trial Partners</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{trialPartners.length}</span>
      </div>

      {trialPartners.length === 0 ? (
        <p className="mt-4 text-sm text-ink/45 dark:text-sand/45">No trial partners waiting on activation.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2.5">
          {trialPartners.slice(0, 4).map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                <Image src={p.coverImage} alt={p.name} fill sizes="36px" className="object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</p>
            </li>
          ))}
        </ul>
      )}

      <Link
        href={`/${locale}/admin/partners`}
        className="mt-5 flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
      >
        Review Partners <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </div>
  );
}
