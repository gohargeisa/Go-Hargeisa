import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * One-off insert for Lavender's real café menu — every drink/bite/dessert
 * item transcribed from the owner's actual menu PDF ("Lavender Menu
 * last.pdf"), extracted via `pdftotext -layout` and cross-checked line by
 * line. Categories match the PDF's own section headers. Prices are exactly
 * what's printed — where the PDF gives one price for a whole group under a
 * heading (e.g. "MILKSHAKES $3"), every item in that group gets that price;
 * where an individual item in a mixed list has no price printed at all
 * (most of Hot Coffee / Iced Coffee / Smoothies), price is left null rather
 * than invented — the product UI already renders "Ask about price" for
 * that case. One typo was silently normalized: "Iced Macha" under the
 * (coffee) ICED COFFEE heading is "Iced Mocha" (a chocolate-coffee drink,
 * matching "Mocha Frappuccino"/"Mocha Coffee"/"Mocha Milkshake" elsewhere in
 * the same menu) — Iced Matcha already has its own dedicated section above
 * it, so a second, differently-priced "Iced Matcha" under Iced Coffee would
 * be a duplicate, not a distinct product.
 *
 * Does NOT require any migration. The live products.category CHECK
 * constraint only allows Perfume/Cosmetics/Flower vocabulary (verified live:
 * inserting category='Hot Drinks' throws "violates check constraint
 * products_category_check"), so every row here is inserted with
 * category = null and grouped for display positionally, by sort_order —
 * see lib/config/lavender-menu-sections.ts for the full explanation and the
 * section list this script's insert order must keep matching.
 *
 * Idempotent: deletes this cafe's existing non-flower products (category !=
 * 'bouquet', so the 12 flower products from add-lavender-cafe.ts are never
 * touched) before inserting, so re-running never duplicates rows.
 *
 * Run: npx tsx scripts/add-lavender-menu-items.ts
 */
import { createClient } from "@supabase/supabase-js";
import { LAVENDER_MENU_SORT_ORDER_BASE, LAVENDER_MENU_SECTIONS } from "../lib/config/lavender-menu-sections";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

interface MenuItem {
  category: string;
  name: string;
  price: number | null;
  description?: string;
  priceNote?: string;
}

const HOT_DRINKS: MenuItem[] = [
  { category: "Hot Drinks", name: "Hot Chocolate", price: 2, description: "A classic favorite made with rich cocoa and steamed milk, delivering a deep, chocolatey flavor that's warm, satisfying, and timeless in every sip." },
  { category: "Hot Drinks", name: "White Hot Chocolate", price: 2, description: "A smooth and velvety blend of melted white chocolate and steamed milk, creating a rich, creamy drink with a delicate sweetness." },
  { category: "Hot Drinks", name: "Retinol Juice", price: 3, description: "High in beta-carotene, which acts as a precursor to Vitamin A (often referred to as \"natural retinol\"), helping with skin cell turnover and reducing acne." },
  { category: "Hot Drinks", name: "Beetroot Blend", price: 3, description: "Beetroot juice is rich in iron, vitamin C, calcium & antioxidants. It lowers blood pressure, detoxes, and boosts your immune system." },
];

const TEA: MenuItem[] = [
  { category: "Tea", name: "Green Tea", price: 1 },
  { category: "Tea", name: "Mint Tea", price: 1 },
  { category: "Tea", name: "Somali Tea", price: 1 },
  { category: "Tea", name: "Dawa Tea", price: 1 },
];

const HOT_COFFEE: MenuItem[] = [
  { category: "Hot Coffee", name: "Espresso S/D", price: 2 },
  { category: "Hot Coffee", name: "Cappuccino", price: null },
  { category: "Hot Coffee", name: "Latte", price: null },
  { category: "Hot Coffee", name: "Spanish Latte", price: null },
  { category: "Hot Coffee", name: "Americano", price: null },
  { category: "Hot Coffee", name: "Flat White", price: null },
  { category: "Hot Coffee", name: "Matcha White", price: 2.5 },
  { category: "Hot Coffee", name: "Latte Macchiato", price: null },
  { category: "Hot Coffee", name: "Espresso Bomb", price: 2.5 },
  { category: "Hot Coffee", name: "Caramel Macchiato", price: null },
  { category: "Hot Coffee", name: "Vanilla Latte", price: null },
  { category: "Hot Coffee", name: "Caramel Latte", price: null },
  { category: "Hot Coffee", name: "Mocha Coffee", price: null },
];

const HOT_MATCHA: MenuItem[] = ["Matcha Latte", "Vanilla Matcha", "Caramel Matcha"].map((name) => ({
  category: "Hot Matcha",
  name,
  price: 2,
}));

const ICED_MATCHA: MenuItem[] = ["Iced Latte Matcha", "Iced Strawberry Matcha", "Iced Vanilla Matcha", "Iced Blueberry Matcha"].map((name) => ({
  category: "Iced Matcha",
  name,
  price: 3.5,
}));

