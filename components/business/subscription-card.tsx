import { getTranslations } from "next-intl/server";
import { CreditCard } from "lucide-react";
import { ContactSupportButton } from "./contact-support-button";
import { SUBSCRIPTION_PLANS } from "@/lib/config/subscription-plans";
import type { BusinessSubscription } from "@/types";

export async function SubscriptionCard({
  subscription,
  ownerName,
  ownerEmail,
}: {
  subscription: BusinessSubscription;
  ownerName: string;
  ownerEmail: string;
}) {
  const t = await getTranslations("businessDashboard");
  const plan = SUBSCRIPTION_PLANS[subscription.planTier];
  const planNameKey = { basic: "planBasic", gold: "planGold", platinum: "planPlatinum" } as const;

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2">
        <CreditCard size={17} className="text-primary" aria-hidden="true" />
        <h3 className="font-display text-base font-bold">{t("subscriptionTitle")}</h3>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl2 bg-primary/5 p-4 dark:bg-primary/10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
            {t("currentPlan")}
          </p>
          <p className="mt-1 font-display text-xl font-bold">
            {t(planNameKey[subscription.planTier])}
            <span className="ms-1.5 text-sm font-medium text-ink/50 dark:text-sand/50">
              ${plan.priceUsd}
              {t("planPriceSuffix")}
            </span>
          </p>
        </div>
        {subscription.planTier !== "basic" && (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">★</span>
        )}
      </div>

      <p className="mt-3 text-sm text-ink/55 dark:text-sand/55">
        {subscription.renewsAt
          ? `${t("renewalDate")}: ${new Date(subscription.renewsAt).toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}`
          : t("noRenewalScheduled")}
      </p>

      <ContactSupportButton
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        defaultSubject="Manage Subscription"
        label={t("manageSubscription")}
        className="mt-4 w-full rounded-full border border-ink/15 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
      />
    </div>
  );
}
