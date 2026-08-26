/**
 * Real, web-verified Flormar product names, keyed by the base SKU (the
 * catalog's "Internal Reference" prefix before the shade suffix — e.g.
 * "34000072" for "34000072-001"/"34000072-003"/...). Sourced from
 * docs/flormar-product-catalog.json's `matchedProductName` field — each one
 * independently researched against flormar.com / flormar.com.tr / other
 * official Flormar storefronts (see docs/flormar-product-reconciliation.md
 * for the full research method and citations), not guessed or invented.
 *
 * Only includes entries that are (a) real product-line names, not internal
 * research commentary (the source file's `matchedProductName` sometimes
 * carries parenthetical notes like "(new/2nd line, distinct SKU family from
 * Group 14)" — those are excluded here, never shown to a customer), and
 * (b) SKUs that actually exist in the live catalog
 * (scripts/import-flormar-catalog.mjs's `Flormar_Hargeisa_Catalog_Ready_for_
 * Import.xlsx` source) — the reconciliation doc covers a different, earlier
 * 236-row invoice with only partial SKU overlap.
 *
 * Used by cleanFlormarProductName() (lib/utils/flormar-product-names.ts) as
 * its highest-confidence tier — checked before the token-abbreviation
 * dictionary, which only ever expands specific codes this same research
 * already confirmed (see that file's own doc comment).
 */
export const FLORMAR_VERIFIED_NAMES: Record<string, string> = {
  "31000274": "Perfect Coverage Liquid Concealer",
  "31000240": "Wet&Dry Compact Powder",
  "31000243": "Baked Blush-On",
  "32000022": "Eyebrow Fixator Mascara",
  "32000138": "Tinted Brow Gel",
  "33000021": "Silk Matte Liquid Lipstick",
  "36000092": "K-Spirit Collagen Wrapping Mask",
  "45000002": "Acetone Free Nail Polish Remover",
  "45000010": "Easy & Go Sponge Nail Polish Remover",
  "47000055": "Ultra Thin Brow Pencil",
  "49000066": "Eyeshadow Brush",
  "31000063": "BB Cream",
  "31000107": "Glam Strobing Cream",
  "31000183": "All Day Fix Setting Spray",
  "31000184": "All Day Fix Matte Setting Spray",
  "31000245": "Flormar Skin Lifting Foundation",
  "31000246": "Perfect Coverage Foundation",
  "31000263": "Stay Perfect Concealer",
  "32000001": "Dipliner Black",
  "32000009": "Spider Lash Volume Mascara",
  "32000025": "Triple Action Mascara",
  "32000127": "Hero Volume & Curl Mascara",
  "32000137": "Brow Setter & Primer Gel",
  "33000068": "Dewy Lip Booster",
  "33000117": "Sheer Up Lipstick",
  "33000146": "Water Lip Stain",
  "33000152": "Lightweight Lip Powder Lipstick",
  "33000155": "Flormar Dewy Lip Glaze",
  "33000176": "Flormar Glow Lip Oil",
  "33000179": "Flormar K-Spirit Blur Lip Tint",
  "34000072": "Flormar Breathing Color Nail Enamel",
  "34000082": "Flormar Quick Dry Nail Enamel",
  "34000093": "Flormar Glitter Nail Enamel",
  "34000129": "Flormar Pearly Nail Enamel",
  "41000001": "All I Need Face Palette",
  "41000020": "To Go Stick Blush",
  "41000021": "To Go Stick Bronzer",
  "41000024": "Latte Addiction Bronzing Drops",
  "41000027": "K-Spirit Glass Highlighter",
  "42000028": "Extreme Tattoo Brow Wax Gel",
  "43000010": "Latte Addiction Lip&Cheek Balm",
  "43000011": "Latte Addiction Lip Topper",
  "43000012": "K-Spirit Lip Mask",
  "43000014": "K-Spirit Glow Lip Tint",
  "43000015": "K-Spirit Moussy Lip & Cheek",
  "47000001": "Waterproof Eyeliner",
  "47000037": "Waterproof Lipliner",
  "49000061": "Contour Brush",
  "49000064": "Makeup Brush Set",
  "49000068": "Blending Brush",
  "49000072": "Shading Brush",
};
