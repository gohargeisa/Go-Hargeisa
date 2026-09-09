/**
 * Seeds Excellence Café's real, verified menu (lib/data/excellence-cafe-
 * menu-seed.ts) into the `products`/`product_options` tables, against the
 * restaurant row created by
 * supabase/migrations/20260910000001_excellence_cafe_listing.sql.
 *
 * Run after that migration has been applied:
 *
 *   npx tsx scripts/seed-excellence-cafe-menu.ts          (dry run — no writes)
 *   npx tsx scripts/seed-excellence-cafe-menu.ts --apply  (writes for real)
 *
 * Safe to re-run: skips entirely if this restaurant already has any
 * products, so it can't create duplicates.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { EXCELLENCE_CAFE_MENU, EXCELLENCE_CAFE_MENU_ITEM_COUNT } from "../lib/data/excellence-cafe-menu-seed";

const APPLY = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

async function main() {
  console.log(`Excellence Café menu: ${EXCELLENCE_CAFE_MENU.length} categories, ${EXCELLENCE_CAFE_MENU_ITEM_COUNT} items.`);
  if (!APPLY) {
    console.log("Dry run — pass --apply to write. Preview:");
    for (const cat of EXCELLENCE_CAFE_MENU) {
      console.log(`  ${cat.category} (${cat.items.length})`);
    }
    return;
  }

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", "excellence-cafe")
    .maybeSingle();
  if (restaurantError || !restaurant) throw new Error(`Restaurant not found: ${restaurantError?.message ?? "no row for slug excellence-cafe"}`);

  const { count: existing } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("listing_type", "restaurant")
    .eq("listing_id", restaurant.id);
  if (existing && existing > 0) {
    console.log(`↷ Skipped — ${existing} products already exist for Excellence Café`);
    return;
  }

  let sortOrder = 0;
  let productsInserted = 0;
  let optionsInserted = 0;

  for (const cat of EXCELLENCE_CAFE_MENU) {
    for (const item of cat.items) {
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          listing_type: "restaurant",
          listing_id: restaurant.id,
          name: item.name,
          category: cat.category,
          price: item.price,
          currency: "USD",
          is_available: true,
          is_featured: false,
          is_hidden: false,
          sort_order: sortOrder++,
        })
        .select("id")
        .single();
      if (error || !product) {
        console.error("Failed to insert", item.name, error?.message);
        continue;
      }
      productsInserted++;

      for (const [optIndex, option] of (item.options ?? []).entries()) {
        const { error: optErr } = await supabase.from("product_options").insert({
          product_id: product.id,
          key: option.key,
          label: option.label,
          type: "select",
          required: true,
          price_delta: 0,
          choices: option.choices,
          sort_order: optIndex,
        });
        if (optErr) console.error("Failed to insert option for", item.name, optErr.message);
        else optionsInserted++;
      }
    }
  }

  console.log(`✔ Inserted ${productsInserted} products, ${optionsInserted} option sets for Excellence Café`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
