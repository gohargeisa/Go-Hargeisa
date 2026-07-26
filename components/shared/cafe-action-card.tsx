import { Clock, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";

export function CafeActionCard({
  cafeId,
  name,
  openingHours,
  hoursLabel,
  phone,
  locale,
}: {
  cafeId: string;
  name: string;
  openingHours?: string;
  hoursLabel: string;
  phone?: string;
  locale: Locale;
}) {
  return (
    <div className="space-y-5">
      {openingHours && (
        <div className="flex items-start gap-2.5 text-sm text-ink/70 dark:text-sand/70">
          <Clock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {hoursLabel}
            </p>
            {openingHours}
          </div>
        </div>
      )}

      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Phone size={15} aria-hidden="true" />
          Call Cafe
        </a>
      )}

      <AddToTripButton locale={locale} listingType="cafe" listingId={cafeId} />
      <ShareButton title={name} />
    </div>
  );
}
