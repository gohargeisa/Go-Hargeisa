// Mama & Baby Care — premium storefront redesign, catalog seed.
//
// Populates real `products` rows from the 40 real product photos processed
// by scripts/prepare-mama-baby-care-images.mjs (public/images/partners/
// mama-baby-care/<category>/*.jpg) — every name below describes only what
// is visibly photographed (garment type, print, visible brand tag); no
// price, size, stock, or material claim is invented anywhere. Per this
// redesign's brief, prices are never shown on this storefront, so every row
// is inserted with `price` left null on purpose (not "missing data" —
// deliberately unset, same as Flormar's photo-only entries used to be
// before this brief dropped price display for this partner specifically).
//
// Also updates the ONE existing real product row (id
// 877c8768-4b17-43ec-9bb8-4b6ab8eccedf, "Kids Black School Shoes (Melody)")
// to point at the newly-cropped clean photo (no visible $20 price stickers)
// instead of deleting/recreating it.
//
// Idempotent re-run: each new row's `sku` is a stable "mbc-<slug>" marker;
// re-running the script deletes-then-reinserts only rows carrying one of
// these markers, never touching the pre-existing school-shoes row or any
// other listing's products.
//
// Run modes:
//   node scripts/import-mama-baby-care-catalog.mjs           -> dry run (no writes)
//   node scripts/import-mama-baby-care-catalog.mjs --apply    -> writes to the DB
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const APPLY = process.argv.includes("--apply");

const envLines = fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => !l.trim().startsWith("#"));
const env = envLines.join("\n");
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const LISTING_TYPE = "city_service";
const MAMA_BABY_CARE_ID = "2e08220c-dc31-49b7-98d1-f22413fcadd0";
const EXISTING_SHOE_PRODUCT_ID = "877c8768-4b17-43ec-9bb8-4b6ab8eccedf";
const IMG_BASE = "/images/partners/mama-baby-care";

const KIDS_GENDER = "kids";

