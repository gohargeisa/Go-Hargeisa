export default function Loading() {
  return (
    <div className="container-px mx-auto py-20">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/3 rounded-lg bg-ink/10 dark:bg-white/10" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl2 bg-ink/10 dark:bg-white/10" />
          ))}
        </div>
      </div>
    </div>
  );
}
