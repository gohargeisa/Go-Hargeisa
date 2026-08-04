/**
 * Loading skeleton for the sidebar/header-shaped dashboard shells
 * (/business, /admin, /dashboard) — shared so each area's `loading.tsx`
 * shows a plausible shape instead of the generic app-root card grid.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-sand dark:bg-ink">
      <div className="hidden w-64 shrink-0 border-e border-ink/8 p-5 dark:border-white/10 lg:block">
        <div className="skeleton h-6 w-32 rounded-lg" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-xl2" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-5 sm:p-8">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton mt-6 h-64 rounded-2xl" />
      </div>
    </div>
  );
}
