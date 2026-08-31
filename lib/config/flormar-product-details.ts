/**
 * Display-time product-detail overrides for Flormar Hargeisa, applied the
 * same way FLORMAR_CATEGORY_OVERRIDES / cleanFlormarProductName already are
 * (in FlormarStorefront's `productsWithPricing` memo) — read-only, keyed by
 * SKU, NEVER written back to the database.
 *
 * WHY THIS EXISTS: the live `products` rows were imported from a wholesale
 * spreadsheet that carries no description text and no verified shade colour,
 * so `products.description` is NULL on every row and `product_variants.
 * hex_color` is NULL on every row. A separate, earlier reconciliation
 * (docs/flormar-product-catalog.json + docs/flormar-product-reconciliation.md)
 * matched Flormar's own wholesale codes to real flormar.com / official
 * regional-storefront product pages and recorded, per real product line, a
 * factual product description and per-shade hex values read off the official
 * pack shots. That research was never carried into the DB. This file surfaces
 * exactly the subset of it that still matches a live SKU after the 2026-08-25
 * full catalogue re-import — nothing is generated, guessed, or paraphrased
 * beyond trimming a trailing sourcing note off a few descriptions.
 *
 * Regenerate with scripts/generate-flormar-product-details.mjs if the DB
 * catalogue is re-imported again.
 *
 * Coverage: 55 of the ~218 visible products have a verified
 * description; 167 shade variants have a verified hex. Products
 * / shades not listed here fall back to their existing behaviour (no
 * description block; approximated swatch colour via flormar-shade-colors.ts).
 * All description matches are flormar.com-verified at HIGH or MEDIUM
 * confidence (docs/flormar-product-reconciliation.md, section E).
 */
