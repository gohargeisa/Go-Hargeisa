"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { VideoUploader } from "@/components/shared/video-uploader-lazy";
import { updateRecord } from "@/lib/actions/admin";
import { updateCityServicePartial } from "@/lib/actions/city-services";
import { HOTEL_GALLERY_CATEGORIES, RESTAURANT_GALLERY_CATEGORIES, CAFE_GALLERY_CATEGORIES, SERVICE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import type { BusinessListingType, GalleryImage, MediaVideo } from "@/types";

const TABLE_BY_TYPE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services" | "city_services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
  city_service: "city_services",
};
const CATEGORIES_BY_TYPE: Record<BusinessListingType, typeof SERVICE_GALLERY_CATEGORIES> = {
  hotel: HOTEL_GALLERY_CATEGORIES,
  restaurant: RESTAURANT_GALLERY_CATEGORIES,
  cafe: CAFE_GALLERY_CATEGORIES,
  service: SERVICE_GALLERY_CATEGORIES,
  city_service: SERVICE_GALLERY_CATEGORIES,
};

function localeFromPath(path: string): string {
  return path.match(/^\/([a-z]{2})\//)?.[1] ?? "en";
}

/**
 * The Media Manager: cover image (upload fresh, or promote an existing
 * gallery photo), logo, the drag & drop/reorderable photo gallery, and an
 * optional short-video gallery — one save action across all four listing
 * types, including services (logo_url/videos columns added in the Phase 9
 * services CMS expansion).
 */
export function GalleryManagerPanel({
  listingType,
  listingId,
  initialCover,
  initialLogo,
  initialGallery,
  initialVideos,
  currentPath,
}: {
  listingType: BusinessListingType;
  listingId: string;
  initialCover: string;
  initialLogo: string;
  initialGallery: GalleryImage[];
  initialVideos?: MediaVideo[];
  currentPath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [cover, setCover] = useState(initialCover);
  const [logo, setLogo] = useState(initialLogo);
  const [gallery, setGallery] = useState(initialGallery);
  const [videos, setVideos] = useState<MediaVideo[]>(initialVideos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    startTransition(async () => {
      // city_services' cover field is called `image`, not `cover_image` —
      // see updateCityServicePartial's comment — but logo_url is now the
      // same column/name every other listing table already uses.
      const result =
        listingType === "city_service"
          ? await updateCityServicePartial(localeFromPath(currentPath), listingId, { image: cover, logo_url: logo || null, gallery, videos })
          : await updateRecord(
              TABLE_BY_TYPE[listingType] as "hotels" | "restaurants" | "cafes" | "services",
              listingId,
              { cover_image: cover, logo_url: logo || null, gallery, videos },
              [currentPath],
              currentPath
            );
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2 sm:p-6">
        <ImageUploader folder={`${listingType}s`} value={cover} onChange={setCover} label={t("coverImage")} />
        <ImageUploader folder={`${listingType}s/logos`} value={logo} onChange={setLogo} label={t("businessLogo")} rounded="rounded-full" />
      </div>

      <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <GalleryManager
          folder={`${listingType}s/gallery`}
          value={gallery}
          onChange={setGallery}
          categories={CATEGORIES_BY_TYPE[listingType]}
          coverUrl={cover}
          onSetCover={setCover}
          setCoverLabel={t("setAsCoverLabel")}
          coverBadgeLabel={t("coverBadgeLabel")}
        />
      </div>

      <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
        <VideoUploader
          folder={`${listingType}s/videos`}
          value={videos}
          onChange={setVideos}
          label={t("videosLabel")}
          addLabel={t("addVideoLabel")}
          hint={t("videosHint")}
          captionPlaceholder={t("videoCaptionPlaceholder")}
          removeAriaLabel={t("removeVideoAriaLabel")}
          replaceAriaLabel={t("replaceVideoAriaLabel")}
          moveEarlierAriaLabel={t("moveVideoEarlierAriaLabel")}
          moveLaterAriaLabel={t("moveVideoLaterAriaLabel")}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />} {t("saveChanges")}
      </button>
    </div>
  );
}
