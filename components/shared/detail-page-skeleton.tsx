/**
 * Loading skeleton for hotel/restaurant/cafe/attraction detail pages —
 * shared so all four `loading.tsx` files (which previously fell back to the
 * generic app-root card-grid skeleton, mismatching this layout's actual
 * hero + two-column shape) render something that plausibly matches.
 */
export function DetailPageSkeleton() {
  return (
    <div>
      <div className="container-px mx-auto pt-8 text-center">
        <div className="skeleton mx-auto h-24 w-24 rounded-full" />
        <div className="skeleton mx-auto mt-4 h-8 w-2/3 max-w-sm rounded-lg" />
        <div className="skeleton mx-auto mt-3 h-4 w-1/3 max-w-[200px] rounded-lg" />
      </div>

      <div className="container-px mx-auto mt-8">
        <div className="skeleton h-[46vh] max-h-[480px] min-h-[260px] w-full rounded-xl3" />
      </div>

      <div className="container-px mx-auto mt-10 grid gap-10 pb-16 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="space-y-3">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-2/3 rounded" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-xl2" />
            ))}
          </div>
        </div>
        <div className="skeleton h-64 rounded-xl3" />
      </div>
    </div>
  );
}
