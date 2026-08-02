export default function Loading() {
  return (
    <section className="container-px mx-auto animate-pulse py-10 md:py-14">
      <div className="mb-6">
        <div className="h-8 w-64 rounded-lg bg-ink/10 dark:bg-white/10" />
        <div className="mt-2 h-4 w-80 max-w-full rounded-lg bg-ink/10 dark:bg-white/10" />
      </div>
      <div className="mb-8 h-12 w-full max-w-md rounded-full bg-ink/10 dark:bg-white/10" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
            <div className="h-64 bg-ink/10 dark:bg-white/10 sm:h-[17rem]" />
            <div className="space-y-3 p-5 sm:p-6">
              <div className="h-5 w-2/3 rounded bg-ink/10 dark:bg-white/10" />
              <div className="h-3.5 w-1/2 rounded bg-ink/10 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
