import type { Product } from "@/types";

/**
 * Category corrections for Flormar products that were imported into the
 * catch-all "other" category (scripts/import-flormar-catalog.mjs's
 * CATEGORY_MAP falls back to "other" for the source spreadsheet's own
 * "Other / Review" tag) but whose real product identity is now clearly
 * known — either from docs/flormar-product-catalog.json's web-verified
 * research (see lib/config/flormar-verified-names.ts) or from a
 * self-evident, unambiguous keyword in the product's own name once
 * decoded (e.g. a name that reads "... Nail Enamel" is a nail-care
 * product; that's reading the product's own identity, not guessing one).
 *
 * Deliberately NOT exhaustive — every "other" product without a real,
 * confidently-known category stays in "other" rather than being assigned
 * one on a guess (see the source's own "Other / Review" framing: Flormar's
 * own catalog explicitly flagged these as needing manual review).
 */
export const FLORMAR_CATEGORY_OVERRIDES: Record<string, Product["category"]> = {
  "43000016": "lips", // Glam Kiss — verified Lip line
  "33000143": "lips", // Kiss Me More Lip Tattoo
  "33000162": "lips", // Shine Kiss Me More — same Lip Tattoo line
  "34000129": "nail_care", // Flormar Pearly Nail Enamel (verified)
  "34000080": "nail_care", // Flormar Pearly Nail Enamel (verified, alternate SKU revision)
  "31000008": "face", // Perfect Coverage Liquid Concealer (verified)
  "31000274": "face", // Perfect Coverage Liquid Concealer (verified, alternate SKU revision)
  "31000249": "face", // Skn Refresh Foundation
  "33000116": "lips", // Lightweight Lip Powder Lipstick line
  "33000174": "lips", // Lightweight Lip Powder Lipstick line
  "34000014": "nail_care", // Full Color Nail Enamel (NE-suffix pattern, same family as verified Breathing Color/Pearly/Quick Dry/Glitter/Jelly Look Nail Enamel lines)
  "33000036": "lips", // HD Weightless Matte Lipstick (verified)
  "31000107": "face", // Glam Strobing Cream (verified)
  "34000093": "nail_care", // Flormar Glitter Nail Enamel (verified)
  "31000016": "face", // Illuminating Primer
  "31000056": "face", // Illuminating Primer Plus
  "31000248": "face", // Invisible Coverage HD Foundation
  "34000007": "nail_care", // Flormar Jelly Look Nail Enamel (verified)
  "41000028": "face", // K-Spirit Cover Up Matte Finish (Cushion) Foundation
  "41000029": "face", // K-Spirit Cover Up Natural Finish (Cushion) Foundation
  "41000024": "face", // Latte Addiction Bronzing Drops (verified)
  "42000025": "eyes", // Latte Addiction Eyeshadow Palette
  "41000022": "face", // Latte Addiction Highlighter Contour Stick
  "41000023": "face", // Latte Addiction Sculpting Trio
  "31000060": "face", // Liquid Illuminator
  "31000228": "face", // Mood Booster Illuminator — same Mood Booster face-makeup line as the verified Mood Booster Blush
  "49000084": "nail_care", // Manicure Set
  "34000003": "nail_care", // Flormar French Manicure Set
  "34000004": "nail_care", // Matte Nail Enamel (NE-suffix pattern)
  "34000088": "nail_care", // Holographic Top Coat
  "31000062": "skincare_creams", // Mattifying BB Cream — same BB Cream line/category as the verified sibling SKU 31000063
  "31000254": "face", // Metaglam Blush
  "31000229": "face", // Mood Booster Blush (verified)
  "31000023": "face", // Perfect Legs Foundation
  "31000246": "face", // Perfect Coverage Foundation (verified)
  "31000247": "face", // Perfect Coverage Mattifying Touch Foundation
  "31000055": "face", // Pore Minimizer Primer
  "34000082": "nail_care", // Flormar Quick Dry Nail Enamel (verified)
  "34000009": "nail_care", // Flormar Quick Dry Nail Enamel (verified, alternate SKU revision)
  "45000013": "nail_care", // Quick Dry Drops — same nail-polish-drying family as Quick Dry Nail Enamel
  "33000117": "lips", // Sheer Up Lipstick (verified)
  "33000021": "lips", // Silk Matte Liquid Lipstick (verified)
  "31000263": "face", // Stay Perfect Concealer (verified)
  "31000240": "face", // Wet&Dry Compact Powder (verified)
  "35000086": "nail_care", // Nourishing Oil Vitamin — same Nail & Cuticle Oil (Nco) family as the verified Care&Go Nail And Cuticle Oil
  "42000001": "eyes", // Matte Waterproof Dipliner
  "42000002": "eyes", // Vinyl Waterproof Dipliner
};
