import { Clock, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { PrimaryButton } from "@/components/shared/buttons";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import type { OpeningHoursGroup } from "@/types";

export function CafeActionCard({
  cafeId,
  name,
  openingHoursStructured,
  hoursLabel,
  openNowLabel,
  closedLabel,
  viewHoursLabel,
  phone,
  locale,
  callLabel,
}: {
  cafeId: string;
  name: string;
  openingHoursStructured?: OpeningHoursGroup[];
  hoursLabel: string;
  openNowLabel: string;
  closedLabel: string;
  viewHoursLabel: string;
  phone?: string;
  locale: Locale;
  callLabel: string;
}) {
  const hasHours = openingHoursStructured && openingHoursStructured.length > 0;

  return (
    <div className="space-y-5">
      {hasHours && (
        <div className="flex items-start justify-between gap-2.5 text-sm text-ink/70 dark:text-sand/70">
          <div className="flex items-start gap-2.5">
            <Clock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {hoursLabel}
              </p>
              <a href="#hours" className="hover:text-primary hover:underline">
                {viewHoursLabel}
              </a>
            </div>
          </div>
          <OpenStatusBadge groups={openingHoursStructured!} openLabel={openNowLabel} closedLabel={closedLabel} />
        </div>
      )}

      {phone && (
        <PrimaryButton href={`tel:${phone}`} size="lg" fullWidth>
          <Phone size={15} aria-hidden="true" />
          {callLabel}
        </PrimaryButton>
      )}

      <AddToTripButton locale={locale} listingType="cafe" listingId={cafeId} />
      <ShareButton title={name} />
    </div>
  );
}
