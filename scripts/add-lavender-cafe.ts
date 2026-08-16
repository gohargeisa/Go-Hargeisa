import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * One-off insert for Lavender — a real café/flower-shop in Hargeisa
 * ("Lavender — Café / Flower Shop — and every moment blooms"). Café side
 * (coffee, brunch, cakes) is represented by the existing menu_pdf_url
 * mechanism (the real menu PDF supplied by the owner); the flower side is
 * the 12 real bouquets from the owner's price-list flyer, inserted into the
 * polymorphic `products` table added by
 * 20260822000001_cafe_flowers_and_products_upgrade.sql (that migration is
 * already applied — cafes.sells_flowers/flower_addons exist live).
 *
 * Source assets (flyer + menu PDF) live at
 * C:/Users/YASEEN/OneDrive/Desktop/Lavender/ and are cropped/uploaded by
 * this script — see the crop coordinates verified against a grid overlay
 * of the flyer before this script was written.
 *
 * Idempotent: cafe row upserts on slug; products/addons use fixed ids so
 * re-running never duplicates rows. Images upload once (Supabase Storage
 * has no upsert-by-content-hash), so re-running re-uploads and rewrites
 * the URLs — harmless, just leaves the previous run's files orphaned.
 *
 * Run: npx tsx scripts/add-lavender-cafe.ts
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const ASSET_DIR =
  "C:/Users/YASEEN/AppData/Local/Temp/claude/C--Projects-go-hargeisa/9c590df9-cec6-4a19-9b3f-3d364de35ad8/scratchpad/lavender";
const MENU_PDF = "C:/Users/YASEEN/OneDrive/Desktop/Lavender/Lavender Menu last.pdf";

