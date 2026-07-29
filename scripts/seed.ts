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
import { hotels, restaurants, cafes, services, attractions, events, articles } from "../lib/mock-data";

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
    phone: r.phone,
    website: r.website,
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
    phone: c.phone,
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

async function seedServices() {
  const rows = services.map((s) => ({
    slug: s.slug,
    name: s.name,
    short_description: s.shortDescription,
    description: s.description,
    cover_image: s.coverImage,
    gallery: s.gallery,
    address: s.address,
    lat: s.location.lat,
    lng: s.location.lng,
    phone: s.phone,
    website: s.website,
    opening_hours: s.openingHours,
    services: s.services,
    category: s.category,
    rating: s.rating,
    review_count: s.reviewCount,
    featured: s.featured ?? false,
  }));
  const { error } = await supabase.from("services").upsert(rows, { onConflict: "slug" });
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} services`);
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

// One representative room per required room type (Standard/Deluxe/Twin/
// Family/Executive Suite — see lib/utils/room-type.ts) for the hotel used in
// the presentation demo, so the new booking modal's room selector has real
// options to show. Owners/admins can add, edit, or remove rooms afterward
// via HotelRoomsManager — this is just a starting point, not fixed content.
const GRAND_HAADI_ROOMS = [
  {
    name: "Standard Room",
    roomType: "standard" as const,
    maxGuests: 2,
    bedType: "1 Queen Bed",
    features: ["Free WiFi", "Air Conditioning"],
    pricePerNight: 45,
  },
  {
    name: "Deluxe Room",
    roomType: "deluxe" as const,
    maxGuests: 2,
    bedType: "1 King Bed",
    features: ["Free WiFi", "Air Conditioning", "Mini Fridge", "City View"],
    pricePerNight: 65,
  },
  {
    name: "Twin Room",
    roomType: "twin" as const,
    maxGuests: 2,
    bedType: "2 Single Beds",
    features: ["Free WiFi", "Air Conditioning", "Work Desk"],
    pricePerNight: 55,
  },
  {
    name: "Family Room",
    roomType: "family" as const,
    maxGuests: 4,
    bedType: "2 Double Beds",
    features: ["Free WiFi", "Air Conditioning", "Extra Space", "Sofa Bed"],
    pricePerNight: 85,
  },
  {
    name: "Executive Suite",
    roomType: "executive_suite" as const,
    maxGuests: 3,
    bedType: "1 King Bed + Sofa",
    features: ["Free WiFi", "Air Conditioning", "Living Area", "Mini Bar", "Premium View"],
    pricePerNight: 120,
  },
];

async function seedHotelRooms() {
  const { data: hotel } = await supabase.from("hotels").select("id").eq("slug", "grand-haadi-hotel").maybeSingle();
  if (!hotel) {
    console.log("↷ Skipped hotel rooms — grand-haadi-hotel not found");
    return;
  }

  const { count } = await supabase
    .from("hotel_rooms")
    .select("id", { count: "exact", head: true })
    .eq("hotel_id", hotel.id);
  if (count && count > 0) {
    console.log(`↷ Skipped hotel rooms — ${count} already exist`);
    return;
  }

  const rows = GRAND_HAADI_ROOMS.map((r, i) => ({
    hotel_id: hotel.id,
    name: r.name,
    max_guests: r.maxGuests,
    bed_type: r.bedType,
    features: r.features,
    price_per_night: r.pricePerNight,
    room_type: r.roomType,
    is_available: true,
    sort_order: i,
  }));
  const { error } = await supabase.from("hotel_rooms").insert(rows);
  if (error) throw error;
  console.log(`✔ Seeded ${rows.length} hotel rooms`);
}

async function main() {
  await seedHotels();
  await seedRestaurants();
  await seedCafes();
  await seedServices();
  await seedAttractions();
  await seedEvents();
  await seedArticles();
  await seedHotelRooms();
  console.log("\n🎉 Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
