import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * One-off cleanup: restructures the live platform to only showcase official
 * partner businesses — keeps grand-haadi-hotel and beydan-coffee, removes
 * every other hotel/cafe row and all restaurant rows. Tables and schema are
 * untouched, only rows.
 *
 * Safe ordering: hotel_rooms/bookings/room_availability/booking_status_history
 * and attraction_nearby_hotels/attraction_nearby_restaurants cascade-delete
 * automatically (ON DELETE CASCADE in supabase/schema.sql). reviews,
 * favorites, business_metric_events, business_subscriptions,
 * business_messages, and business_claims use a polymorphic listing_id with
 * no DB-level FK (can't FK one column to three tables), so this script
 * deletes their matching rows explicitly to avoid leaving orphans.
 *
 * Usage: npx tsx scripts/restructure-to-official-partners.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const KEEP_HOTEL_SLUG = "grand-haadi-hotel";
const KEEP_CAFE_SLUG = "beydan-coffee";

async function deleteOrphanRefs(table: string, listingType: string, ids: string[]) {
  if (ids.length === 0) return;
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .eq("listing_type", listingType)
    .in("listing_id", ids);
  if (error) {
    console.error(`  ✗ ${table} (${listingType}):`, error.message);
    return;
  }
  console.log(`  ✔ ${table} (${listingType}): removed ${count ?? 0}`);
}

async function main() {
  const { data: hotels, error: hotelsErr } = await supabase.from("hotels").select("id, slug");
  const { data: restaurants, error: restaurantsErr } = await supabase.from("restaurants").select("id, slug");
  const { data: cafes, error: cafesErr } = await supabase.from("cafes").select("id, slug");
  if (hotelsErr || restaurantsErr || cafesErr) {
    console.error(hotelsErr?.message ?? restaurantsErr?.message ?? cafesErr?.message);
    process.exit(1);
  }

  const doomedHotelIds = (hotels ?? []).filter((h) => h.slug !== KEEP_HOTEL_SLUG).map((h) => h.id);
  const doomedRestaurantIds = (restaurants ?? []).map((r) => r.id);
  const doomedCafeIds = (cafes ?? []).filter((c) => c.slug !== KEEP_CAFE_SLUG).map((c) => c.id);

  console.log(
    `Deleting ${doomedHotelIds.length} hotels, ${doomedRestaurantIds.length} restaurants, ${doomedCafeIds.length} cafes.\n`
  );

  console.log("Cleaning up orphan-risk polymorphic references...");
  for (const table of ["reviews", "favorites", "business_metric_events", "business_subscriptions", "business_messages", "business_claims"]) {
    await deleteOrphanRefs(table, "hotel", doomedHotelIds);
    await deleteOrphanRefs(table, "restaurant", doomedRestaurantIds);
    await deleteOrphanRefs(table, "cafe", doomedCafeIds);
  }

  console.log("\nDeleting listing rows...");
  if (doomedHotelIds.length > 0) {
    const { error, count } = await supabase.from("hotels").delete({ count: "exact" }).in("id", doomedHotelIds);
    if (error) throw error;
    console.log(`  ✔ hotels: removed ${count ?? 0} (kept ${KEEP_HOTEL_SLUG})`);
  }
  if (doomedRestaurantIds.length > 0) {
    const { error, count } = await supabase.from("restaurants").delete({ count: "exact" }).in("id", doomedRestaurantIds);
    if (error) throw error;
    console.log(`  ✔ restaurants: removed ${count ?? 0} (none kept)`);
  }
  if (doomedCafeIds.length > 0) {
    const { error, count } = await supabase.from("cafes").delete({ count: "exact" }).in("id", doomedCafeIds);
    if (error) throw error;
    console.log(`  ✔ cafes: removed ${count ?? 0} (kept ${KEEP_CAFE_SLUG})`);
  }

  const [{ count: hotelsLeft }, { count: restaurantsLeft }, { count: cafesLeft }] = await Promise.all([
    supabase.from("hotels").select("*", { count: "exact", head: true }),
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase.from("cafes").select("*", { count: "exact", head: true }),
  ]);
  console.log(`\nRemaining: ${hotelsLeft} hotel(s), ${restaurantsLeft} restaurant(s), ${cafesLeft} cafe(s).`);
}

main();
