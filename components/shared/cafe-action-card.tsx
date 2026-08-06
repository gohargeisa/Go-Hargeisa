import { Clock, Phone } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { PrimaryButton } from "@/components/shared/buttons";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import type { OpeningHoursGroup } from "@/types";

export function CafeActionCard({
  cafeId,
  name,
  openingHoursStructured,
  is24Hours,
  temporarilyClosed,
  permanentlyClosed,
  hoursLabel,
  viewHoursLabel,
  phone,
  locale,
  callLabel,
  initiallyFavorited = false,
  favoriteCount,
  addFavoriteLabel,
  removeFavoriteLabel,
}: {
  cafeId: string;
  name: string;
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  hoursLabel: string;
  viewHoursLabel: string;
  phone?: string;
  locale: Locale;
  callLabel: string;
  initiallyFavorited?: boolean;
  favoriteCount?: number;
  addFavoriteLabel: string;
  removeFavoriteLabel: string;
}) {
  const hasHours = (openingHoursStructured && openingHoursStructured.length > 0) || is24Hours || temporarilyClosed || permanentlyClosed;

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
          <OpenStatusBadge
            groups={openingHoursStructured ?? []}
            is24Hours={is24Hours}
            temporarilyClosed={temporarilyClosed}
            permanentlyClosed={permanentlyClosed}
          />
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
      <FavoriteButton
        listingType="cafe"
        listingId={cafeId}
        locale={locale}
        initiallyFavorited={initiallyFavorited}
        count={favoriteCount}
        showSpinner={false}
        size={15}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        addLabel={addFavoriteLabel}
        removeLabel={removeFavoriteLabel}
      />
    </div>
  );
}
