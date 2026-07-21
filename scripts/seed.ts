import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
/**
 * Seeds a connected Supabase project with the same sample data used by the
 * mock-data fallback (lib/mock-data.ts), so the live site looks identical
 * to local dev the moment you connect real keys.
 *
 * Usage:
 *   1. Fill in .env.local with NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY (service role is required to bypass RLS
 *      for seeding — never ship this key to the client).
 *   2. Run: npm run seed
 */
import { createClient } from "@supabase/supabase-js";
import { hotels, restaurants, cafes, attractions, events, articles } from "../lib/mock-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment. See .env.example."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function seedHotels() {
  const rows = hotels.map((h) => ({
    slug: h.slug,
    name: h.name,
    short_description: h.shortDescription,
    description: h.description,
    cover_image: h.coverImage,
    gallery: h.gallery,
    address: h.address,
    lat: h.location.lat,
    lng: h.location.lng,
    phone: h.phone,
    website: h.website,
    price_range: h.priceRange,
    amenities: h.amenities,
    rating: h.rating,
    review_count: h.reviewCount,
    featured: h.featured ?? false,
  }));
  const { error } = await supabase.from("hotels").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} hotels`);
}

async function seedRestaurants() {
  const rows = restaurants.map((r) => ({
    slug: r.slug,
    name: r.name,
    short_description: r.shortDescription,
    description: r.description,
    cover_image: r.coverImage,
    gallery: r.gallery,
    address: r.address,
    lat: r.location.lat,
    lng: r.location.lng,
    cuisine: r.cuisine,
    price_range: r.priceRange,
    opening_hours: r.openingHours,
    menu: r.menuHighlights,
    reservable: r.reservable,
    rating: r.rating,
    review_count: r.reviewCount,
    featured: r.featured ?? false,
  }));
  const { error } = await supabase.from("restaurants").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} restaurants`);
}

async function seedCafes() {
  const rows = cafes.map((c) => ({
    slug: c.slug,
    name: c.name,
    short_description: c.shortDescription,
    description: c.description,
    cover_image: c.coverImage,
    gallery: c.gallery,
    address: c.address,
    lat: c.location.lat,
    lng: c.location.lng,
    special_drinks: c.specialDrinks,
    wifi: c.wifi,
    working_space: c.workingSpace,
    opening_hours: c.openingHours,
    rating: c.rating,
    review_count: c.reviewCount,
    featured: c.featured ?? false,
  }));
  const { error } = await supabase.from("cafes").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} cafes`);
}

async function seedAttractions() {
  const rows = attractions.map((a) => ({
    slug: a.slug,
    name: a.name,
    short_description: a.shortDescription,
    description: a.description,
    cover_image: a.coverImage,
    gallery: a.gallery,
    address: a.address,
    lat: a.location.lat,
    lng: a.location.lng,
    history: a.history,
    best_time_to_visit: a.bestTimeToVisit,
    entry_fee: a.entryFee,
    visitor_tips: a.visitorTips,
    category: a.category,
    rating: a.rating,
    review_count: a.reviewCount,
    featured: a.featured ?? false,
  }));
  const { error } = await supabase.from("attractions").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} attractions`);
}

async function seedEvents() {
  const rows = events.map((e) => ({
    slug: e.slug,
    title: e.title,
    description: e.description,
    cover_image: e.coverImage,
    category: e.category,
    start_date: e.startDate,
    end_date: e.endDate,
    location: e.location,
    ticket_info: e.ticketInfo,
  }));
  const { error } = await supabase.from("events").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} events`);
}

async function seedArticles() {
  const rows = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    body: a.excerpt,
    cover_image: a.coverImage,
    category: a.category,
    read_minutes: a.readMinutes,
    published_at: a.publishedAt,
  }));
  const { error } = await supabase.from("articles").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} articles`);
}

async function main() {
  await seedHotels();
  await seedRestaurants();
  await seedCafes();
  await seedAttractions();
  await seedEvents();
  await seedArticles();
  console.log("\n🎉 Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
