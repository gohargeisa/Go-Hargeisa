import type {
  Hotel,
  Restaurant,
  Cafe,
  Attraction,
  EventItem,
  Article,
  Destination,
  MapPoint,
} from "@/types";
import { placeholderImage } from "./placeholder-image";

// Every image below is a clearly-labeled placeholder (see lib/placeholder-image.ts)
// rather than a generic stock photo — swap each `coverImage`/`image`/`url`
// string for a real photo once you have one. This is sample content only;
// once Supabase is connected, real listings replace all of this (see lib/data/*).

export const destinations: Destination[] = [
  {
    id: "d1",
    slug: "downtown-hargeisa",
    name: "Downtown Hargeisa",
    description: "The commercial heart of the city — markets, banks, and street life.",
    image: placeholderImage("Downtown Hargeisa", { tone: "primary" }),
    placeCount: 48,
  },
  {
    id: "d2",
    slug: "war-memorial-district",
    name: "War Memorial District",
    description: "Home to the MiG monument and the Freedom Park gardens.",
    image: placeholderImage("War Memorial District", { tone: "secondary" }),
    placeCount: 12,
  },
  {
    id: "d3",
    slug: "hargeisa-suburbs",
    name: "Hargeisa Suburbs",
    description: "Quiet residential neighborhoods with new cafes and guesthouses.",
    image: placeholderImage("Hargeisa Suburbs", { tone: "accent" }),
    placeCount: 21,
  },
];

export const hotels: Hotel[] = [
  {
  id: "h0",
  slug: "grand-haadi-hotel",
  name: "Grand Haadi Hotel",

  shortDescription:
    "Modern hotel in Hargeisa offering comfortable rooms, free WiFi and excellent hospitality.",

  description:
    "Grand Haadi Hotel is one of Hargeisa's well-known hotels, providing modern accommodation, conference facilities, a restaurant and convenient access to the city center.",

  coverImage: "/images/hotels/grand-haadi.jpg",

  gallery: [
    {
      url: "/images/hotels/grand-haadi.jpg",
      alt: "Grand Haadi Hotel",
    },
  ],

  address: "Buurta Kala Jeexan, Hargeisa, Somaliland",

  location: {
    lat: 9.56,
    lng: 44.07,
  },

  rating: 4.2,
  reviewCount: 156,

  reviews: [],

  phone: "+252 63 4622117",

  priceRange: "$$",

  amenities: [
    "Free WiFi",
    "Restaurant",
    "Parking",
    "Airport Shuttle",
    "Family Rooms",
  ],

  nearbyAttractionIds: ["a1"],

  featured: true,
},
  
  
  
];

export const restaurants: Restaurant[] = [
  {
    id: "r1",
    slug: "sultan-restaurant",
    name: "Sultan Restaurant",

    shortDescription:
      "One of Hargeisa's most popular restaurants serving Somali, Arabic and seafood cuisine.",

    description:
      "Sultan Restaurant is one of the best-known dining destinations in Hargeisa. It offers Somali, Arabic, grilled and seafood dishes in a modern and family-friendly atmosphere. The restaurant is popular with locals, business travelers and tourists visiting Somaliland.",

    // ⬇️ ضعها هنا
    coverImage: "/images/restaurants/sultan/hero.jpeg",

    gallery: [
      {
        url: "/images/restaurants/sultan/1.jpeg",
        alt: "Sultan Restaurant",
      },
      {
        url: "/images/restaurants/sultan/2.jpeg",
        alt: "Dining Area",
      },
      {
        url: "/images/restaurants/sultan/3.jpeg",
        alt: "Food",
      },
      {
        url: "/images/restaurants/sultan/4.jpeg",
        alt: "Outdoor Seating",
      },
      {
        url: "/images/restaurants/sultan/5.jpeg",
        alt: "Restaurant Interior",
      },
      {
        url: "/images/restaurants/sultan/6.jpeg",
        alt: "Signature Dishes",
      },
    ],

    address: "Jigjiga Yar, Hargeisa, Somaliland",

location: {
  lat: 9.5624,
  lng: 44.0659,
},

rating: 4.8,
reviewCount: 250,

reviews: [],

cuisine: [
  "Somali",
  "Arabic",
  "BBQ",
  "Seafood"
],

priceRange: "$$",

openingHours: "8:00 AM – 11:00 PM",

menuHighlights: [
  {
    name: "Mixed Grill",
    price: "$12",
    description: "Mixed grilled meat with rice and fresh salad."
  },
  {
    name: "Fish Fillet",
    price: "$10"
  },
  {
    name: "Chicken Steak",
    price: "$9"
  }
],

reservable: true,

featured: true,
  },
];

