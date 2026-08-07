"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, Loader2, Camera, X, Pencil, Trash2 } from "lucide-react";
import { submitReview, updateReview, deleteReview } from "@/lib/actions/content";
import { uploadImage } from "@/lib/supabase/storage";
import type { Locale } from "@/lib/i18n/config";
import type { Review, PolymorphicListingType } from "@/types";

type ListingType = PolymorphicListingType;

const MAX_REVIEW_PHOTOS = 3;

export function ReviewForm({
  listingType,
  listingId,
  locale,
  pathToRevalidate,
  allowPhotos = false,
  existingReview = null,
}: {
  listingType: ListingType;
  listingId: string;
  locale: Locale;
  pathToRevalidate: string;
  /** Only the hotel detail page sets this — restaurant/cafe/attraction review forms render exactly as before. */
  allowPhotos?: boolean;
  /** The signed-in visitor's own review, if they've already reviewed this
   * listing (see lib/data/reviews.ts getMyReviewForListing). Switches this
   * form from "leave a review" to "edit your review" — the reviews table
   * has a one-review-per-user-per-listing constraint, so this is how the
   * UI avoids ever hitting that as a surprise error. */
  existingReview?: Review | null;
}) {
  const t = useTranslations("review");
  const router = useRouter();
  const isEditing = !!existingReview;
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [visitDate, setVisitDate] = useState(existingReview?.visitDate ?? "");
  const [photos, setPhotos] = useState<string[]>((existingReview?.photos ?? []).map((p) => p.url));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function onAddPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const url = await uploadImage(file, { bucket: "listing-images", folder: "reviews" });
      setPhotos((p) => [...p, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("photoUploadFailed"));
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = existingReview
        ? await updateReview({ reviewId: existingReview.id, rating, comment, title, visitDate, locale, pathToRevalidate, photos })
        : await submitReview({ listingType, listingId, rating, comment, title, visitDate, locale, pathToRevalidate, photos });
      if (result.ok) {
        setSuccess(true);
        setEditing(false);
        if (!existingReview) {
          setTitle("");
          setComment("");
          setVisitDate("");
          setPhotos([]);
        }
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function onDelete() {
    if (!existingReview || !confirm(t("deleteReviewConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteReview(locale, existingReview.id, pathToRevalidate);
      if (result.ok) router.refresh();
      else setError(result.error ?? t("somethingWentWrong"));
    });
  }

  // Already reviewed, not currently editing — show a compact summary card
  // with Edit/Delete instead of the full form.
  if (isEditing && !editing && !success) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl2 border border-ink/8 p-4 dark:border-white/10">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{t("yourReviewLabel")}</p>
          <div className="mt-1 flex gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Pencil size={12} aria-hidden="true" /> {t("editReview")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/20"
          >
            {isPending ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} aria-hidden="true" />} {t("deleteReview")}
          </button>
        </div>
      </div>
    );
  }

  if (success && !isEditing) {
    return (
      <p className="rounded-xl2 border border-secondary/30 bg-secondary/5 p-4 text-sm text-secondary-700">
        {t("thanksReview")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-5">
      <p className="text-sm font-semibold mb-3">{isEditing ? t("editReview") : t("leaveReview")}</p>
      <div role="radiogroup" aria-label={t("ratingGroupAriaLabel")} className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={i < rating}
            onClick={() => setRating(i + 1)}
            aria-label={t("ratingAriaLabel", { stars: i + 1 })}
            className="text-accent"
          >
            <Star size={20} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <label htmlFor="review-title" className="sr-only">
        {t("reviewTitleLabel")}
      </label>
      <input
        id="review-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("reviewTitleLabel")}
        className="mb-2 w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold outline-none focus:border-primary"
      />

      <label htmlFor="review-comment" className="sr-only">
        {t("commentPlaceholder")}
      </label>
      <textarea
        id="review-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={3}
        placeholder={t("commentPlaceholder")}
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
      />

      <label htmlFor="review-visit-date" className="mt-3 flex items-center gap-2 text-xs font-semibold text-ink/60 dark:text-sand/60">
        {t("visitDateLabel")}
        <input
          id="review-visit-date"
          type="date"
          value={visitDate}
          onChange={(e) => setVisitDate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="rounded-lg border border-ink/12 dark:border-white/15 bg-transparent px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
        />
      </label>

      {allowPhotos && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative h-14 w-14 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny local preview thumbnail, not worth next/image's overhead here */}
                <img src={url} alt={`Uploaded photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, pi) => pi !== i))}
                  aria-label={t("removePhoto")}
                  className="absolute end-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {photos.length < MAX_REVIEW_PHOTOS && (
              <label className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-lg border border-dashed border-ink/20 text-ink/40 hover:border-primary hover:text-primary dark:border-white/20">
                {uploadingPhoto ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Camera size={16} aria-hidden="true" />
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={onAddPhoto} className="hidden" />
              </label>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">{t("addPhotosHint", { max: MAX_REVIEW_PHOTOS })}</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}{" "}
          {error.includes("sign in") && (
            <Link href={`/${locale}/auth/login`} className="font-semibold underline">
              {t("signIn")}
            </Link>
          )}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors disabled:opacity-70"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isEditing ? t("saveChanges") : t("submitReview")}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setRating(existingReview.rating);
              setTitle(existingReview.title ?? "");
              setComment(existingReview.comment);
              setVisitDate(existingReview.visitDate ?? "");
              setPhotos((existingReview.photos ?? []).map((p) => p.url));
              setError(null);
            }}
            disabled={isPending}
            className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold disabled:opacity-60 dark:border-white/20"
          >
            {t("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
