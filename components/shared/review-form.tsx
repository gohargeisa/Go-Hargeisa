"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Star, Loader2, Camera, X } from "lucide-react";
import { submitReview } from "@/lib/actions/content";
import { uploadImage } from "@/lib/supabase/storage";
import type { Locale } from "@/lib/i18n/config";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction" | "service";

const MAX_REVIEW_PHOTOS = 3;

export function ReviewForm({
  listingType,
  listingId,
  locale,
  pathToRevalidate,
  allowPhotos = false,
}: {
  listingType: ListingType;
  listingId: string;
  locale: Locale;
  pathToRevalidate: string;
  /** Only the hotel detail page sets this — restaurant/cafe/attraction review forms render exactly as before. */
  allowPhotos?: boolean;
}) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
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
      setError(err instanceof Error ? err.message : "Photo upload failed.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReview({ listingType, listingId, rating, comment, locale, pathToRevalidate, photos });
      if (result.ok) {
        setSuccess(true);
        setComment("");
        setPhotos([]);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  if (success) {
    return (
      <p className="rounded-xl2 border border-secondary/30 bg-secondary/5 p-4 text-sm text-secondary-700">
        {t("thanksReview")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-5">
      <p className="text-sm font-semibold mb-3">{t("leaveReview")}</p>
      <div className="flex gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            aria-label={t("ratingAriaLabel", { stars: i + 1 })}
            className="text-accent"
          >
            <Star size={20} fill={i < rating ? "currentColor" : "none"} strokeWidth={1.5} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
        rows={3}
        placeholder={t("commentPlaceholder")}
        className="w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
      />

      {allowPhotos && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-2">
            {photos.map((url, i) => (
              <div key={url} className="relative h-14 w-14 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny local preview thumbnail, not worth next/image's overhead here */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((p) => p.filter((_, pi) => pi !== i))}
                  aria-label="Remove photo"
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
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
          <p className="mt-1.5 text-xs text-ink/45 dark:text-sand/45">Add up to {MAX_REVIEW_PHOTOS} photos (optional).</p>
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
      <button
        type="submit"
        disabled={isPending}
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {t("submitReview")}
      </button>
    </form>
  );
}
