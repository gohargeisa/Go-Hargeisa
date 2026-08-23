/**
 * Seeds The Village Hargeisa's real, supplied menu (lib/data/village-menu-
 * seed.ts) into the `products`/`product_options` tables.
 *
 * DO NOT RUN YET: as of 2026-09-03 this fails against production because
 * `products.category` still carries a check constraint that only allows
 * cosmetics/perfume/flower categories (added by
 * 20260903000003_products_kids_clothing_category.sql, regressing what
 * 20260823000002_universal_cart_orders.sql had already documented as
 * intentionally free-text). Apply
 * supabase/migrations/20260903000004_products_category_free_text.sql to
 * production first — see that file for exactly what it does. Once applied:
 *
 *   npm run seed:village-menu
 *
 * Safe to re-run: skips entirely if this restaurant already has any
 * products, so it can't create duplicates.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { VILLAGE_MENU, VILLAGE_MENU_OPTION_DEFS } from "../lib/data/village-menu-seed";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, serviceKey);

async function main() {
  const { data: restaurant, error: restaurantError } = await supabase.from("restaurants").select("id").eq("slug", "the-village-hargeisa").maybeSingle();
  if (restaurantError || !restaurant) throw new Error(`Restaurant not found: ${restaurantError?.message}`);

  const { count: existing } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("listing_type", "restaurant")
    .eq("listing_id", restaurant.id);
  if (existing && existing > 0) {
    console.log(`↷ Skipped — ${existing} products already exist for The Village Hargeisa`);
    return;
  }

  let sortOrder = 0;
  let productsInserted = 0;
  let optionsInserted = 0;

  for (const cat of VILLAGE_MENU) {
    for (const item of cat.items) {
      const { data: product, error } = await supabase
        .from("products")
        .insert({
          listing_type: "restaurant",
          listing_id: restaurant.id,
          name: item.name,
          description: item.description ?? null,
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

      if (item.option) {
        const def = VILLAGE_MENU_OPTION_DEFS[item.option];
        const { error: optErr } = await supabase.from("product_options").insert({
          product_id: product.id,
          key: def.key,
          label: def.label,
          type: "select",
          required: true,
          price_delta: 0,
          choices: def.choices,
          sort_order: 0,
        });
        if (optErr) console.error("Failed to insert option for", item.name, optErr.message);
        else optionsInserted++;
      }
    }
  }

  console.log(`✔ Inserted ${productsInserted} products, ${optionsInserted} option sets for The Village Hargeisa`);
}

main().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
