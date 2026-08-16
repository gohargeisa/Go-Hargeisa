import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * Test-case setup for the universal cart system's Restaurant vertical —
 * turns ordering on for one real, already-published restaurant (Sultan
 * Restaurant, currently unclaimed — owner_id is null) and adds one
 * representative product so "Restaurant: Burger -> Add to Cart -> Checkout
 * -> Order -> Admin sees order" (the flow explicitly requested for
 * verification) can be exercised end-to-end. This is test data, not a real
 * menu import — unlike Lavender's menu (transcribed from the owner's actual
 * PDF), Sultan Restaurant hasn't supplied real menu data, so this inserts
 * exactly one clearly-generic item and stops there rather than inventing a
 * full menu for a business that didn't ask for one.
 *
 * REQUIRES 20260823000002_universal_cart_orders.sql to already be applied
 * (restaurants.ordering_enabled/products_delivery_enabled must exist).
 *
 * Safe to re-run (upsert on slug for the product via delete-then-insert
 * keyed by name).
 *
 * Run: npx tsx scripts/enable-restaurant-ordering-test.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: restaurant, error: findError } = await supabase
    .from("restaurants")
    .select("id, slug, name")
    .eq("slug", "sultan-restaurant")
    .single();
  if (findError || !restaurant) {
    console.error("Sultan Restaurant not found:", findError?.message);
    process.exit(1);
  }

  const { error: updateError } = await supabase
    .from("restaurants")
    .update({ ordering_enabled: true, products_delivery_enabled: true })
    .eq("id", restaurant.id);
  if (updateError) {
    console.error("Enabling ordering failed:", updateError.message);
    process.exit(1);
  }

  await supabase.from("products").delete().eq("listing_type", "restaurant").eq("listing_id", restaurant.id).eq("name", "Burger");

  const { error: insertError } = await supabase.from("products").insert({
    listing_type: "restaurant",
    listing_id: restaurant.id,
    name: "Burger",
    description: "Test product for verifying the universal cart/checkout flow end-to-end. Replace with Sultan Restaurant's real menu.",
    category: "Mains",
    price: 5,
    currency: "USD",
    is_available: true,
    is_featured: false,
    is_hidden: false,
    sort_order: 1,
  });
  if (insertError) {
    console.error("Product insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`✔ Ordering enabled for ${restaurant.name} (${restaurant.slug}) with 1 test product ("Burger", $5).`);
}

main();
