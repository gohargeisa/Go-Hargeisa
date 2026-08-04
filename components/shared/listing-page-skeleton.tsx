/**
 * Loading skeleton for the hotel/restaurant/cafe/attraction list pages —
 * mirrors the real layout (hero, count header + search bar, card grid) so
 * these routes don't fall back to the generic root loading.tsx, which has
 * no hero and mismatches the card proportions used by hotel-card.tsx /
 * listing-card.tsx. Counterpart to detail-page-skeleton.tsx.
 */
export function ListingPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div>
      <div className="skeleton h-[50vh] w-full md:h-[60vh] lg:h-[70vh]" />

      <div className="container-px mx-auto py-10 md:py-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <div className="skeleton h-7 w-40 rounded-lg" />
            <div className="skeleton h-4 w-56 rounded-lg" />
          </div>
        </div>
        <div className="skeleton mb-6 h-14 w-full rounded-full" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
              <div className="skeleton h-64 sm:h-[17rem]" />
              <div className="space-y-3 p-5 sm:p-6">
                <div className="skeleton h-5 w-2/3 rounded" />
                <div className="skeleton h-3.5 w-1/2 rounded" />
                <div className="skeleton h-9 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
