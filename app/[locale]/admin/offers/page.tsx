import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllOffersForModeration } from "@/lib/data/offers";
import { OffersModerationList } from "@/components/admin/offers-moderation-list";

export const metadata: Metadata = { title: "Offers — Admin", robots: { index: false, follow: false } };

export default async function AdminOffersPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/offers`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const offers = await getAllOffersForModeration();
  const pendingCount = offers.filter((o) => o.approvalStatus === "pending").length;

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("offersModerationTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("offersModerationSubtitle", { count: pendingCount })}
        </p>
      </div>

      <div className="mt-8">
        <OffersModerationList locale={locale} offers={offers} />
      </div>
    </section>
  );
}
