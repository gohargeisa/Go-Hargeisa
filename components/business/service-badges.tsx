"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Settings2 } from "lucide-react";
import { amenityIcon } from "@/lib/utils/amenity-icon";
import { TagInput } from "@/components/admin/form-shared";
import { updateRecord } from "@/lib/actions/admin";
import type { BusinessListingType } from "@/types";

const FIELD_BY_TYPE: Record<BusinessListingType, string> = {
  hotel: "amenities",
  restaurant: "cuisine",
  cafe: "special_drinks",
  service: "services",
};
const TABLE_BY_TYPE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
};
const SUGGESTIONS_BY_TYPE: Record<BusinessListingType, string[]> = {
  hotel: [
    "Free WiFi",
    "Restaurant",
    "Airport Shuttle",
    "Parking",
    "Swimming Pool",
    "Breakfast",
    "Gym",
    "Room Service",
    "Front Desk",
  ],
  restaurant: ["Somali", "Grill", "International", "Seafood", "Fast Food", "Ethiopian"],
  cafe: ["Somali Spiced Coffee", "Somali Tea (Shaah)", "Iced Caramel Macchiato", "Cold Brew"],
  service: ["24/7", "Emergency", "Card Payment", "Cash Only", "Home Delivery", "Wheelchair Accessible"],
};

/**
 * Reads/writes the exact same field HotelForm/RestaurantForm/CafeForm
 * already edit per listing type (amenities | cuisine | special_drinks) —
 * this is a new dashboard-styled presentation over reused data + the
 * existing generic `updateRecord` action, not a parallel services system.
 * `currentPath` is passed as updateRecord's redirectTo so saving reloads
 * this same dashboard page instead of navigating to /admin.
 */
export function ServiceBadges({
  listingType,
  listingId,
  tags,
  currentPath,
}: {
  listingType: BusinessListingType;
  listingId: string;
  tags: string[];
  currentPath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(tags);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSave() {
    setError(null);
    startTransition(async () => {
      const field = FIELD_BY_TYPE[listingType];
      const result = await updateRecord(TABLE_BY_TYPE[listingType], listingId, { [field]: values }, [currentPath], currentPath);
      // updateRecord redirects server-side on success and never returns here.
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-bold">{t("servicesTitle")}</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Settings2 size={13} aria-hidden="true" /> {t("manageServices")}
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <TagInput
            label={t("servicesTitle")}
            values={values}
            onChange={setValues}
            placeholder={t("addServicePlaceholder")}
            suggestions={SUGGESTIONS_BY_TYPE[listingType]}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
            >
              {isPending && <Loader2 size={12} className="animate-spin" />} {t("saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => {
                setValues(tags);
                setEditing(false);
              }}
              className="rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noServicesYet")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const Icon = amenityIcon(tag);
            return (
              <li
                key={tag}
                className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-2.5 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
              >
                <Icon size={15} className="shrink-0 text-primary" aria-hidden="true" />
                {tag}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
