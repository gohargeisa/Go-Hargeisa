"use client";

import { useTranslations } from "next-intl";
import { BedDouble, Building2, MessageSquare, Bell, ArrowRight, type LucideIcon } from "lucide-react";

export interface OverviewStat {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
  onClick: () => void;
}

/**
 * The Dashboard's landing tab — a quick-glance summary + shortcuts into
 * every other section, instead of always defaulting straight to Favorites.
 */
export function OverviewPanel({
  userName,
  stats,
  onNavigate,
}: {
  userName: string;
  stats: OverviewStat[];
  onNavigate: (tab: string) => void;
}) {
  const t = useTranslations("dashboard");

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("overviewEyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t("overviewWelcome", { name: userName })}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, label, value, icon: Icon, tone, onClick }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className="group rounded-xl2 border border-ink/8 bg-white p-4 text-start shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon size={17} />
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">{value}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-ink/55 dark:text-sand/60">
              {label}
              <ArrowRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </p>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <QuickLink icon={Building2} label={t("navMyBusinesses")} onClick={() => onNavigate("myBusinesses")} />
        <QuickLink icon={MessageSquare} label={t("navMessages")} onClick={() => onNavigate("messages")} />
        <QuickLink icon={Bell} label={t("navNotifications")} onClick={() => onNavigate("notifications")} />
        <QuickLink icon={BedDouble} label={t("navBookings")} onClick={() => onNavigate("bookings")} />
      </div>
    </div>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 text-start text-sm font-semibold transition-colors hover:border-primary/40 hover:bg-primary/5 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={15} />
      </span>
      {label}
      <ArrowRight size={13} className="ms-auto opacity-60" aria-hidden="true" />
    </button>
  );
}
