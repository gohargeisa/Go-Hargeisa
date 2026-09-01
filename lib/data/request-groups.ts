import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminRequestGroup<T> {
  listingId: string;
  listingName: string;
  requests: T[];
}

/**
 * Groups an admin-wide request list (purchase_requests / event_requests) by
 * its target listing and attaches the listing name. Both request tables are
 * city_service-only (see 20260907000002's own comment and the create
 * actions, which hardcode listing_type = 'city_service'), so the name
 * lookup is a single batched city_services query. Shared so the two admin
 * queries resolve "which business is this request for" identically. Order
 * within each group is preserved from the caller (newest-first).
 */
export async function groupRequestsByListing<T extends { listingId: string }>(
  supabase: SupabaseClient,
  requests: T[]
): Promise<AdminRequestGroup<T>[]> {
  const listingIds = [...new Set(requests.map((r) => r.listingId))];
  const { data } = listingIds.length
    ? await supabase.from("city_services").select("id, name").in("id", listingIds)
    : { data: [] as { id: string; name: string }[] };
  const nameById = new Map(((data ?? []) as { id: string; name: string }[]).map((r) => [r.id, r.name]));

  const groups = new Map<string, AdminRequestGroup<T>>();
  for (const req of requests) {
    let group = groups.get(req.listingId);
    if (!group) {
      group = { listingId: req.listingId, listingName: nameById.get(req.listingId) ?? "Removed listing", requests: [] };
      groups.set(req.listingId, group);
    }
    group.requests.push(req);
  }
  return [...groups.values()];
}