async function uploadFile(localPath: string, folder: string, contentType: string): Promise<string> {
  const ext = path.extname(localPath);
  const objectPath = `${folder}/${crypto.randomUUID()}${ext}`;
  const buffer = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from("listing-images").upload(objectPath, buffer, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Upload failed for ${localPath}: ${error.message}`);
  const { data } = supabase.storage.from("listing-images").getPublicUrl(objectPath);
  return data.publicUrl;
}

const ADDON_GYPSOPHILA = "ff5b7b53-7299-49f3-b3ef-c0a0e2acf50e";
const ADDON_WRAPPING = "ca201013-46b0-493d-bff2-2fa1169e505e";
const ADDON_CARD = "1fde9eae-1801-4f36-9ed5-bab8b64fa93d";

const BOUQUET_DESC = "Fresh red roses styled with gypsophila, wrapped in elegant black paper.";
const BOUQUET_DESC_AR = "ورود حمراء طازجة مع جيبسوفيليا، ملفوفة بورق أسود أنيق.";
const BOUQUET_DESC_SO = "Ubax cas oo cusub oo lagu daboolay warqad madow oo qurux badan.";
const BOX_DESC = "Fresh red roses arranged in a premium round box, finished with a satin ribbon.";
const BOX_DESC_AR = "ورود حمراء طازجة مرتبة في صندوق دائري فاخر، مزين بشريط ساتان.";
const BOX_DESC_SO = "Ubax cas oo cusub oo lagu qaabeeyay sanduuq wanaagsan, oo lagu qurxiyay xariir.";

const PRODUCTS = [
  {
    id: "8f1a561b-4c1c-45f6-85dc-389f061a88d6",
    name: "1 Red Rose",
    nameAr: "وردة حمراء واحدة",
    nameSo: "Ubax Guduud Kali ah",
    price: 2,
    image: "01_1_red_rose.jpg",
    sortOrder: 1,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "6846543a-6bb0-4219-9ac3-db0e80ce6bf4",
    name: "3 Roses Bouquet",
    nameAr: "باقة 3 ورود",
    nameSo: "Buundo 3 Ubax ah",
    price: 6,
    image: "02_3_roses.jpg",
    sortOrder: 2,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "a51dfe47-e144-45e2-829d-27d5d3e42d2a",
    name: "5 Roses Bouquet",
    nameAr: "باقة 5 ورود",
    nameSo: "Buundo 5 Ubax ah",
    price: 10,
    image: "03_5_roses.jpg",
    sortOrder: 3,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "7dc9e98e-6e0e-41ff-867e-2d7d46eb3c0d",
    name: "10 Roses",
    nameAr: "10 ورود",
    nameSo: "10 Ubax",
    price: 20,
    image: "04_10_roses.jpg",
    sortOrder: 4,
    featured: true,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "fd7de29d-ea2c-448a-bdb5-082b36f98afe",
    name: "15 Roses",
    nameAr: "15 وردة",
    nameSo: "15 Ubax",
    price: 30,
    image: "05_15_roses.jpg",
    sortOrder: 5,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "afe03a03-869a-406c-bb35-d6c681a5f7a7",
    name: "20 Roses",
    nameAr: "20 وردة",
    nameSo: "20 Ubax",
    price: 40,
    image: "06_20_roses.jpg",
    sortOrder: 6,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "49e9a3de-7c11-4e95-afbf-d94dc9d82ec1",
    name: "Heart Shape (20 Roses)",
    nameAr: "باقة على شكل قلب (20 وردة)",
    nameSo: "Ubax Qaab Wadne ah (20 Ubax)",
    price: 45,
    image: "07_heart_shape.jpg",
    sortOrder: 7,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "18898ffe-761c-4898-a666-8ee4aa667108",
    name: "Rose Box (25 Roses)",
    nameAr: "صندوق ورد (25 وردة)",
    nameSo: "Sanduuqa Ubaxa (25 Ubax)",
    price: 55,
    image: "08_rose_box.jpg",
    sortOrder: 8,
    desc: [BOX_DESC, BOX_DESC_AR, BOX_DESC_SO],
  },
  {
    id: "92c52db4-ab59-4433-b61f-c3bc46889931",
    name: "Luxury Box (50 Roses)",
    nameAr: "صندوق فاخر (50 وردة)",
    nameSo: "Sanduuq Qaali ah (50 Ubax)",
    price: 110,
    image: "09_luxury_box.jpg",
    sortOrder: 9,
    desc: [BOX_DESC, BOX_DESC_AR, BOX_DESC_SO],
  },
  {
    id: "1a5a6f1d-4589-49fd-abd7-3584c3872cef",
    name: "25 Roses",
    nameAr: "25 وردة",
    nameSo: "25 Ubax",
    price: 50,
    image: "10_25_roses.jpg",
    sortOrder: 10,
    featured: true,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "ba4ce00a-7a37-43c8-a256-6f64d8cf5584",
    name: "30 Roses",
    nameAr: "30 وردة",
    nameSo: "30 Ubax",
    price: 60,
    image: "11_30_roses.jpg",
    sortOrder: 11,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
  {
    id: "ef2fecdd-9dda-44a8-a624-8550d5a2834e",
    name: "50 Roses",
    nameAr: "50 وردة",
    nameSo: "50 Ubax",
    price: 100,
    image: "12_50_roses.jpg",
    sortOrder: 12,
    desc: [BOUQUET_DESC, BOUQUET_DESC_AR, BOUQUET_DESC_SO],
  },
];

async function main() {
  console.log("Uploading images...");
  const heroUrl = await uploadFile(path.join(ASSET_DIR, "hero_check2.jpg"), "cafes", "image/jpeg");
  const productImageUrls = new Map<string, string>();
  for (const p of PRODUCTS) {
    const uploaded = await uploadFile(path.join(ASSET_DIR, p.image), "products", "image/jpeg");
    productImageUrls.set(p.id, uploaded);
    console.log(`  ${p.name} -> ${uploaded}`);
  }

  console.log("Upserting cafe row...");
  const cafeRow = {
    slug: "lavender",
    name: "Lavender",
    short_description: "Café and flower shop in Hargeisa — coffee, brunch, cakes, and fresh rose bouquets.",
    description:
      "Lavender is a café and flower shop in Hargeisa — \"and every moment blooms.\" Alongside specialty coffee, brunch bites, and celebration cakes, Lavender hand-crafts fresh rose bouquets, boxed arrangements, and gift flowers for every occasion, with delivery available across Hargeisa.",
    description_ar:
      "لافندر هو مقهى ومحل أزهار في هرجيسا — \"وكل لحظة تُزهر\". إلى جانب القهوة المختصة ووجبات البرانش وكعكات الاحتفالات، يصنع لافندر باقات ورد طازجة وترتيبات في صناديق وهدايا زهور لكل مناسبة، مع توفر التوصيل في جميع أنحاء هرجيسا.",
    description_so:
      "Lavender waa maqaaxi iyo dukaan ubax ah oo ku yaal Hargeysa — \"wakhti kastaa wuu ubaxaa\". Marka lala barbar dhigo qaxwo tayo sare leh, cunto brunch ah, iyo keega xafladaha, Lavender waxay gacanta ku sameysaa buundooyin ubax cusub, qaabab sanduuq ah, iyo hadiyado ubax ah munaasabad kasta, iyada oo gaarsiin lagu heli karo Hargeysa oo dhan.",
    cover_image: heroUrl,
    gallery: [{ url: heroUrl, alt: "Lavender signature red rose bouquet", category: "other" }],
    address: "Hargeisa, Somaliland",
    // Approximate Hargeisa city-center coordinates — the owner didn't supply
    // an exact pin (neither the flyer nor the menu PDF has one); correct
    // this once the real GPS location is available.
    lat: 9.5624,
    lng: 44.065,
    rating: 5,
    review_count: 0,
    phone: null,
    special_drinks: ["Specialty Coffee", "Matcha", "Smoothies", "Milkshakes", "Mojito Mocktails"],
    wifi: false,
    working_space: false,
    opening_hours: null,
    price_range: "$$",
    amenities: ["indoor_seating", "takeaway", "delivery", "breakfast", "cash_accepted"],
    social_instagram: "lavenderflowers_sl",
    social_facebook: null,
    menu: [],
    menu_pdf_url: await uploadFile(MENU_PDF, "cafes", "application/pdf"),
    featured: true,
    status: "published",
    sells_flowers: true,
    flower_addons: [
      { id: ADDON_GYPSOPHILA, name: "Extra Gypsophila", nameAr: "جيبسوفيليا إضافية", nameSo: "Ubax Dheeraad ah", price: 3 },
      { id: ADDON_WRAPPING, name: "Premium Wrapping", nameAr: "تغليف فاخر", nameSo: "Xirid Qaali ah", price: 2 },
      { id: ADDON_CARD, name: "Message Card", nameAr: "بطاقة رسالة", nameSo: "Kaadhka Fariinta", price: 0 },
    ],
    products_delivery_enabled: true,
  };

  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .upsert(cafeRow, { onConflict: "slug" })
    .select("id, slug")
    .single();
  if (cafeError) {
    console.error("Cafe upsert failed:", cafeError.message);
    process.exit(1);
  }
  console.log(`Cafe live: id=${cafe.id} slug=${cafe.slug}`);

  console.log("Upserting products...");
  const productRows = PRODUCTS.map((p) => ({
    id: p.id,
    listing_type: "cafe",
    listing_id: cafe.id,
    name: p.name,
    name_ar: p.nameAr,
    name_so: p.nameSo,
    description: p.desc[0],
    description_ar: p.desc[1],
    description_so: p.desc[2],
    price: p.price,
    currency: "USD",
    image: productImageUrls.get(p.id),
    gallery: [],
    is_available: true,
    is_featured: Boolean(p.featured),
    is_hidden: false,
    sort_order: p.sortOrder,
  }));

  const { error: productsError } = await supabase.from("products").upsert(productRows, { onConflict: "id" });
  if (productsError) {
    console.error("Products upsert failed:", productsError.message);
    process.exit(1);
  }
  console.log(`✔ Lavender is live with ${productRows.length} products: id=${cafe.id} slug=${cafe.slug}`);
}

main();
