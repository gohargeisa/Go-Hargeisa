import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * One-off insert for the Beydan Coffee café (Wadaadiid Mall, Jigjiga Yar,
 * Hargeisa). Requires the 20260731000001_cafe_premium_fields.sql migration
 * to already be applied (description_ar/description_so/price_range/
 * amenities/social_instagram/social_facebook/opening_hours_structured
 * columns must exist on `cafes`) — run that migration in the Supabase SQL
 * Editor first, then: npx tsx scripts/add-beydan-coffee.ts
 *
 * Uses upsert on slug so it's safe to re-run.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const PLACEHOLDER = (label: string) =>
  `https://placehold.co/1200x800/1f2937/f5f5f4?text=${encodeURIComponent(label)}`;

async function main() {
  const row = {
    slug: "beydan-coffee",
    name: "Beydan Coffee",
    short_description: "Modern specialty café in Wadaadiid Mall on Jigjiga Yar, Hargeisa.",
    description:
      "Beydan Coffee is one of Hargeisa's modern cafés, offering specialty coffee, tea, refreshing drinks, desserts, and light meals in a stylish and welcoming atmosphere. Whether you're meeting friends, working remotely, or simply relaxing, Beydan Coffee provides a comfortable experience with excellent service.",
    description_ar:
      "يُعد Beydan Coffee من المقاهي العصرية في هرجيسا، ويقدم القهوة المختصة والشاي والمشروبات المنعشة والحلويات والوجبات الخفيفة في أجواء أنيقة ومريحة. سواء كنت ترغب في الاجتماع بالأصدقاء أو العمل عن بُعد أو الاسترخاء، فإن المقهى يوفر تجربة مميزة وخدمة ممتازة.",
    description_so:
      "Beydan Coffee waa maqaaxi casri ah oo ku taal Hargeysa, kana bixisa bun tayo sare leh, shaah, cabitaanno kala duwan, macmacaan iyo cunto fudud. Waa meel ku habboon shaqo, kulammo iyo nasasho.",
    cover_image: PLACEHOLDER("Beydan Coffee"),
    gallery: [
      { url: PLACEHOLDER("Beydan Coffee Interior"), alt: "Beydan Coffee interior seating", category: "indoor_seating" },
      { url: PLACEHOLDER("Beydan Coffee Drinks"), alt: "Specialty coffee at Beydan Coffee", category: "coffee" },
      { url: PLACEHOLDER("Beydan Coffee Desserts"), alt: "Desserts at Beydan Coffee", category: "desserts" },
    ],
    address: "Wadaadiid Mall, Jigjiga Yar, Hargeisa, Somaliland",
    lat: 9.562,
    lng: 44.0665,
    rating: 4.8,
    review_count: 0,
    phone: null,
    special_drinks: ["Specialty Coffee", "Tea", "Cold Drinks"],
    wifi: true,
    working_space: true,
    opening_hours: "Sat–Wed 7:00 AM–12:00 AM, Thu 7:00 AM–1:00 AM, Fri 8:00 AM–12:00 AM",
    opening_hours_structured: [
      { days: ["saturday", "sunday", "monday", "tuesday", "wednesday"], open: "07:00", close: "00:00" },
      { days: ["thursday"], open: "07:00", close: "01:00" },
      { days: ["friday"], open: "08:00", close: "00:00" },
    ],
    price_range: "$$",
    amenities: [
      "specialty_coffee",
      "tea",
      "cold_drinks",
      "desserts",
      "light_meals",
      "wifi",
      "indoor_seating",
      "outdoor_seating",
      "work_friendly",
      "takeaway",
      "card_payments",
    ],
    social_instagram: null,
    social_facebook: null,
    menu: [],
    menu_pdf_url: null,
    featured: true,
    status: "published",
  };

  const { data, error } = await supabase.from("cafes").upsert(row, { onConflict: "slug" }).select("id, slug").single();
  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }
  console.log(`✔ Beydan Coffee is live: id=${data.id} slug=${data.slug}`);
}

main();
