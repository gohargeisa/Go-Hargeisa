"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Power } from "lucide-react";
import { createTaxPolicy, deleteTaxPolicy, setTaxPolicyEnabled, type TaxPolicyInput } from "@/lib/actions/tax-admin";
import type { TaxPolicy } from "@/types";

const inputClass =
  "w-full rounded-lg border border-ink/12 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15";

function emptyForm(): TaxPolicyInput {
  return {
    scope: "global",
    rate: 0,
    isExempt: false,
    isInclusive: false,
    isEnabled: true,
    effectiveFrom: new Date().toISOString().slice(0, 10),
  };
}

/**
 * Owner-only tax policy CRUD — app/[locale]/admin/tax-policy/page.tsx.
 * Deliberately a plain list + create form (no edit-in-place table, no
 * bulk actions) — this table holds a handful of rows in practice (one
 * global default, maybe a few category/business overrides), not hundreds,
 * so a full data-grid would be over-building for what's actually needed.
 * Editing an existing policy is delete + recreate (a policy is a point-in-
 * time rule, not a mutable record an admin tweaks repeatedly — see
 * effectiveFrom/effectiveUntil in the migration's own header for why a
 * rate change is meant to be a new row, not an edit).
 */
export function TaxPolicyManager({ initial }: { initial: TaxPolicy[] }) {
  const t = useTranslations("admin");
  const [policies, setPolicies] = useState(initial);
  const [form, setForm] = useState<TaxPolicyInput>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.scope === "category" && !form.category?.trim()) {
      setError(t("taxPolicyCategoryRequired"));
      return;
    }
    if (form.scope === "business" && (!form.listingType || !form.listingId?.trim())) {
      setError(t("taxPolicyBusinessRequired"));
      return;
    }
    if (form.scope === "product" && !form.productId?.trim()) {
      setError(t("taxPolicyProductRequired"));
      return;
    }
    if (!form.isExempt && (form.rate < 0 || form.rate > 100)) {
      setError(t("taxPolicyRateInvalid"));
      return;
    }

    startTransition(async () => {
      const result = await createTaxPolicy({ ...form, rate: form.rate / 100 });
      if (!result.ok) {
        setError(result.error ?? t("taxPolicyGenericError"));
        return;
      }
      setForm(emptyForm());
      window.location.reload();
    });
  }

  function onToggle(id: string, isEnabled: boolean) {
    startTransition(async () => {
      await setTaxPolicyEnabled(id, isEnabled);
      setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, isEnabled } : p)));
    });
  }

  function onDelete(id: string) {
    if (!window.confirm(t("taxPolicyDeleteConfirm"))) return;
    startTransition(async () => {
      await deleteTaxPolicy(id);
      setPolicies((prev) => prev.filter((p) => p.id !== id));
    });
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl2 border border-ink/8 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] text-start text-xs font-semibold uppercase tracking-wide text-ink/50 dark:bg-white/[0.03] dark:text-sand/50">
            <tr>
              <th className="px-4 py-2.5 text-start">{t("taxPolicyScopeLabel")}</th>
              <th className="px-4 py-2.5 text-start">{t("taxPolicyRateLabel")}</th>
              <th className="px-4 py-2.5 text-start">{t("taxPolicyLabelLabel")}</th>
              <th className="px-4 py-2.5 text-start">{t("taxPolicyStatusLabel")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/10">
            {policies.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink/50 dark:text-sand/50">
                  {t("taxPolicyEmptyState")}
                </td>
              </tr>
            ) : (
              policies.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold capitalize">{p.scope}</span>
                    {p.category && <span className="ms-1.5 text-ink/50 dark:text-sand/50">{p.category}</span>}
                    {p.listingType && <span className="ms-1.5 text-ink/50 dark:text-sand/50">{p.listingType}</span>}
                  </td>
                  <td className="px-4 py-2.5">{p.isExempt ? t("taxPolicyExemptBadge") : `${(p.rate * 100).toFixed(2)}%`}</td>
                  <td className="px-4 py-2.5 text-ink/60 dark:text-sand/60">{p.label ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => onToggle(p.id, !p.isEnabled)}
                      disabled={isPending}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                        p.isEnabled ? "bg-primary/10 text-primary-700" : "bg-ink/8 text-ink/50 dark:bg-white/10 dark:text-sand/50"
                      }`}
                    >
                      <Power size={12} aria-hidden="true" />
                      {p.isEnabled ? t("taxPolicyEnabledBadge") : t("taxPolicyDisabledBadge")}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <button type="button" onClick={() => onDelete(p.id)} disabled={isPending} aria-label={t("taxPolicyDeleteAction")} className="text-ink/40 hover:text-red-600 dark:text-sand/40">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <form onSubmit={onCreate} className="space-y-4 rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
        <h2 className="font-display text-lg font-semibold">{t("taxPolicyNewTitle")}</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyScopeLabel")}</label>
            <select value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as TaxPolicyInput["scope"] }))} className={inputClass}>
              <option value="global">{t("taxPolicyScopeGlobal")}</option>
              <option value="category">{t("taxPolicyScopeCategory")}</option>
              <option value="business">{t("taxPolicyScopeBusiness")}</option>
              <option value="product">{t("taxPolicyScopeProduct")}</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyRateLabel")} (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              disabled={form.isExempt}
              value={form.rate}
              onChange={(e) => setForm((f) => ({ ...f, rate: Number(e.target.value) }))}
              className={`${inputClass} disabled:opacity-50`}
            />
          </div>

          {form.scope === "category" && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyCategoryLabel")}</label>
              <input
                placeholder={t("taxPolicyCategoryPlaceholder")}
                value={form.category ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}
              />
            </div>
          )}

          {form.scope === "business" && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyListingTypeLabel")}</label>
                <select value={form.listingType ?? ""} onChange={(e) => setForm((f) => ({ ...f, listingType: e.target.value }))} className={inputClass}>
                  <option value="">—</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="cafe">Cafe</option>
                  <option value="city_service">City Service</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyListingIdLabel")}</label>
                <input
                  placeholder="uuid"
                  value={form.listingId ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, listingId: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {form.scope === "product" && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyProductIdLabel")}</label>
              <input placeholder="uuid" value={form.productId ?? ""} onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))} className={inputClass} />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyLabelLabel")}</label>
            <input
              placeholder={t("taxPolicyLabelPlaceholder")}
              value={form.label ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyEffectiveFromLabel")}</label>
            <input type="date" value={form.effectiveFrom} onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("taxPolicyEffectiveUntilLabel")}</label>
            <input type="date" value={form.effectiveUntil ?? ""} onChange={(e) => setForm((f) => ({ ...f, effectiveUntil: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isExempt} onChange={(e) => setForm((f) => ({ ...f, isExempt: e.target.checked }))} />
            {t("taxPolicyIsExemptLabel")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isInclusive} onChange={(e) => setForm((f) => ({ ...f, isInclusive: e.target.checked }))} />
            {t("taxPolicyIsInclusiveLabel")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isEnabled} onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))} />
            {t("taxPolicyIsEnabledLabel")}
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-70"
        >
          <Plus size={15} aria-hidden="true" />
          {t("taxPolicyCreateAction")}
        </button>
      </form>
    </div>
  );
}
