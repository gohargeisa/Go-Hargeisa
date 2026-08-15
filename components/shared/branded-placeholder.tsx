"use client";

import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";

/**
 * Premium "no real photos yet" hero placeholder — a branded gradient card
 * with the business's initial and a small, honest "Photos coming soon"
 * label, instead of rendering a giant placehold.co text-on-color-block
 * image at full hero size. Reusable across every listing type; nothing here
 * is specific to any one business. Swapped in automatically by
 * HotelGallerySlider whenever a listing's only image is a generated
 * placeholder — the moment a real photo is uploaded, this disappears on its
 * own.
 */
export function BrandedPlaceholder({ name, className }: { name: string; className?: string }) {
  const t = useTranslations("detail");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-ink ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.08]"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)", backgroundSize: "22px 22px" }}
      />
      <div className="relative flex flex-col items-center gap-4 px-6 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 font-display text-3xl font-bold text-white ring-1 ring-white/25 backdrop-blur-sm sm:h-24 sm:w-24 sm:text-4xl">
          {initial}
        </span>
        <p className="max-w-xs text-balance font-display text-xl font-bold text-white sm:text-2xl">{name}</p>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
          <Camera size={12} aria-hidden="true" />
          {t("photosComingSoon")}
        </span>
      </div>
    </div>
  );
}