const ICED_COFFEE: MenuItem[] = [
  { category: "Iced Coffee", name: "Iced Latte", price: null },
  { category: "Iced Coffee", name: "Iced Americano", price: null },
  { category: "Iced Coffee", name: "Iced Cappuccino", price: 3 },
  { category: "Iced Coffee", name: "Iced Frappuccino", price: null },
  { category: "Iced Coffee", name: "Iced Coffee", price: null },
  { category: "Iced Coffee", name: "Iced Mocha", price: null },
  { category: "Iced Coffee", name: "Iced Caramel Latte", price: null },
  { category: "Iced Coffee", name: "Iced Vanilla Latte", price: null },
];

const SMOOTHIES: MenuItem[] = [
  { category: "Smoothies", name: "Mango Smoothie", price: null },
  { category: "Smoothies", name: "Banana Smoothie", price: null },
  { category: "Smoothies", name: "Strawberry Smoothie", price: 3 },
  { category: "Smoothies", name: "Pistachio Smoothie", price: null },
  { category: "Smoothies", name: "Passion Smoothie", price: null },
  { category: "Smoothies", name: "Raspberry Smoothie", price: null },
  { category: "Smoothies", name: "Blueberry Smoothie", price: null },
  { category: "Smoothies", name: "Pineapple/Ananas Smoothie", price: null },
];

const MILKSHAKE_FLAVORS = [
  "Blueberry", "Vanilla", "Strawberry", "Chocolate", "Oreo", "Lotus",
  "Raspberry", "Espresso", "Mocha", "Mixed", "Passion", "Mango",
];
const MILKSHAKES: MenuItem[] = MILKSHAKE_FLAVORS.map((f) => ({ category: "Milkshakes", name: `${f} Milkshake`, price: 3 }));

// The PDF's mocktail list reuses the milkshake flavor names verbatim under
// a "MOJITO - MOCKTAILS" heading — transcribed exactly as printed (a
// labeling quirk in the source menu, not something this script invents).
const MOJITO_MOCKTAILS: MenuItem[] = MILKSHAKE_FLAVORS.map((f) => ({ category: "Mojito Mocktails", name: `${f} Mojito Mocktail`, price: 2.5 }));

const FRAPPUCCINO: MenuItem[] = ["Mocha Frappuccino", "Caramel Frappuccino", "Passion Frappe", "Mango Frappe", "Pineapple Frappe", "Blueberry Frappe"].map(
  (name) => ({ category: "Frappuccino", name, price: 2.5 })
);

const BRUNCH_BITES: MenuItem[] = [
  { category: "Brunch & Bites", name: "Beer/Suqaar", price: 4 },
  { category: "Brunch & Bites", name: "Shakshuuka (Eggs)", price: 3.5 },
  { category: "Brunch & Bites", name: "Fluffy Laxoox", price: 3 },
  { category: "Brunch & Bites", name: "French Toast", price: 3.5 },
  { category: "Brunch & Bites", name: "Pancakes", price: 3.5 },
  { category: "Brunch & Bites", name: "Cambaabur", price: 3.5 },
];

const WRAPS: MenuItem[] = ["Beef Wrap", "Chicken Wrap", "Meat Wrap"].map((name) => ({ category: "Wraps", name, price: 3 }));

const DESSERTS: MenuItem[] = [
  { category: "Desserts", name: "Crepe", price: 4.5 },
  { category: "Desserts", name: "Waffles", price: 4.5 },
  { category: "Desserts", name: "Pudding (Lotus/Oreo/Chocolate/Strawberry)", price: 2 },
];

const CAKE_SLICES: MenuItem[] = [
  { category: "Cakes (Slices)", name: "Matilda Cake (Chocolate)", price: 3.5 },
  { category: "Cakes (Slices)", name: "Fruit Cake / Date Cake", price: 1.5 },
  { category: "Cakes (Slices)", name: "White Forest Cake (Vanilla)", price: 2.5 },
  { category: "Cakes (Slices)", name: "Strawberry Cake", price: 2.5 },
  { category: "Cakes (Slices)", name: "Pistachio Cake", price: 2.5 },
  { category: "Cakes (Slices)", name: "Caramel Cake", price: 2.5 },
  { category: "Cakes (Slices)", name: "Cheese Cake", price: 3.5 },
];

const FULL_CAKES: MenuItem[] = [
  { category: "Full Cakes", name: "Matilda Cake (Chocolate) — Full", price: 35 },
  { category: "Full Cakes", name: "White Forest Cake (Vanilla) — Full", price: 25 },
  { category: "Full Cakes", name: "Strawberry Cake — Full", price: 25 },
  { category: "Full Cakes", name: "Pistachio Cake — Full", price: 25 },
  { category: "Full Cakes", name: "Caramel Cake — Full", price: 25 },
  { category: "Full Cakes", name: "Cheese Cake — Full", price: 35 },
];

