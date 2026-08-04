import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getAllHotelSlugs } from "@/lib/data/hotels";
import { getAllRestaurantSlugs } from "@/lib/data/restaurants";
import { getAllCafeSlugs } from "@/lib/data/cafes";
import { getAllAttractionSlugs } from "@/lib/data/attractions";
import { getAllEventSlugs } from "@/lib/data/events";
import { getAllCityServiceSlugs } from "@/lib/data/city-services";
import { getAllArticleSlugs } from "@/lib/data/articles";
import {
  HOTELS_PRESENTATION_MODE,
  PRESENTATION_HOTEL_SLUG,
  RESTAURANTS_PUBLIC_ENABLED,
  CAFES_PUBLIC_ENABLED,
} from "@/lib/config/features";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gohargeisa.com";

const staticRoutes = [
  "",
  "explore",
  "hotels",
  "restaurants",
  "cafes",
  "attractions",
  "city-services",
  "city-map",
  "shopping",
  "events",
  "travel-guide",
  "transportation",
  "blog",
  "about",
  "contact",
  "join",
  "diaspora-week-2026",
  "search",
  "privacy",
  "terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hotelSlugsRaw, restaurantSlugsRaw, cafeSlugsRaw, attractionSlugs, eventSlugs, cityServiceSlugs, articleSlugs] =
    await Promise.all([
      getAllHotelSlugs(),
      getAllRestaurantSlugs(),
      getAllCafeSlugs(),
      getAllAttractionSlugs(),
      getAllEventSlugs(),
      getAllCityServiceSlugs(),
      getAllArticleSlugs(),
    ]);

  // Hotel presentation mode + temporarily-hidden restaurants/cafes
  // (lib/config/features.ts) — don't list URLs the public site won't show.
  const hotelSlugs = HOTELS_PRESENTATION_MODE
    ? hotelSlugsRaw.filter((s) => s === PRESENTATION_HOTEL_SLUG)
    : hotelSlugsRaw;
  const restaurantSlugs = RESTAURANTS_PUBLIC_ENABLED ? restaurantSlugsRaw : [];
  const cafeSlugs = CAFES_PUBLIC_ENABLED ? cafeSlugsRaw : [];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of staticRoutes) {
      entries.push({
        url: `${BASE_URL}/${locale}${route ? `/${route}` : ""}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1 : 0.7,
      });
    }

    for (const slug of hotelSlugs) entries.push(url(`${locale}/hotels/${slug}`));
    for (const slug of restaurantSlugs) entries.push(url(`${locale}/restaurants/${slug}`));
    for (const slug of cafeSlugs) entries.push(url(`${locale}/cafes/${slug}`));
    for (const slug of attractionSlugs) entries.push(url(`${locale}/attractions/${slug}`));
    for (const slug of eventSlugs) entries.push(url(`${locale}/events/${slug}`));
    for (const slug of cityServiceSlugs) entries.push(url(`${locale}/city-services/${slug}`));
    for (const slug of articleSlugs) entries.push(url(`${locale}/blog/${slug}`));
  }

  return entries;
}

function url(path: string) {
  return {
    url: `${BASE_URL}/${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  };
}