export const FLORMAR_PRODUCT_DESCRIPTIONS: Record<string, string> = {
  // CC Cream (color-correcting cream range)
  "31000059": "SPF cream that closes dark spots and restores natural skin appearance, released across four targeted formulas (dullness, redness, dark circles, fatigue). 35 ML each.",
  // BB Cream
  "31000063": "SPF20 BB cream that hides skin imperfections with a natural finish, available across six shades from Fair to Medium.",
  // Glam Strobing Cream
  "31000107": "Illuminating strobing cream with iridescent particles, applied to cheekbones, temples, nose bridge, cupid's bow, and chin. 35 ML.",
  // Mood Booster Blush (Liquid Blush)
  "31000229": "Weightless silky liquid blush with green tea extract, doe-foot applicator, naturally radiant buildable cheek color. 4 ML.",
  // Vitamin Bomb / Hydro Bomb / Dewy Bomb Serum & Primer family [MEDIUM confidence]
  "31000234": "A serum-primer hybrid line: Vitamin Bomb (vitamins B/C/E, collagen, antioxidants), Hydro Bomb (aloe vera + green tea for hydration), Dewy Bomb (açai berry, panthenol, hyaluronic acid for dewy glow). ~30 ML.",
  // Set'n Go Fixing Powder Compact Powder 002 Honey
  "31000236": "Lightweight compact fixing powder with up to 80% natural-origin ingredients, smooth matte finish, oil control; Honey shade suited to medium-to-deep skin tones. 8g.",
  // Illuminator Powder 003 Bronze Star
  "31000238": "Loose/compact illuminating powder with a soft, thin structure and luminous, shimmery finish designed to create a radiant complexion; apply from center of face outward. 7g.",
  // Bronzing Powder 007 Mattemocha
  "31000239": "Compressed bronzing powder with silky texture and shimmer pigments for a natural sun-kissed glow; medium-high coverage, suitable for all skin types. 11g.",
  // Wet&Dry Compact Powder [MEDIUM confidence]
  "31000240": "Matte-finish creamy compact powder usable wet (high coverage) or dry (medium-high coverage); micronized powders/pigments for smooth, even application. 10g.",
  // Baked Blush-On
  "31000243": "Intensely pigmented pressed powder blush made with baking technology (prevents dusting), contains Vitamin E for skin moisture balance; compact with marbled finish and lid. 4g.",
  // Baked Blush-On (new/2nd line, distinct SKU family from Group 14)
  "31000244": "Pressed powder blush with intensely colored formula for a natural flush; high pigmentation, all skin types. 5.5g.",
  // Flormar Skin Lifting Foundation
  "31000245": "Foundation enriched with herbal collagen, niacinamide, hyaluronic acid and antioxidants; lifting/anti-aging effect, SPF30, suitable for all skin types. 30ml.",
  // Perfect Coverage Foundation
  "31000246": "Foundation offering fresh look up to 12 hours, soft/rich texture with almond and olive oil extracts, SPF15, suitable for all skin types. 30ml.",
  // Loose Powder 004 Beige Sand
  "31000259": "Transparent-structure loose setting powder with matte finish and oil-absorbing properties; sets foundation without artificial layering, especially for oily/combination skin. 18g.",
  // Stay Perfect Concealer
  "31000263": "Liquid concealer with creamy texture, longwear full-coverage formula, semi-matte finish, large soft jumbo applicator; smooths fine lines, suitable for all skin types. 12.5g.",
  // Puffy Liquid Blush 003 Rosy Glow
  "31000273": "Liquid blush with sponge applicator, moisturizing formula, radiant finish; lightweight texture blends without cakiness; contains acai, green tea extract, vitamin E, mica. 12ml.",
  // Perfect Coverage Liquid Concealer [MEDIUM confidence]
  "31000274": "Liquid concealer with hazelnut oil and rosehip extract; conceals undereye bags, dark circles, and skin flaws; can double as an eye makeup base; available in 12 shade tones.",
  // Spider Lash Volume Mascara
  "32000009": "Volumizing mascara with olive oil, fiber-infused formula, special bristle brush for denser, more voluminous lashes.",
  // Precious Curl Mascara (Carbon Black)
  "32000018": "Volumizing/curling mascara with sweet almond oil, curved fiber brush, extra-high-pigment \"Carbon Black\" formula for a dramatic, false-lash effect.",
  // Hero Volume & Curl Mascara
  "32000127": "Waterproof volumizing/curling mascara with hourglass-shaped brush, paraben/perfume/silicone-free formula.",
  // Tinted Brow Gel
  "32000138": "Waterproof tinted brow gel with micro-fibers for a natural, voluminous brow look; part of a 5-shade line (001 Beige, 002 Light Brown, 003 Brown, 004 Dark Brown, 005 Brunette).",
  // Big'N Bold Lengthening Mascara - Big N Bold Waterproof Mas (002)
  "32000145": "Waterproof, lengthening/volumizing mascara with a long silicone brush; natural black, matte finish; does not bleed or smear in rain/humidity.",
  // Silk Matte Liquid Lipstick
  "33000021": "Matte liquid lipstick with silky texture, long wear, nourishing oils protecting lips from drying; velvety matte finish with intense color payoff. 4.5 ML.",
  // HD Weightless Matte Lipstick (New)
  "33000036": "Soft, lightweight matte lipstick with intense pigmentation, creamy texture with murumuru butter for hydration, long-lasting wear without over-drying. 4G.",
  // Dewy Lip Booster
  "33000068": "Plumping lip gloss with shiny, wet, non-sticky finish; \"Match\" shade adapts color to the wearer; used to plump lips under lipstick/gloss/balm. 4.5 ML.",
  // Sheer Up Lipstick
  "33000117": "Semi-transparent, glossy-finish moisturizing lipstick with shea butter, cocoa seed butter and argan oil; radiant color with intense hydration. 3 G.",
  // Kiss Me More Lip Tattoo (New / "2")
  "33000143": "Long-lasting matte liquid lipstick with soft sponge applicator, formulated with cocoa butter, murumuru oil and shea butter; up to 24 hours moisturization, up to 8 hours wear, no smearing. 3.8 ML.",
  // Water Lip Stain
  "33000146": "Lightweight, water-like gel lip stain with 88% water content, fruit extracts, long-lasting transfer-proof color; can be applied to lips and cheeks. 6.4 ML.",
  // Lightweight Lip Powder Lipstick
  "33000152": "Lightweight lip makeup with matte, powdery-feel finish; shea butter, vitamin E and olive oil; thin liquid consistency, medium pigment density, sponge applicator. 3 G.",
  // Flormar Dewy Lip Glaze
  "33000155": "Non-sticky, glossy lip gloss with shea butter, coconut fruit extract, olive oil, vitamin C/E for hydrating, high-shine \"glazed\" finish; 4.5ml; available in 20+ shades.",
  // Flormar Glow Lip Oil
  "33000176": "Lightweight, nourishing lip oil with jojoba oil, organic baobab oil, grape seed oil, apricot kernel oil, sweet almond oil and vitamin E; glossy non-sticky finish; 6ml; 3-shade range.",
  // Flormar K-Spirit Blur Lip Tint
  "33000179": "Korean-beauty-inspired, high-pigment lip tint with velvety-matte \"blur\" finish that softens lip lines; vanilla-scented, smudge-proof, adjustable intensity, moisturizing formula; 4ml.",
  // Flormar Jelly Look Nail Enamel (New)
  "34000007": "Gel-manicure-effect nail polish (no LED needed) with ultra shimmer/intense color, wide brush for one-stroke coverage; extra-shiny with two coats; 11ml.",
  // Flormar Breathing Color Nail Enamel
  "34000072": "Breathable nail polish formula (permeable to oxygen/water vapor) protecting nail moisture and supporting healthy nail growth; quick-drying, glossy finish; 11ml.",
  // Flormar Nail Enamel (New) — plain/classic line
  "34000081": "Flormar's classic nail polish line; long-lasting, glossy, chip-resistant, mineral-enriched formula; 11ml; ~150+ shade options.",
  // Flormar Quick Dry Nail Enamel
  "34000082": "Fast-drying nail polish (dries in ~60 seconds), glossy finish, resistant to yellowing/peeling; 11ml.",
  // Flormar Glitter Nail Enamel
  "34000093": "Glitter nail polish containing nacres of varying sizes/textures for intense, colorful sparkle; recommend nail primer/base coat underneath; 11ml.",
  // Flormar Pearly Nail Enamel [MEDIUM confidence]
  "34000129": "Nail polish with mother-of-pearl/pearly finish, described as offering \"six-day shine,\" easy application via wide brush; 11ml.",
  // To Go Stick Blush
  "41000020": "Portable creamy stick blush with buildable pigmentation; vitamin E and shea butter for a natural, dewy flush. Available in 5 shades.",
  // To Go Stick Bronzer
  "41000021": "Portable creamy stick bronzer, buildable coverage, vitamin E and shea butter for a natural sun-kissed finish. Available in 3 shades.",
  // Latte Addiction Highlighter Contour Stick
  "41000022": "Creamy stick highlighter/contour with ultra-fine pearlescent pigments, coffee-tone inspired shades.",
  // Latte Addiction Bronzing Drops [MEDIUM confidence]
  "41000024": "Face and body liquid bronzer, coffee-tone inspired shades, moisturizing formula. Available in 3 shades (30 ML).",
  // K-Spirit Glass Highlighter
  "41000027": "K-Beauty \"glass skin\" inspired liquid/cream highlighter, lightweight nourishing texture. Available in 2 shades (5 G).",
  // K-Spirit Cover Up Matte Finish Foundation (cushion)
  "41000028": "Korean-beauty-inspired high-coverage, long-lasting semi-matte cushion foundation. Available in 8 shades (15 G).",
  // K-Spirit Cover Up Natural Finish Foundation (cushion)
  "41000029": "Korean-beauty-inspired high-coverage cushion foundation with natural finish, black truffle extract, sweat/humidity resistant. Available in 8 shades (15 G).",
  // Latte Addiction Lip&Cheek Balm
  "43000010": "Creamy coffee-toned balm for lips and cheeks; melts on to give a natural radiant flush of color while moisturizing. Enriched with nourishing oils for a luminous, dewy, non-sticky finish. 3.2g.",
  // Latte Addiction Lip Topper
  "43000011": "Coffee-inspired liquid lip gloss/topper, non-sticky smooth texture, hydrating oils and subtle shimmer. 3.5ml.",
  // K-Spirit Lip Mask
  "43000012": "Korean-beauty-inspired intensive lip mask that repairs dry, chapped, damaged lips; reduces fine lines/dryness, leaves lips plumper over time. 8.5g.",
  // K-Spirit Glow Lip Tint
  "43000014": "Korean-beauty-inspired intensive moisturizing shimmering long-lasting lip tint; wearable alone or over lipstick. 4ml.",
  // K-Spirit Moussy Lip & Cheek
  "43000015": "Korean-beauty-inspired dual-purpose lip and cheek tint with soft, fluffy/moussy texture and blurred, velvety finish; buildable, long-lasting. 5g.",
  // Glam Kiss (High Pigment & Moisturizing Glass-Lip-Look Glossy Finish Liquid Lipstick)
  "43000016": "High-pigment, moisturizing liquid lipstick with transparent \"glass lip\" reflective, glossy finish; up to 16-hour wear, transfer-resistant, creamy non-sticky texture. 3.5ml.",
  // Waterproof Eyeliner
  "47000001": "Waterproof, highly pigmented sharpenable eyeliner pencil enriched with Vitamin E; 1.14g; available in 17 shades.",
  // Waterproof Lipliner
  "47000037": "Water-resistant lip pencil with special polymers shaping lips, preventing lipstick bleeding/feathering, resisting humidity and sweat; 1.14g; available in 20 shades.",
  // Ultra Thin Brow Pencil
  "47000055": "Super thin, waterproof, long-lasting brow pencil with extra-fine angled tip and built-in spoolie brush; 0.14g; 4 shades (001 Beige, 002 Light Brown, 003 Brown, 004 Dark Brown).",
  // Extreme Tattoo Matte & Shimmer Retractable Sharpener-Free Gel Eye Pencil & Eyeshadow Stick
  "47000125": "Dual-purpose retractable gel eye pencil with built-in sharpener, usable as eyeliner or eyeshadow stick; matte and shimmer finish options; 1.4g; 6 shades (001 Onyx, 002 Burgundy, 003 Cocoa, 004 Mocha, 005 Bronze, 006 Navy).",
};

