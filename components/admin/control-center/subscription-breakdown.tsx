import { CreditCard } from "lucide-react";
import { SUBSCRIPTION_PLAN_ORDER, SUBSCRIPTION_PLANS } from "@/lib/config/subscription-plans";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";

const PLAN_COLOR: Record<SubscriptionPlanId, string> = {
  basic: "bg-secondary-400",
  silver: "bg-slate-400",
  gold: "bg-primary",
};

export function SubscriptionBreakdown({ planCounts }: { planCounts: Record<SubscriptionPlanId, number> }) {
  const total = SUBSCRIPTION_PLAN_ORDER.reduce((sum, id) => sum + planCounts[id], 0);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
      <div className="flex items-center gap-2">
        <CreditCard size={17} className="text-primary" aria-hidden="true" />
        <h3 className="font-display text-base font-bold">Subscriptions</h3>
      </div>

      {total === 0 ? (
        <p className="mt-4 text-sm text-ink/45 dark:text-sand/45">No subscriptions assigned yet.</p>
      ) : (
        <>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
            {SUBSCRIPTION_PLAN_ORDER.map((id) => {
              const pct = (planCounts[id] / total) * 100;
              if (pct === 0) return null;
              return <div key={id} className={PLAN_COLOR[id]} style={{ width: `${pct}%` }} />;
            })}
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {SUBSCRIPTION_PLAN_ORDER.map((id) => (
              <li key={id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${PLAN_COLOR[id]}`} aria-hidden="true" />
                  {SUBSCRIPTION_PLANS[id].name}
                  <span className="text-ink/40 dark:text-sand/40">${SUBSCRIPTION_PLANS[id].priceUsd}/mo</span>
                </span>
                <span className="font-display font-bold">{planCounts[id]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
