"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, ExternalLink, Loader2, Power, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { AccessPickerProfile } from "@/lib/data/access-control";
import type { LoyaltyAdminProgram } from "@/lib/data/loyalty-admin";
import {
  addLoyaltyStaffAction,
  removeLoyaltyStaffAction,
  setLoyaltyStaffActiveAction,
  setLoyaltyProgramEnabledAction,
} from "@/lib/actions/loyalty-admin";

export function LoyaltyAdminManager({
  locale,
  programs,
  allProfiles,
}: {
  locale: Locale;
  programs: LoyaltyAdminProgram[];
  allProfiles: AccessPickerProfile[];
}) {
  const t = useTranslations("loyalty");

  if (programs.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-10 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
        {t("adminNoPrograms")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {programs.map((p) => (
        <ProgramCard key={p.program.id} locale={locale} data={p} allProfiles={allProfiles} />
      ))}
    </div>
  );
}

function ProgramCard({
  locale,
  data,
  allProfiles,
}: {
  locale: Locale;
  data: LoyaltyAdminProgram;
  allProfiles: AccessPickerProfile[];
}) {
  const t = useTranslations("loyalty");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const { program, listing, metrics, staff } = data;

  const [newUser, setNewUser] = useState("");
  const [newRole, setNewRole] = useState<"staff" | "manager">("staff");
  const staffUserIds = new Set(staff.map((s) => s.userId));
  const candidates = allProfiles.filter((pr) => !staffUserIds.has(pr.id));

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      setMsg(res.ok ? ok : res.error ?? t("errGeneric"));
    });
  }

  const stats: { label: string; value: number }[] = metrics
    ? [
        { label: t("statTotalMembers"), value: metrics.total_members },
        { label: t("statActiveMembers"), value: metrics.active_members },
        { label: t("statPointsIssued"), value: metrics.points_issued },
        { label: t("statPointsRedeemed"), value: metrics.points_redeemed },
        { label: t("statRewardsRedeemed"), value: metrics.rewards_redeemed },
        { label: t("statPurchases"), value: metrics.purchases_recorded },
      ]
    : [];

  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold">{program.name}</h2>
          <p className="mt-0.5 text-sm text-ink/55 dark:text-sand/55">
            {listing?.name ?? program.listingId} · {program.pointsPerCurrency} {t("pointsPerCurrency", { currency: program.currency })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              program.enabled
                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                : "bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-sand/50"
            }`}
          >
            {program.enabled ? t("statusEnabled") : t("statusDisabled")}
          </span>
          <button
            type="button"
            onClick={() =>
              act(
                () => setLoyaltyProgramEnabledAction(program.id, !program.enabled, locale),
                program.enabled ? t("programDisabled") : t("programEnabled")
              )
            }
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/20 dark:text-white"
          >
            <Power size={13} aria-hidden="true" />
            {program.enabled ? t("disable") : t("enable")}
          </button>
        </div>
      </div>

      {listing && (
        <Link
          href={`/${locale}/rewards/${listing.slug}`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline dark:text-primary-300"
        >
          {t("viewCustomerExperience")}
          <ExternalLink size={12} aria-hidden="true" />
        </Link>
      )}

      {stats.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-ink/[0.03] p-3 dark:bg-white/[0.04]">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{s.label}</dt>
              <dd className="mt-0.5 font-display text-xl font-bold tabular-nums">{s.value.toLocaleString(locale)}</dd>
            </div>
          ))}
        </dl>
      )}

      {metrics && metrics.top_members.length > 0 && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("mostActiveMembers")}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {metrics.top_members.map((mem) => (
                <li key={mem.membership_number} className="flex justify-between gap-3">
                  <span className="truncate">{mem.name ?? mem.membership_number}</span>
                  <span className="shrink-0 tabular-nums text-ink/55 dark:text-sand/55">
                    {mem.lifetime_points.toLocaleString(locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          {metrics.top_rewards.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("mostRedeemedRewards")}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {metrics.top_rewards.map((r, i) => (
                  <li key={i} className="flex justify-between gap-3">
                    <span className="truncate">{r.name ?? t("reward")}</span>
                    <span className="shrink-0 tabular-nums text-ink/55 dark:text-sand/55">{r.redemptions}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Staff management */}
      <div className="mt-6 border-t border-ink/8 pt-6 dark:border-white/10">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <ShieldCheck size={16} aria-hidden="true" className="text-primary" />
          {t("staffSectionTitle")}
        </h3>
        <p className="mt-1 text-xs text-ink/50 dark:text-sand/50">{t("staffSectionHint")}</p>

        {staff.length > 0 && (
          <ul className="mt-3 divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/8 dark:divide-white/10 dark:border-white/10">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3 bg-white px-3.5 py-2.5 dark:bg-white/[0.02]">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{s.name}</p>
                  <p className="text-xs text-ink/45 dark:text-sand/45">
                    {t(s.role === "manager" ? "roleManager" : "roleStaff")}
                    {!s.active && ` · ${t("inactive")}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => act(() => setLoyaltyStaffActiveAction(s.id, !s.active, locale), t("staffUpdated"))}
                  disabled={pending}
                  className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold text-ink/60 transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/20 dark:text-sand/60"
                >
                  {s.active ? t("deactivate") : t("activate")}
                </button>
                <button
                  type="button"
                  onClick={() => act(() => removeLoyaltyStaffAction(s.id, locale), t("staffRemoved"))}
                  disabled={pending}
                  aria-label={t("remove")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-60"
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-3 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newUser) return;
            act(() => addLoyaltyStaffAction(program.id, newUser, newRole, locale), t("staffAdded"));
            setNewUser("");
          }}
        >
          <select
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            aria-label={t("selectPerson")}
            className="min-w-[12rem] flex-1 rounded-xl border border-ink/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/20"
          >
            <option value="">{t("selectPerson")}</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as "staff" | "manager")}
            aria-label={t("selectRole")}
            className="rounded-xl border border-ink/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/20"
          >
            <option value="staff">{t("roleStaff")}</option>
            <option value="manager">{t("roleManager")}</option>
          </select>
          <button
            type="submit"
            disabled={pending || !newUser}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
          >
            {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <UserPlus size={14} aria-hidden="true" />}
            {t("addStaff")}
          </button>
        </form>
      </div>

      {msg && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5 text-xs font-medium text-ink/70 dark:bg-white/[0.05] dark:text-sand/70">
          <CheckCircle2 size={13} aria-hidden="true" className="text-emerald-600" />
          {msg}
        </p>
      )}
    </div>
  );
}
