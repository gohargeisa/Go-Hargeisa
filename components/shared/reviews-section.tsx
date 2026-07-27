"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, User } from "lucide-react";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import type { Review } from "@/types";

export function ReviewsSection({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}) {
  // Photo Reviews: reviews from every listing type carry an optional
  // `photos` array now, but only the hotel review form currently lets
  // guests attach any — this renders a no-op (no thumbnails shown) on
  // restaurant/cafe/attraction pages where photos is always empty.
  const [lightbox, setLightbox] = useState<{ slides: LightboxSlide[]; index: number } | null>(null);

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/15 font-display text-2xl font-semibold text-accent-700">
          {rating.toFixed(1)}
        </div>
        <div>
          <div className="flex gap-0.5 text-accent">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={16} fill={i < Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
            ))}
          </div>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Based on {reviewCount} reviews</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {reviews.length === 0 && (
          <p className="text-sm text-ink/50 dark:text-sand/50">Be the first to leave a review.</p>
        )}
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-4">
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
            <p className="mt-3 text-sm text-ink/70 dark:text-sand/70">{r.comment}</p>

            {r.photos && r.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((photo, i) => (
                  <button
                    key={`${photo.url}-${i}`}
                    type="button"
                    onClick={() =>
                      setLightbox({
                        slides: r.photos!.map((p, pi) => ({ url: p.url, alt: p.alt || `Review photo ${pi + 1}` })),
                        index: i,
                      })
                    }
                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label={`View review photo ${i + 1}`}
                  >
                    <Image src={photo.url} alt={photo.alt || ""} fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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