/** [slug, name, category, image, opts?] — opts: { brand, gender, featured, extraImages } */
const PRODUCTS = [
  // Baby clothing
  ["rainbow-pinafore-bodysuit-set", "Rainbow Pinafore Dress & Bodysuit Set", "baby_clothing", "baby-clothing/rainbow-pinafore-bodysuit-set.jpg", { brand: "H&M", gender: KIDS_GENDER }],
  ["dino-print-dungaree-set", "Dinosaur-Print Dungaree & Top Set", "baby_clothing", "baby-clothing/dino-print-dungaree-set.jpg", { brand: "F&F Baby Joy", gender: KIDS_GENDER }],
  ["giraffe-dungaree-set", "Giraffe-Applique Dungaree & T-Shirt Set", "baby_clothing", "baby-clothing/giraffe-dungaree-set.jpg", { gender: KIDS_GENDER, featured: true }],
  ["pink-bow-dress", "Pink Bow-Detail Baby Dress", "baby_clothing", "baby-clothing/pink-bow-dress.jpg", { gender: KIDS_GENDER }],

  // Kids clothing
  ["mint-floral-embroidered-dress", "Mint Striped Dress with Floral Embroidery", "kids_clothing", "kids-clothing/mint-floral-embroidered-dress.jpg", { gender: KIDS_GENDER }],
  ["blue-striped-dress", "Blue Striped Puff-Sleeve Dress", "kids_clothing", "kids-clothing/blue-striped-dress.jpg", { brand: "The Striped Cottage", gender: KIDS_GENDER }],
  ["boys-tropical-shirt-trouser-set", "Boys' Tropical Print Shirt & Trouser Set", "kids_clothing", "kids-clothing/boys-tropical-shirt-trouser-set.jpg", { brand: "MMK", gender: KIDS_GENDER }],
  ["boys-gamepad-shirt-shorts-set", "Boys' Graphic Shirt & Shorts Set", "kids_clothing", "kids-clothing/boys-gamepad-shirt-shorts-set.jpg", { gender: KIDS_GENDER }],
  ["girls-club-tshirt", "Girls Club Graphic T-Shirt", "kids_clothing", "kids-clothing/girls-club-tshirt.jpg", { gender: KIDS_GENDER }],
  ["boys-california-tshirt", "Boys' “California” Graphic T-Shirt", "kids_clothing", "kids-clothing/boys-california-tshirt.jpg", { gender: KIDS_GENDER }],
  ["mint-seashell-print-dress", "Mint Seashell & Starfish Print Dress", "kids_clothing", "kids-clothing/mint-seashell-print-dress.jpg", { gender: KIDS_GENDER, featured: true }],
  [
    "boys-palm-print-shirt-shorts-set",
    "Boys' Palm-Print Shirt & Shorts Set",
    "kids_clothing",
    "kids-clothing/boys-palm-print-shirt-shorts-set.jpg",
    {
      brand: "Mothercare",
      gender: KIDS_GENDER,
      featured: true,
      extraImages: ["kids-clothing/boys-palm-print-shirt-shorts-set-alt1.jpg", "kids-clothing/boys-palm-print-shirt-shorts-set-alt2.jpg"],
    },
  ],
  ["pastel-rainbow-striped-top", "Pastel Rainbow Striped Long-Sleeve Top", "kids_clothing", "kids-clothing/pastel-rainbow-striped-top.jpg", { gender: KIDS_GENDER }],
  ["yellow-rainbow-applique-top", "Yellow Rainbow Applique Long-Sleeve Top", "kids_clothing", "kids-clothing/yellow-rainbow-applique-top.jpg", { gender: KIDS_GENDER }],
  ["purple-floral-shirt-shorts-set", "Boys' Floral Shirt & Shorts Set", "kids_clothing", "kids-clothing/purple-floral-shirt-shorts-set.jpg", { brand: "Purple Bloom", gender: KIDS_GENDER }],
  ["rolling-stones-sweatshirt-legging-set", "Graphic Sweatshirt & Legging Set", "kids_clothing", "kids-clothing/rolling-stones-sweatshirt-legging-set.jpg", { brand: "The Rolling Stones", gender: KIDS_GENDER }],
  ["yellow-leaf-print-shirt", "Boys' Leaf-Print Short-Sleeve Shirt", "kids_clothing", "kids-clothing/yellow-leaf-print-shirt.jpg", { gender: KIDS_GENDER }],
  ["bench-tshirt-shorts-set", "Boys' T-Shirt & Shorts Set", "kids_clothing", "kids-clothing/bench-tshirt-shorts-set.jpg", { brand: "Bench", gender: KIDS_GENDER }],
  ["pink-striped-bow-dress", "Pink Striped Dress with Bow Detail", "kids_clothing", "kids-clothing/pink-striped-bow-dress.jpg", { gender: KIDS_GENDER }],
  ["pink-top-denim-pinafore-set", "Pink Top & Denim Pinafore Dress Set", "kids_clothing", "kids-clothing/pink-top-denim-pinafore-set.jpg", { gender: KIDS_GENDER }],
  ["floral-tiered-maxi-dress", "Floral Tiered Maxi Dress", "kids_clothing", "kids-clothing/floral-tiered-maxi-dress.jpg", { gender: KIDS_GENDER, featured: true }],
  ["mint-linen-belted-dress", "Mint Linen Belted Dress", "kids_clothing", "kids-clothing/mint-linen-belted-dress.jpg", { brand: "Azza Elegance", gender: KIDS_GENDER }],

  // Shoes
  ["blue-strap-sandal", "Blue Strap Sandal", "shoes", "shoes/blue-strap-sandal.jpg", { gender: KIDS_GENDER }],
  ["grey-strap-sandal", "Grey Strap Sandal", "shoes", "shoes/grey-strap-sandal.jpg", { gender: KIDS_GENDER }],
  ["strappy-sandals-multicolor", "Strappy Sandals (Multiple Colours)", "shoes", "shoes/strappy-sandals-multicolor.jpg", { brand: "Lipar", gender: KIDS_GENDER, featured: true }],

  // Accessories
  ["purple-flower-headband", "Purple Flower Headband", "accessories", "accessories/purple-flower-headband.jpg", { featured: true }],
  ["olive-bow-headband", "Olive Bow Headband", "accessories", "accessories/olive-bow-headband.jpg", {}],

  // Baby essentials
  ["healthpoint-nappy-ointment", "Nappy Ointment with Vitamin B5", "baby_essentials", "baby-essentials/healthpoint-nappy-ointment.jpg", { brand: "Healthpoint" }],
  ["tommee-tippee-teats", "Baby Bottle Teats (2-Pack)", "baby_essentials", "baby-essentials/tommee-tippee-teats.jpg", { brand: "Tommee Tippee" }],
  ["bonjela-teething-gel", "Soothing Teething Gel", "baby_essentials", "baby-essentials/bonjela-teething-gel.jpg", { brand: "Bonjela" }],
  ["tommee-tippee-bottles", "Baby Feeding Bottle Set", "baby_essentials", "baby-essentials/tommee-tippee-bottles.jpg", { brand: "Tommee Tippee", featured: true }],
  ["mothercare-bath-trio", "Baby Shampoo, Lotion & Oil Set", "baby_essentials", "baby-essentials/mothercare-bath-trio.jpg", { brand: "Mothercare" }],
  ["colief-baby-scalp-oil", "Baby Scalp Oil", "baby_essentials", "baby-essentials/colief-baby-scalp-oil.jpg", { brand: "Colief" }],
  ["my-little-miracle-talc", "Super Fast Liquid Talc", "baby_essentials", "baby-essentials/my-little-miracle-talc.jpg", { brand: "My Little Miracle" }],
  ["baby-dove-lotion", "Sensitive Skin Care Lotion", "baby_essentials", "baby-essentials/baby-dove-lotion.jpg", { brand: "Baby Dove" }],

  // Gifts
  ["miss-so-perfume-mist", "Perfume Body Mist", "gifts", "gifts/miss-so-perfume-mist.jpg", { brand: "Miss So...?" }],
  ["zahoor-al-khabeej-air-freshener", "Home Air Freshener", "gifts", "gifts/zahoor-al-khabeej-air-freshener.jpg", { brand: "Zahoor Al Khabeej" }],
];

