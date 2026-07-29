import { Phone, Clock, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CityService } from "@/types";

export function CityServiceCard({ service }: { service: CityService }) {
  const t = useTranslations("cityServices");

  return (
    <div className="flex h-full flex-col rounded-3xl border border-ink/8 bg-white p-5 shadow-[0_8px_24px_rgba(20,30,45,0.07)] dark:border-white/10 dark:bg-white/[0.04]">
      <h3 className="font-display text-lg font-bold text-ink dark:text-white">{service.name}</h3>

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
  );
}
