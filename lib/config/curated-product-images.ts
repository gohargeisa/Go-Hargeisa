import type { PolymorphicListingType } from "@/types";

/**
 * IMAGE-ONLY bridge for a listing's "Shop" section: real photos already in
 * that listing's own gallery that show an actual product, but have no
 * verified name/price/description/brand/size of their own — so the normal
 * ProductsSection can't honestly represent them as a purchasable item. Each
 * entry is a hand-picked subset of that listing's own real `gallery` array
 * (never a new/uploaded asset, never a scraped one), curated to exclude any
 * photo that visibly belongs to another business (third-party packaging/
 * branding/logo) — see the review notes in each entry below. Deliberately
 * carries no metadata beyond the URL itself: no name, price, brand, or
 * description is invented to go with these images. Renders alongside any
 * real `products` rows the listing already has (see
 * app/[locale]/city-services/[slug]/page.tsx) — the two aren't mutually
 * exclusive, so a partner can have some verified real products and some
 * "photo only, ask on WhatsApp" entries at the same time.
 *
 * The moment real per-item data is confirmed for one of these photos
 * (a visible price tag, an owner-confirmed name, etc.), move it out of here
 * and into a real `products` row instead — see the Mama Baby Care entry
 * below for a worked example of exactly that move.
 */
const CURATED_PRODUCT_IMAGES: Partial<Record<PolymorphicListingType, Record<string, string[]>>> = {
  city_service: {
    /**
     * Mama Baby Care — reviewed all 35 photos in this listing's real
     * `gallery` individually (2026-08-22). 25 were excluded: clear
     * third-party retail/pharmacy branding legible in the photo itself
     * (Colief, baby Dove, My Little Miracle, Tommee Tippee, Mothercare,
     * Bonjela, Healthpoint, Lipar, "FAME FOREVER", Bench, a Burberry-
     * pattern headband, a licensed Rolling Stones print, etc.), one
     * "Professional E-commerce Product Shot" watermark proving stock
     * sourcing, or items outside this shop's own category entirely (a
     * women's perfume, an Arabic air freshener). The 8 below are the
     * remaining ones with no legible third-party brand and no verified
     * name/price of their own — plain product photography, shown as a
     * photo only, never with an invented name or price.
     *
     * A 9th photo from this same review pass (the in-store shelf shot of
     * black school shoes) had a real, legible price sticker ($20) and real
     * packaging — that one is no longer listed here; it's now a real
     * `products` row (id 877c8768-4b17-43ec-9bb8-4b6ab8eccedf, 2026-08-22)
     * instead, so it isn't shown twice.
     */
    "mama-baby-care": [
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/ecac3124-137a-4cf1-a94c-25de8f92e151.jpeg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/869f1b61-47f1-4475-b228-dd0fcb93e472.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/c3248a69-ec02-4435-8b90-194f118a5dbf.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/0ae07429-d7a5-4efd-b8ee-dd66e920a2b1.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/75701774-8aba-4da1-8c89-93c87549ce94.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/5a6f1aae-91a4-4468-a62e-530323d16fa1.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/7c3cdf11-b4f4-4592-b187-a4660c460c99.jpg",
      "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/gallery/844beccf-c95c-48d8-b3c4-a835919b5ac0.jpg",
    ],
  },
};

export function getCuratedProductImages(listingType: PolymorphicListingType, slug: string): string[] | null {
  return CURATED_PRODUCT_IMAGES[listingType]?.[slug] ?? null;
}
