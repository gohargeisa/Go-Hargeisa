"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Phone, Clock, MapPin, Globe, ImageOff, MessageCircle, Mail, Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { AnimatedCard } from "./animated-card";
import { SecondaryButton } from "./buttons";
import { Lightbox } from "./lightbox";
import { cityServiceCategoryMeta } from "@/lib/config/city-service-categories";
import { cityServiceCategorySupportsGallery } from "@/lib/config/gallery-eligibility";
import type { CityService } from "@/types";

export function CityServiceCard({ service, locale }: { service: CityService; locale: string }) {
  const t = useTranslations("cityServices");
  const { icon: CategoryIcon, titleKey } = cityServiceCategoryMeta(service.category);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const href = `/${locale}/city-services/${service.slug}`;

  // A category that doesn't support galleries only ever gets its single
  // cover photo — gallery.length is irrelevant there even if data exists.
  const galleryEligible = cityServiceCategorySupportsGallery(service.category);
  const photos = galleryEligible
    ? [
        ...(service.image ? [{ url: service.image, alt: service.name }] : []),
        ...service.gallery.filter((g) => g.url !== service.image).map((g) => ({ url: g.url, alt: g.alt || service.name })),
      ]
    : [];
  const hasGallery = photos.length > 1;

  return (
    <AnimatedCard className="flex h-full flex-col overflow-hidden rounded-xl2 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-36 w-full shrink-0 bg-ink/5 dark:bg-white/10">
        {service.image ? (
          hasGallery ? (
            <button
              type="button"
              onClick={() => setLightboxIndex(0)}
              aria-label={t("openGalleryAriaLabel", { name: service.name })}
              className="group block h-full w-full"
            >
              <Image
                src={service.image}
                alt={service.name}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 ease-premium group-hover:scale-105"
              />
              <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                <Images size={12} aria-hidden="true" />
                {photos.length}
              </span>
            </button>
          ) : (
            <Link href={href} className="block h-full w-full" aria-label={service.name}>
              <Image
                src={service.image}
                alt={service.name}
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 ease-premium hover:scale-105"
              />
            </Link>
          )
        ) : (
          <Link href={href} aria-label={service.name} className="flex h-full w-full items-center justify-center text-ink/25 dark:text-sand/25">
            <ImageOff size={22} aria-hidden="true" />
          </Link>
        )}
        <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm backdrop-blur dark:bg-ink/85 dark:text-white">
          <CategoryIcon size={12} className="text-primary" aria-hidden="true" />
          {t(titleKey)}
        </span>
      </div>

      {lightboxIndex !== null && (
        <Lightbox slides={photos} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}

      <div className="flex flex-1 flex-col p-5">
        <Link href={href}>
          <h3 className="font-display text-lg font-bold text-ink transition-colors hover:text-primary dark:text-white">{service.name}</h3>
        </Link>
        {service.description && (
          <p className="mt-1.5 text-sm text-ink/60 dark:text-sand/60">{service.description}</p>
        )}

        <div className="mt-3 flex flex-col gap-2 text-sm text-ink/65 dark:text-sand/65">
          {service.phone && (
            <a href={`tel:${service.phone}`} className="flex items-center gap-2 hover:text-primary">
              <Phone size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {service.phone}
            </a>
          )}
          {service.whatsapp && (
            <a
              href={`https://wa.me/${service.whatsapp.replace(/[^\d]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary"
            >
              <MessageCircle size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {service.whatsapp}
            </a>
          )}
          {service.email && (
            <a href={`mailto:${service.email}`} className="flex items-center gap-2 hover:text-primary">
              <Mail size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {service.email}
            </a>
          )}
          {service.openingHours && (
            <span className="flex items-center gap-2">
              <Clock size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {service.openingHours}
            </span>
          )}
          {service.website && (
            <a href={service.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
              <Globe size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {t("visitWebsite")}
            </a>
          )}
        </div>

        <div className="mt-4 flex gap-2.5">
          <SecondaryButton href={href} fullWidth>
            {t("viewDetails")}
          </SecondaryButton>
          {service.mapsUrl && (
            <SecondaryButton href={service.mapsUrl} external fullWidth>
              <MapPin size={14} aria-hidden="true" />
              {t("viewOnMaps")}
            </SecondaryButton>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}
