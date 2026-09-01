export default function RewardsLoading() {
  return (
    <div className="container-px mx-auto max-w-3xl pb-16 pt-[calc(env(safe-area-inset-top)+5.5rem)]">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-40 rounded bg-ink/10 dark:bg-white/10" />
        <div className="h-56 rounded-3xl bg-ink/10 dark:bg-white/10" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-2xl bg-ink/10 dark:bg-white/10" />
          <div className="h-24 rounded-2xl bg-ink/10 dark:bg-white/10" />
        </div>
        <div className="h-40 rounded-2xl bg-ink/10 dark:bg-white/10" />
      </div>
    </div>
  );
}
