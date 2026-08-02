import { getTranslations } from "next-intl/server";
import { amenityIcon } from "@/lib/utils/amenity-icon";

const CATEGORIES: { key: string; labelKey: string; match: RegExp }[] = [
  { key: "Room", labelKey: "amenityCategoryRoom", match: /air ?condition|\bac\b|room service|concierge/i },
  { key: "Food", labelKey: "amenityCategoryFood", match: /breakfast|restaurant|dining|bar\b/i },
  { key: "Internet", labelKey: "amenityCategoryInternet", match: /wi[\s-]?fi/i },
  { key: "Parking", labelKey: "amenityCategoryParking", match: /park/i },
  { key: "Transport", labelKey: "amenityCategoryTransport", match: /shuttle|airport/i },
  { key: "Services", labelKey: "amenityCategoryServices", match: /generator|power|gym|fitness|pool|spa|garden|conference|meeting/i },
];

function categoryFor(label: string): string {
  return CATEGORIES.find((c) => c.match.test(label))?.key ?? "Services";
}

export async function HotelAmenities({ amenities }: { amenities: string[] }) {
  const t = await getTranslations("hotelDetail");

  if (amenities.length === 0) {
    return <p className="text-sm text-ink/50 dark:text-sand/50">{t("noAmenitiesListed")}</p>;
  }

  const groups = new Map<string, string[]>();
  for (const amenity of amenities) {
    const category = categoryFor(amenity);
    groups.set(category, [...(groups.get(category) ?? []), amenity]);
  }

  const orderedCategories = CATEGORIES.filter((c) => groups.has(c.key));

  return (
    <div className="space-y-7">
      {orderedCategories.map((category) => (
        <div key={category.key}>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45 dark:text-sand/45">
            {t(category.labelKey as "amenityCategoryRoom")}
            <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal text-ink/40 dark:bg-white/10 dark:text-sand/40">
              {groups.get(category.key)!.length}
            </span>
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {groups.get(category.key)!.map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <div
                  key={amenity}
                  className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 text-sm font-medium text-ink transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon size={17} className="text-primary" aria-hidden="true" />
                  </span>
                  <span className="truncate">{amenity}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
