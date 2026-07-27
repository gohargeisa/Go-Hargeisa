import { getTranslations } from "next-intl/server";
import { CheckCircle2, Sparkles } from "lucide-react";

/** Suggestions derived from real profile-completeness signals — not static copy. */
export async function PerformanceTips({
  hasLogo,
  hasGalleryPhotos,
  hasPhone,
  hasDescription,
  hasWebsite,
  unrepliedReviewsCount,
}: {
  hasLogo: boolean;
  hasGalleryPhotos: boolean;
  hasPhone: boolean;
  hasDescription: boolean;
  hasWebsite: boolean;
  unrepliedReviewsCount: number;
}) {
  const t = await getTranslations("businessDashboard");

  const tips: string[] = [];
  if (!hasGalleryPhotos) tips.push(t("tipUploadPhotos"));
  if (!hasLogo || !hasDescription) tips.push(t("tipCompleteProfile"));
  if (unrepliedReviewsCount > 0) tips.push(t("tipReplyToReviews", { count: unrepliedReviewsCount }));
  if (!hasWebsite) tips.push(t("tipEnableOnlineBooking"));
  if (!hasPhone) tips.push(t("tipUpdatePhoneNumber"));

  if (tips.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 p-5 dark:bg-accent/10">
        <CheckCircle2 size={22} className="shrink-0 text-accent-600" aria-hidden="true" />
        <p className="text-sm font-medium text-ink/70 dark:text-sand/70">{t("allCaughtUp")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={17} className="text-primary" aria-hidden="true" />
        <h3 className="font-display text-base font-bold">{t("performanceTipsTitle")}</h3>
      </div>
      <ul className="space-y-2.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink/70 dark:text-sand/70">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
