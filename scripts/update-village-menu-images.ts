/**
 * Backfills `products.image` for The Village Hargeisa's already-seeded menu
 * (see scripts/seed-village-menu.ts, which inserted the 60 rows this reads
 * `image` values for from lib/data/village-menu-seed.ts).
 *
 * Every image is illustrative stock photography (Wikimedia Commons / Pexels
 * / Unsplash), sourced and verified separately — never an actual Village
 * Hargeisa photograph, since none exist that this project has rights to use
 * per-dish. See VillageMenuItem's `image` field doc comment.
 *
 * Scoped strictly to this one restaurant: every update is filtered by
 * `listing_type = 'restaurant'` AND `listing_id = <the-village-hargeisa's id>`
 * AND an exact name match, so it can never touch any other business's
 * products. Only sets `image` — never touches price, description, category,
 * options, or any other column. Safe to re-run (idempotent upsert-by-name).
 *
 *   npm run update:village-menu-images
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { VILLAGE_MENU } from "../lib/data/village-menu-seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

async function main() {
  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", "the-village-hargeisa")
    .maybeSingle();
  if (restaurantError || !restaurant) throw new Error(`Restaurant not found: ${restaurantError?.message}`);

  let updated = 0;
  let missingImage = 0;
  let notFound = 0;

  for (const cat of VILLAGE_MENU) {
    for (const item of cat.items) {
      if (!item.image) {
        missingImage++;
        console.warn(`↷ No image set for "${item.name}" — skipped`);
        continue;
      }

      const { data, error } = await supabase
        .from("products")
        .update({ image: item.image })
        .eq("listing_type", "restaurant")
        .eq("listing_id", restaurant.id)
        .eq("name", item.name)
        .select("id");

      if (error) {
        console.error(`Failed to update "${item.name}":`, error.message);
        continue;
      }
      if (!data || data.length === 0) {
        notFound++;
        console.warn(`⚠ No matching product row found for "${item.name}"`);
        continue;
      }
      updated++;
    }
  }

  console.log(`✔ Updated ${updated} product images. Missing image data: ${missingImage}. Not found in DB: ${notFound}.`);
}

main().catch((e) => {
  console.error("Update failed:", e);
  process.exit(1);
});
