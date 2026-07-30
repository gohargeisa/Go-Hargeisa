/**
 * Loading skeleton for the hotel/restaurant/cafe/attraction list pages —
 * mirrors the real layout (hero, count header + search bar, card grid) so
 * these routes don't fall back to the generic root loading.tsx, which has
 * no hero and mismatches the card proportions used by hotel-card.tsx /
 * listing-card.tsx. Counterpart to detail-page-skeleton.tsx.
 */
export function ListingPageSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-[50vh] w-full bg-ink/10 dark:bg-white/10 md:h-[60vh] lg:h-[70vh]" />

      <div className="container-px mx-auto py-10 md:py-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <div className="h-7 w-40 rounded-lg bg-ink/10 dark:bg-white/10" />
            <div className="h-4 w-56 rounded-lg bg-ink/10 dark:bg-white/10" />
          </div>
        </div>
        <div className="mb-6 h-14 w-full rounded-full bg-ink/10 dark:bg-white/10" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
              <div className="h-64 bg-ink/10 dark:bg-white/10 sm:h-[17rem]" />
              <div className="space-y-3 p-5 sm:p-6">
                <div className="h-5 w-2/3 rounded bg-ink/10 dark:bg-white/10" />
                <div className="h-3.5 w-1/2 rounded bg-ink/10 dark:bg-white/10" />
                <div className="h-9 w-full rounded-full bg-ink/10 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
