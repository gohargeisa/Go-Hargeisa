"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Star, User, ThumbsUp, Flag } from "lucide-react";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import { toggleHelpfulVote, reportReviewAsVisitor } from "@/lib/actions/content";
import type { Locale } from "@/lib/i18n/config";
import type { Review } from "@/types";

const PAGE_SIZE = 5;

export function ReviewsSection({
  rating,
  reviewCount,
  reviews,
  locale,
  pathToRevalidate,
}: {
  rating: number;
  reviewCount: number;
  reviews: Review[];
  locale: Locale;
  pathToRevalidate: string;
}) {
  const [lightbox, setLightbox] = useState<{ slides: LightboxSlide[]; index: number } | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const t = useTranslations("review");
  const visibleReviews = reviews.slice(0, visibleCount);

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));
  const maxCount = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div>
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-semibold ${
            reviewCount > 0 ? "bg-accent/15 text-accent-700" : "bg-ink/5 text-ink/30 dark:bg-white/5 dark:text-sand/30"
          }`}
        >
          {reviewCount > 0 ? rating.toFixed(1) : <Star size={22} strokeWidth={1.5} />}
        </div>
        <div>
          <div className={`flex gap-0.5 ${reviewCount > 0 ? "text-accent" : "text-ink/20 dark:text-sand/20"}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
            ))}
          </div>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("basedOnReviews", { count: reviewCount })}</p>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="mt-5 max-w-sm space-y-1.5" aria-label={t("ratingDistribution")}>
          {distribution.map((d) => (
            <div key={d.stars} className="flex items-center gap-2.5 text-xs">
              <span className="w-3 shrink-0 text-ink/55 dark:text-sand/55">{d.stars}</span>
              <Star size={11} className="shrink-0 text-accent" fill="currentColor" strokeWidth={1.5} aria-hidden="true" />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(d.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-5 shrink-0 text-end text-ink/45 dark:text-sand/45">{d.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {reviews.length === 0 && (
          <p className="text-sm text-ink/50 dark:text-sand/50">{t("beFirstReview")}</p>
        )}
        {visibleReviews.map((r) => (
          <ReviewCard
            key={r.id}
            review={r}
            locale={locale}
            pathToRevalidate={pathToRevalidate}
            onOpenLightbox={(index) =>
              setLightbox({
                slides: r.photos!.map((p, pi) => ({ url: p.url, alt: p.alt || `Review photo ${pi + 1}` })),
                index,
              })
            }
          />
        ))}
      </div>

      {visibleCount < reviews.length && (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-ink/12 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
          >
            {t("loadMoreReviews")}
          </button>
        </div>
      )}

      {lightbox && (
        <Lightbox
          slides={lightbox.slides}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndexChange={(i) => setLightbox((l) => (l ? { ...l, index: i } : l))}
        />
      )}
    </div>
  );
}

function ReviewCard({
  review: r,
  locale,
  pathToRevalidate,
  onOpenLightbox,
}: {
  review: Review;
  locale: Locale;
  pathToRevalidate: string;
  onOpenLightbox: (index: number) => void;
}) {
  const t = useTranslations("review");
  const [helpful, setHelpful] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(r.helpfulCount);
  const [reported, setReported] = useState(false);
  const [signInPrompt, setSignInPrompt] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onToggleHelpful() {
    setSignInPrompt(false);
    startTransition(async () => {
      const result = await toggleHelpfulVote(r.id, pathToRevalidate);
      if (result.ok) {
        setHelpful(!!result.helpful);
        setHelpfulCount((c) => c + (result.helpful ? 1 : -1));
      } else if (result.error === "sign-in-required") {
        setSignInPrompt(true);
      }
    });
  }

  function onReport() {
    if (reported || !confirm(t("reportReviewConfirm"))) return;
    setSignInPrompt(false);
    startTransition(async () => {
      const result = await reportReviewAsVisitor(r.id, pathToRevalidate);
      if (result.ok) setReported(true);
      else if (result.error === "sign-in-required") setSignInPrompt(true);
    });
  }

  return (
    <div className="rounded-xl2 border border-ink/8 dark:border-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10">
          <User size={16} />
        </span>
        <div>
          <p className="text-sm font-semibold">{r.authorName}</p>
          <div className="flex gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={11} fill={i < r.rating ? "currentColor" : "none"} strokeWidth={1.5} />
            ))}
          </div>
        </div>
      </div>

      {r.title && <p className="mt-3 text-sm font-semibold">{r.title}</p>}
      <p className="mt-1.5 text-sm text-ink/70 dark:text-sand/70">{r.comment}</p>
      {r.visitDate && (
        <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">{t("visitedOn", { date: r.visitDate })}</p>
      )}

      {r.photos && r.photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.photos.map((photo, i) => (
            <button
              key={`${photo.url}-${i}`}
              type="button"
              onClick={() => onOpenLightbox(i)}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label={`View review photo ${i + 1}`}
            >
              <Image src={photo.url} alt={photo.alt || ""} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {r.ownerReply && (
        <div className="mt-3 rounded-xl border border-primary/15 bg-primary/5 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-primary-700">{t("ownerReplyLabel")}</p>
          <p className="mt-1 text-sm text-ink/75 dark:text-sand/75">{r.ownerReply}</p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs">
        <button
          type="button"
          onClick={onToggleHelpful}
          disabled={isPending}
          className={`inline-flex items-center gap-1.5 font-semibold transition-colors disabled:opacity-60 ${
            helpful ? "text-primary-700" : "text-ink/50 hover:text-primary dark:text-sand/50"
          }`}
        >
          <ThumbsUp size={13} fill={helpful ? "currentColor" : "none"} aria-hidden="true" />
          {helpfulCount > 0 ? t("helpfulCount", { count: helpfulCount }) : t("helpful")}
        </button>
        <button
          type="button"
          onClick={onReport}
          disabled={isPending || reported}
          className="inline-flex items-center gap-1.5 font-semibold text-ink/50 transition-colors hover:text-red-600 disabled:opacity-60 dark:text-sand/50"
        >
          <Flag size={13} aria-hidden="true" />
          {reported ? t("reportedReview") : t("reportReview")}
        </button>
      </div>

      {signInPrompt && (
        <p className="mt-2 text-xs text-red-600">
          <Link href={`/${locale}/auth/login`} className="font-semibold underline">
            {t("signIn")}
          </Link>
        </p>
      )}
    </div>
  );
}