const WEDDING_CAKES: MenuItem[] = [
  { category: "Wedding Cakes", name: "One Tier Cake", price: 50 },
  { category: "Wedding Cakes", name: "Two Tier Cake", price: 100 },
  { category: "Wedding Cakes", name: "Three Tier Cake", price: 150 },
  { category: "Wedding Cakes", name: "Dessert Decoration with Cakes", price: 70 },
];

const MINI_CAKES: MenuItem[] = [
  { category: "Mini Cakes", name: "Custom Mini Cake", price: 15 },
  { category: "Mini Cakes", name: "One-Tier Birthday Cake", price: 25 },
  { category: "Mini Cakes", name: "Two-Tier Birthday Cake", price: null, priceNote: "$35–$45, depending on the design" },
];

const SECTIONS: { label: string; items: MenuItem[] }[] = [
  { label: "Hot Drinks", items: HOT_DRINKS },
  { label: "Tea", items: TEA },
  { label: "Hot Coffee", items: HOT_COFFEE },
  { label: "Hot Matcha", items: HOT_MATCHA },
  { label: "Iced Matcha", items: ICED_MATCHA },
  { label: "Iced Coffee", items: ICED_COFFEE },
  { label: "Smoothies", items: SMOOTHIES },
  { label: "Milkshakes", items: MILKSHAKES },
  { label: "Mojito Mocktails", items: MOJITO_MOCKTAILS },
  { label: "Frappuccino", items: FRAPPUCCINO },
  { label: "Brunch & Bites", items: BRUNCH_BITES },
  { label: "Wraps", items: WRAPS },
  { label: "Desserts", items: DESSERTS },
  { label: "Cakes (Slices)", items: CAKE_SLICES },
  { label: "Full Cakes", items: FULL_CAKES },
  { label: "Wedding Cakes", items: WEDDING_CAKES },
  { label: "Mini Cakes", items: MINI_CAKES },
];

const ALL_ITEMS: MenuItem[] = SECTIONS.flatMap((s) => s.items);

async function main() {
  // Defensive self-check: lib/config/lavender-menu-sections.ts's counts are
  // hand-duplicated from these arrays (see that file's header comment) —
  // fail loudly instead of silently mis-grouping the menu if they ever drift.
  const expected = LAVENDER_MENU_SECTIONS;
  if (expected.length !== SECTIONS.length) {
    throw new Error(`Section count mismatch: script has ${SECTIONS.length}, lavender-menu-sections.ts has ${expected.length}`);
  }
  for (let i = 0; i < SECTIONS.length; i++) {
    if (SECTIONS[i].label !== expected[i].label || SECTIONS[i].items.length !== expected[i].count) {
      throw new Error(
        `Section mismatch at index ${i}: script has "${SECTIONS[i].label}" (${SECTIONS[i].items.length}), ` +
          `lavender-menu-sections.ts has "${expected[i].label}" (${expected[i].count})`
      );
    }
  }

  const { data: cafe, error: cafeError } = await supabase.from("cafes").select("id").eq("slug", "lavender").single();
  if (cafeError || !cafe) {
    console.error("Lavender cafe not found — run scripts/add-lavender-cafe.ts first.", cafeError?.message);
    process.exit(1);
  }

  console.log(`Removing previous menu items for cafe ${cafe.id}...`);
  // Café menu items are always inserted with category = null (the flowers
  // from add-lavender-cafe.ts are the only rows with a real category,
  // 'bouquet') — .is("category", null) targets exactly this script's own
  // rows and nothing else, safe to re-run. (.neq() would silently miss
  // null-category rows: `NULL <> 'bouquet'` is NULL, not true, in SQL.)
  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("listing_type", "cafe")
    .eq("listing_id", cafe.id)
    .is("category", null);
  if (deleteError) {
    console.error("Delete failed:", deleteError.message);
    process.exit(1);
  }

  const rows = ALL_ITEMS.map((item, i) => ({
    listing_type: "cafe",
    listing_id: cafe.id,
    name: item.name,
    description: item.description ?? item.priceNote ?? null,
    category: null as string | null,
    price: item.price,
    currency: "USD",
    is_available: true,
    is_featured: false,
    is_hidden: false,
    sort_order: LAVENDER_MENU_SORT_ORDER_BASE + i,
  }));

  const { error: insertError } = await supabase.from("products").insert(rows);
  if (insertError) {
    console.error("Insert failed:", insertError.message);
    process.exit(1);
  }

  console.log(`✔ Inserted ${rows.length} café menu items for Lavender.`);
  const missingPrice = ALL_ITEMS.filter((i) => i.price == null).length;
  console.log(`  (${missingPrice} items have no printed price in the source PDF — saved as "Ask about price".)`);
}

main();
