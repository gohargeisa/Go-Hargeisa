import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getReviewsForListing } from "@/lib/data/business";
import { ReviewCard } from "@/components/business/review-card";

export const metadata: Metadata = { title: "Reviews — Dashboard", robots: { index: false } };

export default async function ReviewsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/reviews`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const reviews = await getReviewsForListing(listing.listingType, listing.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("navReviews")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {t("kpiReviewCountSubtitle", { count: listing.reviewCount })}
            {listing.reviewCount > 0 && <> · {listing.rating.toFixed(1)} ★</>}
          </p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
          <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noReviewsYet")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} listingType={listing.listingType} listingId={listing.id} revalidatePath={currentPath} />
          ))}
        </div>
      )}
    </div>
  );
}
