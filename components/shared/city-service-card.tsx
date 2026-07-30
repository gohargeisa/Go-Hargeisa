import Image from "next/image";
import { Phone, Clock, MapPin, ImageOff } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CityService } from "@/types";

export function CityServiceCard({ service }: { service: CityService }) {
  const t = useTranslations("cityServices");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_8px_24px_rgba(20,30,45,0.07)] dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-36 w-full shrink-0 bg-ink/5 dark:bg-white/10">
        {service.image ? (
          <Image src={service.image} alt={service.name} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/25 dark:text-sand/25">
            <ImageOff size={22} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold text-ink dark:text-white">{service.name}</h3>
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
          {service.openingHours && (
            <span className="flex items-center gap-2">
              <Clock size={14} className="shrink-0 text-primary" aria-hidden="true" />
              {service.openingHours}
            </span>
          )}
        </div>

        {service.mapsUrl && (
          <a
            href={service.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          >
            <MapPin size={14} aria-hidden="true" />
            {t("viewOnMaps")}
          </a>
        )}
      </div>
    </div>
  );
}
