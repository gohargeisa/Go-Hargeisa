import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getAllHotelSlugs } from "@/lib/data/hotels";
import { getAllRestaurantSlugs } from "@/lib/data/restaurants";
import { getAllCafeSlugs } from "@/lib/data/cafes";
import { getAllAttractionSlugs } from "@/lib/data/attractions";
import { getAllArticleSlugs } from "@/lib/data/articles";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gohargeisa.com";

const staticRoutes = [
  "",
  "explore",
  "hotels",
  "restaurants",
  "cafes",
  "attractions",
  "shopping",
  "travel-guide",
  "transportation",
  "blog",
  "about",
  "contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [hotelSlugs, restaurantSlugs, cafeSlugs, attractionSlugs, articleSlugs] = await Promise.all([
    getAllHotelSlugs(),
    getAllRestaurantSlugs(),
    getAllCafeSlugs(),
    getAllAttractionSlugs(),
    getAllArticleSlugs(),
  ]);

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