export const cafes: Cafe[] = [
  {
    id: "c1",
    slug: "kob-cafe",
    name: "KOB Cafe",
    shortDescription: "Modern specialty coffee shop with fast WiFi and a co-working vibe.",
    description:
      "KOB Cafe is a favorite among Hargeisa's young professionals — bright interiors, single-origin Ethiopian and Somali coffee, and reliable WiFi make it a go-to workspace.",
    coverImage: placeholderImage("KOB Cafe", { tone: "accent" }),
    gallery: [{ url: placeholderImage("KOB Cafe — Coffee Bar"), alt: "Coffee bar" }],
    address: "Airport Road, Hargeisa",
    location: { lat: 9.5182, lng: 44.0891 },
    rating: 4.8,
    reviewCount: 176,
    reviews: [],
    specialDrinks: ["Somali Spiced Coffee", "Iced Caramel Macchiato"],
    wifi: true,
    workingSpace: true,
    openingHours: "6:00 AM – 9:00 PM",
    featured: true,
  },
  {
    id: "c2",
    slug: "cup-of-art",
    name: "Cup of Art",
    shortDescription: "Cozy cafe with local art on the walls and shisha lounge upstairs.",
    description:
      "Cup of Art doubles as a small gallery space for local artists, with a relaxed rooftop seating area popular in the evenings.",
    coverImage: placeholderImage("Cup of Art Cafe"),
    gallery: [{ url: placeholderImage("Cup of Art — Rooftop"), alt: "Rooftop seating" }],
    address: "Pepsi District, Hargeisa",
    location: { lat: 9.5534, lng: 44.0612 },
    rating: 4.5,
    reviewCount: 94,
    reviews: [],
    specialDrinks: ["Somali Tea (Shaah)", "Cold Brew"],
    wifi: true,
    workingSpace: false,
    openingHours: "7:00 AM – 11:00 PM",
  },
];

export const attractions: Attraction[] = [
  {
    id: "a1",
    slug: "freedom-park-mig-monument",
    name: "Freedom Park & MiG Monument",
    shortDescription: "Iconic war memorial and fighter jet monument in the city center.",
    description:
      "The MiG Monument, mounted on a plinth in Freedom Park, commemorates the 1988 uprising and is one of the most photographed landmarks in Hargeisa.",
    coverImage: placeholderImage("Freedom Park & MiG Monument", { tone: "secondary" }),
    gallery: [{ url: placeholderImage("MiG Monument — Sunset"), alt: "Monument at sunset" }],
    address: "Freedom Park, Hargeisa",
    location: { lat: 9.5605, lng: 44.065 },
    rating: 4.6,
    reviewCount: 267,
    reviews: [],
    history:
      "The monument was erected to honor those who died during the Somaliland War of Independence, using an actual MiG-17 aircraft.",
    bestTimeToVisit: "Late afternoon, for golden-hour photos",
    entryFee: "Free",
    visitorTips: ["Best visited on foot", "Combine with a walk through the surrounding market"],
    nearbyRestaurantIds: ["r1"],
    nearbyHotelIds: ["h1"],
    category: "landmark",
    featured: true,
  },
  {
    id: "a2",
    slug: "waheen-market",
    name: "Waheen Market",
    shortDescription: "Somaliland's largest open-air market for textiles, spices and crafts.",
    description:
      "A sprawling, colorful market where you can find everything from hand-woven baskets to frankincense — a sensory introduction to daily life in Hargeisa.",
    coverImage: placeholderImage("Waheen Market", { tone: "accent" }),
    gallery: [{ url: placeholderImage("Waheen Market — Stalls") , alt: "Market stalls" }],
    address: "Waheen, Hargeisa",
    location: { lat: 9.5598, lng: 44.0705 },
    rating: 4.4,
    reviewCount: 143,
    reviews: [],
    history: "One of the oldest trading markets in the Horn of Africa, still central to the city's economy.",
    bestTimeToVisit: "Morning, before the midday heat",
    entryFee: "Free",
    visitorTips: ["Bargain respectfully", "Ask before photographing vendors"],
    nearbyRestaurantIds: [],
    nearbyHotelIds: ["h2"],
    category: "market",
  },
];