function toRow([slug, name, category, image, opts = {}], sortOrder) {
  return {
    listing_type: LISTING_TYPE,
    listing_id: MAMA_BABY_CARE_ID,
    sku: `mbc-${slug}`,
    name,
    category,
    brand: opts.brand ?? null,
    gender: opts.gender ?? null,
    price: null,
    image: `${IMG_BASE}/${image}`,
    gallery: (opts.extraImages ?? []).map((rel) => ({ url: `${IMG_BASE}/${rel}`, alt: name })),
    is_available: true,
    is_featured: !!opts.featured,
    is_hidden: false,
    sort_order: sortOrder,
  };
}

async function run() {
  const rows = PRODUCTS.map((p, i) => toRow(p, (i + 1) * 10));

  console.log(`Prepared ${rows.length} product rows for Mama & Baby Care (listing ${MAMA_BABY_CARE_ID}).`);
  console.log("Categories:", [...new Set(rows.map((r) => r.category))].join(", "));
  console.log("Featured:", rows.filter((r) => r.is_featured).map((r) => r.name).join(", "));

  if (!APPLY) {
    console.log("\nDry run only — pass --apply to write to the database.");
    return;
  }

  console.log("\n=== APPLYING to production ===");

  // 1. Update the one existing real product to the newly-cropped clean photo.
  const { error: updateErr } = await sb
    .from("products")
    .update({ image: `${IMG_BASE}/shoes/black-school-mary-jane.jpg`, category: "shoes", gender: KIDS_GENDER, is_featured: true })
    .eq("id", EXISTING_SHOE_PRODUCT_ID);
  if (updateErr) throw new Error("Existing product update failed: " + updateErr.message);
  console.log("Updated existing product (school shoes) with cropped photo.");

  // 2. Idempotent delete of any prior run's rows (matched by our own sku marker), then insert.
  const skus = rows.map((r) => r.sku);
  const { error: delErr } = await sb
    .from("products")
    .delete()
    .eq("listing_type", LISTING_TYPE)
    .eq("listing_id", MAMA_BABY_CARE_ID)
    .in("sku", skus);
  if (delErr) throw new Error("Cleanup delete failed: " + delErr.message);

  const CHUNK = 25;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { data, error } = await sb.from("products").insert(chunk).select("id");
    if (error) throw new Error("Insert failed at chunk " + i + ": " + error.message);
    inserted += data.length;
  }
  console.log(`Inserted ${inserted} new products.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
