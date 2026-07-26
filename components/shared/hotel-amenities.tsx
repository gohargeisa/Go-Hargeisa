import { amenityIcon } from "@/lib/utils/amenity-icon";

const CATEGORIES: { label: string; match: RegExp }[] = [
  { label: "Room", match: /air ?condition|\bac\b|room service|concierge/i },
  { label: "Food", match: /breakfast|restaurant|dining|bar\b/i },
  { label: "Internet", match: /wi[\s-]?fi/i },
  { label: "Parking", match: /park/i },
  { label: "Transport", match: /shuttle|airport/i },
  { label: "Services", match: /generator|power|gym|fitness|pool|spa|garden|conference|meeting/i },
];

function categoryFor(label: string): string {
  return CATEGORIES.find((c) => c.match.test(label))?.label ?? "Services";
}

export function HotelAmenities({ amenities }: { amenities: string[] }) {
  if (amenities.length === 0) {
    return (
      <p className="text-sm text-ink/50 dark:text-sand/50">
        No amenities listed yet — contact the hotel directly for details.
      </p>
    );
  }

  const groups = new Map<string, string[]>();
  for (const amenity of amenities) {
    const category = categoryFor(amenity);
    groups.set(category, [...(groups.get(category) ?? []), amenity]);
  }

  const orderedCategories = CATEGORIES.map((c) => c.label).filter((label) => groups.has(label));

  return (
    <div className="space-y-6">
      {orderedCategories.map((category) => (
        <div key={category}>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45 dark:text-sand/45">
            {category}
          </h3>
          <ul className="mt-3 flex flex-wrap gap-2.5">
            {groups.get(category)!.map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <li
                  key={amenity}
                  className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
                >
                  <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  {amenity}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