/**
 * Verified per-shade swatch colours, keyed by the FULL variant SKU
 * (`product_variants.sku`, e.g. "33000021-045"). Read off the official
 * Flormar pack shot for that exact shade during the reconciliation above.
 * Takes priority over resolveFlormarSwatchColor()'s word-match approximation
 * wherever present; a shade not listed here keeps the approximation.
 */
export const FLORMAR_SHADE_HEX: Record<string, string> = {
  "31000059-CC03": "#DFB7BF",
  "31000059-CC04": "#DFBA9F",
  "31000063-001": "#D3A37D",
  "31000063-002": "#D7A079",
  "31000063-003": "#CB966A",
  "31000107-001": "#E9DBCE",
  "31000107-002": "#F5CCAC",
  "31000234-000": "#FFDCB4",
  "31000234-002": "#74C394",
  "31000234-003": "#9597C8",
  "31000240-009": "#D8AC7C",
  "31000240-010": "#E0A47C",
  "31000243-040": "#FFBCCC",
  "31000243-043": "#DDA17F",
  "31000243-044": "#D06454",
  "31000243-048": "#F09C74",
  "31000243-054": "#F86C84",
  "31000243-055": "#F0D4B4",
  "31000243-058": "#DC7B73",
  "31000243-060": "#A46965",
  "31000244-103": "#F8947C",
  "31000244-105": "#F88C84",
  "31000244-109": "#FFB49C",
  "31000245-100": "#E2C4A8",
  "31000245-110": "#B99971",
  "31000245-120": "#C7A580",
  "31000245-130": "#CEAB8D",
  "31000245-140": "#C99776",
  "31000245-150": "#93654B",
  "31000246-108": "#D69C6E",
  "31000246-135": "#B07547",
  "31000263-005": "#D4B79E",
  "31000263-006": "#C4AF9C",
  "31000263-007": "#EDE0D7",
  "31000263-008": "#D3AE91",
  "31000263-009": "#DB9F6B",
  "31000263-010": "#B88A6E",
  "31000263-011": "#A6C099",
  "31000263-012": "#E8AA9D",
  "31000263-013": "#C75C38",
  "31000274-030": "#F1BC9A",
  "31000274-040": "#E0AA88",
  "32000009-001": "#101012",
  "32000009-002": "#111111",
  "32000138-003": "#513D36",
  "32000138-004": "#483435",
  "33000021-002": "#924943",
  "33000021-006": "#842D33",
  "33000021-007": "#A70A1F",
  "33000021-018": "#994A45",
  "33000021-054": "#9C5E53",
  "33000021-055": "#A35445",
  "33000021-056": "#973951",
  "33000021-058": "#A9584B",
  "33000021-061": "#BF2428",
  "33000036-014": "#602020",
  "33000036-015": "#7E3E34",
  "33000036-017": "#76463A",
  "33000036-018": "#773B3D",
  "33000068-001": "#F1E6EA",
  "33000068-002": "#B0584A",
  "33000068-003": "#AF6A6F",
  "33000068-005": "#9D2032",
  "33000117-001": "#D48A81",
  "33000117-002": "#C46D66",
  "33000117-003": "#AE605C",
  "33000117-004": "#D16A65",
  "33000117-006": "#EB553C",
  "33000117-008": "#AF033D",
  "33000117-012": "#A33C3F",
  "33000117-013": "#9E4F48",
  "33000117-019": "#B9636C",
  "33000117-020": "#C46B63",
  "33000117-021": "#DC7179",
  "33000117-022": "#C15A4B",
  "33000117-023": "#9C2332",
  "33000143-002": "#BD8576",
  "33000143-005": "#CA5C65",
  "33000143-008": "#8B434E",
  "33000143-009": "#8F382F",
  "33000143-010": "#6E2320",
  "33000143-011": "#AE0009",
  "33000143-013": "#58050F",
  "33000146-001": "#FE003E",
  "33000146-002": "#E00B1F",
  "33000146-003": "#8E0010",
  "33000152-001": "#7F5547",
  "33000152-002": "#946666",
  "33000152-003": "#8A4A49",
  "33000152-005": "#643C33",
  "33000152-007": "#844A3F",
  "33000152-008": "#8A4C61",
  "33000152-009": "#A27073",
  "33000152-010": "#994954",
  "33000152-012": "#98122B",
  "33000152-013": "#5D2E40",
  "33000152-017": "#8A1617",
  "33000155-001": "#EAE1DC",
  "33000155-009": "#C60023",
  "33000155-016": "#76202B",
  "33000155-023": "#E58090",
  "33000155-026": "#E86A80",
  "33000176-001": "#FF7FDE",
  "33000176-002": "#DE7154",
  "33000176-003": "#E37480",
  "33000179-002": "#BA6A4D",
  "33000179-004": "#D18671",
  "33000179-006": "#FF4D64",
  "34000007-JL01": "#F4F3EF",
  "34000007-JL05": "#800000",
  "34000007-JL23": "#B40001",
  "34000007-JL31": "#CA8C73",
  "34000007-JL38": "#64001D",
  "34000007-JL59": "#8B4F59",
  "34000072-001": "#FDFCFA",
  "34000072-003": "#CFCBD9",
  "34000072-013": "#A16A63",
  "34000081-011": "#EF7464",
  "34000081-310": "#F2F1EF",
  "34000081-321": "#940000",
  "34000081-377": "#DE0019",
  "34000081-405": "#5A0000",
  "34000081-406": "#460203",
  "34000081-410": "#461447",
  "34000081-416": "#4F0003",
  "34000081-428": "#3F2D1F",
  "34000081-452": "#011039",
  "34000081-539": "#904530",
  "34000082-QD04": "#9C0100",
  "34000082-QD11": "#F5D5C8",
  "34000082-QD22": "#5C0108",
  "34000093-GL36": "#000000",
  "34000093-GL39": "#DCB2B3",
  "34000093-GL43": "#8E6058",
  "41000020-003": "#9F4952",
  "41000020-004": "#E9518E",
  "41000020-005": "#7F4460",
  "41000021-002": "#A97B63",
  "41000021-003": "#7D5242",
  "41000028-005": "#BA9173",
  "41000028-006": "#B08362",
  "41000028-007": "#A36F47",
  "41000028-008": "#7E4528",
  "41000029-005": "#C19169",
  "41000029-006": "#C18D5E",
  "41000029-007": "#BA7D51",
  "41000029-008": "#7C4326",
  "43000010-001": "#D1375B",
  "43000010-002": "#A6221A",
  "43000010-003": "#8F2D29",
  "43000011-002": "#F7A7B7",
  "43000011-003": "#C05E3C",
  "43000012-001": "#FF4D64",
  "43000012-002": "#C5CFFC",
  "43000012-003": "#F7A3AC",
  "43000014-003": "#9C414A",
  "43000014-004": "#D65A64",
  "43000014-005": "#B55E6E",
  "43000015-001": "#D17769",
  "43000015-002": "#FF6D69",
  "43000015-003": "#CD6052",
  "43000015-004": "#B32034",
  "47000001-105": "#6C4534",
  "47000001-113": "#FDFDFD",
  "47000037-205": "#89323B",
  "47000037-242": "#43141E",
  "47000037-244": "#4F1C1B",
};