export const events: EventItem[] = [
  {
    id: "e1",
    slug: "hargeisa-international-book-fair",
    title: "Hargeisa International Book Fair",
    description: "East Africa's leading literary festival, bringing together writers from across the region.",
    coverImage: placeholderImage("Hargeisa International Book Fair"),
    category: "cultural",
    startDate: "2026-08-01",
    endDate: "2026-08-06",
    location: "Hargeisa Cultural Centre",
  },
  {
    id: "e2",
    slug: "somaliland-independence-day",
    title: "Somaliland Independence Day",
    description: "National celebrations with parades, music and fireworks across the city.",
    coverImage: placeholderImage("Somaliland Independence Day", { tone: "accent" }),
    category: "national",
    startDate: "2026-06-26",
    endDate: "2026-06-26",
    location: "Freedom Park",
  },
];

export const articles: Article[] = [
  {
    id: "b1",
    slug: "top-10-things-to-do-in-hargeisa",
    title: "Top 10 Things to Do in Hargeisa",
    excerpt: "From the MiG Monument to camel meat suqaar, here's how to spend your first days in the city.",
    coverImage: placeholderImage("Top 10 Things To Do"),
    author: "Go Hargeisa Editorial",
    publishedAt: "2026-06-10",
    readMinutes: 7,
    category: "Guides",
  },
  {
    id: "b2",
    slug: "best-restaurants-in-hargeisa",
    title: "The Best Restaurants in Hargeisa Right Now",
    excerpt: "Our editors' picks for grilled meat, seafood and the city's best cup of Somali tea.",
    coverImage: placeholderImage("Best Restaurants Guide", { tone: "secondary" }),
    author: "Go Hargeisa Editorial",
    publishedAt: "2026-05-22",
    readMinutes: 6,
    category: "Food",
  },
  {
    id: "b3",
    slug: "history-of-hargeisa",
    title: "A Short History of Hargeisa",
    excerpt: "How a colonial-era trading post became the capital of Somaliland.",
    coverImage: placeholderImage("History of Hargeisa", { tone: "accent" }),
    author: "Go Hargeisa Editorial",
    publishedAt: "2026-04-30",
    readMinutes: 9,
    category: "Culture",
  },
];

export const mapPoints: MapPoint[] = [
  { id: "m1", name: "Ambassador Hotel", category: "hotel", location: { lat: 9.5624, lng: 44.065 } },
  {
  id: "m2",
  name: "Sultan Restaurant",
  category: "restaurant",
  location: {
    lat: 9.5624,
    lng: 44.0659
  }
},
  { id: "m3", name: "Hargeisa Group Hospital", category: "hospital", location: { lat: 9.5545, lng: 44.0631 } },
  { id: "m4", name: "Dahabshiil Bank HQ", category: "bank", location: { lat: 9.5599, lng: 44.0663 } },
  { id: "m5", name: "Jamia Mosque", category: "mosque", location: { lat: 9.5619, lng: 44.0678 } },
  { id: "m6", name: "Waheen Market", category: "shopping", location: { lat: 9.5598, lng: 44.0705 } },
  { id: "m7", name: "MiG Monument", category: "attraction", location: { lat: 9.5605, lng: 44.065 } },
];

export const HARGEISA_CENTER = { lat: 9.5624, lng: 44.065 };
