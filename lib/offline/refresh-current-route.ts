/**
 * Single-page, silent content refresh — shared by network-sync-controller.tsx
 * (on reconnect / SW change-broadcast) and use-pull-to-refresh.ts (on a
 * manual pull gesture) so the two triggers stay in lockstep rather than
 * duplicating the same one-liner. Deliberately scoped to the current route
 * only, not a re-fetch of every previously cached page — that would waste
 * mobile data for no benefit on pages the user isn't looking at; those
 * refresh the normal way the next time they're actually revisited, via the
 * service worker's Stale-While-Revalidate rule.
 *
 * Typed structurally against just the one method used, rather than
 * importing next/navigation's router type, so callers can pass the return
 * value of useRouter() without this file needing to know its full shape.
 */
export function refreshCurrentRoute(router: { refresh: () => void }): void {
  router.refresh();
}
