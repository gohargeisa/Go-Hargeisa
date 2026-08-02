import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getReportedReviewsForModeration } from "@/lib/data/reviews";
import { ReviewsModerationList } from "@/components/admin/reviews-moderation-list";

export const metadata: Metadata = { title: "Reviews — Admin", robots: { index: false, follow: false } };

export default async function AdminReviewsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/reviews`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const reviews = await getReportedReviewsForModeration();

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("reviewsModerationTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("reviewsModerationSubtitle", { count: reviews.length })}
        </p>
      </div>

      <div className="mt-8">
        <ReviewsModerationList locale={locale} reviews={reviews} />
      </div>
    </section>
  );
}
