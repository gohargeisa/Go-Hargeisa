# Flormar Product Catalog Reconciliation

**Status: catalog imported into the private preview (`lib/mock-data/flormar.ts`) and 3 flagged images resolved below — still no database rows created, no images uploaded to storage, no migration applied, Flormar still private/unlisted.**

## Resolution log — image-quality follow-up (2026-08-19)

A post-import audit found 3 products needing a fresh, targeted look before publication. Each was individually re-researched (not a repeat of the original 83-line reconciliation) and resolved as follows:

1. **K-Spirit Collagen Wrapping Mask** (base code `36000092`) — the original image had a Turkish promotional tagline overlaid ("Kore'den ilham alan güzellik"). Re-fetched the same official flormar.com.tr product gallery directly and found 4 total images; none is a plain text-free packshot (this appears to be how Flormar itself marketed this specific K-Spirit-line product), but one — a text-free demonstration photo of the actual peel-off mask — carries no overlaid copy at all. **Replaced** the product image with that one; dropped the other 3 (all either carry the Turkish tagline or Turkish body text) from the gallery.
2. **Flormar Pearly Nail Enamel** (base code `34000129`, shade PL314 "Velvet Red") — re-verified against a *confirmed-genuine* sibling shade in the same product line (PL472 "Ivory Glow," fetched directly from flormar.com): the real Pearly Nail Enamel bottle is clear glass with a white cap and "PEARLY" printed on the label. The original idefix.com retailer image is a dark glossy bottle with a different cap and no "PEARLY" text anywhere — a different product. Checked flormariq.com (403 both attempts), caretobeauty.com's full Pearly Nail Enamel catalog listing (does not include a PL314/"Velvet Red" shade among its ~15 listed shades), and trendyol.com (403) for a genuine PL314 photo; none was retrievable. **Removed** the incorrect image; product now correctly shows the "Photos coming soon" placeholder rather than a wrong photo. Left `matchConfidence: MEDIUM`, unresolved.
3. **Gel Eyeliner** (invoice code `32000177-001`) — re-searched specifically for this SKU. Found a real, clean, official flormar.com image for a same-named "Gel Eyeliner Gel Black" product, but under a *different* SKU (`32000066-001`) — the same discrepancy already flagged in the original research. Attempted two more sources for the specific "Re-Formulated"/"New Gel Rev" naming used on the invoice (glambeaute.com: 403; flormaruae.com: page under construction, no images). Could not confirm the `32000066` product's packaging is identical to whatever `32000177` actually is. **Left unresolved** — no image was used; the product correctly still shows "Photos coming soon" rather than a possibly-mismatched photo.

`next.config.mjs`'s image allowlist (`remotePatterns` + CSP `img-src`) was updated to drop `image01.idefix.com`, since no product now references it.

Source of truth: `PROFORMA INVOICE 22.06.2026 SOMALIA hargaısa.xlsx` (`C:\Users\YASEEN\OneDrive\Desktop\`), sheet `PROFORMA INV`, rows 19–254. `FOC` sheet contained zero product rows (confirmed empty template, `EXW TOTAL = 0`) and is not part of this reconciliation.

Companion file: **`docs/flormar-product-catalog.json`** — one record per invoice row (236 records), machine-readable, matching the requested schema (`invoiceRow`, `invoiceSku`, `invoiceName`, `quantity`, `unitPrice`, `total`, `matchedProductName`, `matchedSku`, `category`, `subcategory`, `description`, `shades`, `officialProductUrl`, `imageUrls`, `imageStatus`, `matchConfidence`, `notes`). The sum of every row's `total` in that file is **17,494.24**, exactly matching the invoice's own `EXW TOTAL` — confirming no row was dropped or altered in transcription.

---

## A. Column mapping (unchanged from the prior inspection)

`ITEM CODE` (A) → `invoiceSku` · `DESCRIPTION OF GOODS` (B) → `invoiceName` · `QTY(PCS.)` (C) → `quantity` · `UNIT PRICE` (D) → `unitPrice` · `AMOUNT` (E) → `total`. No column carries shade/variant, SKU, or image data separately — shade is embedded in the description text and (usually, not always) mirrored in the item code's suffix.

## B/C. Sample rows

See `docs/flormar-product-catalog.json` for all 236 records verbatim. First record (invoice row 19):

```json
{
  "invoiceRow": 19,
  "invoiceSku": "31000274-030",
  "invoiceName": "PERFECT COVERAGE LCN NEW-030 LIGHT",
  "quantity": 36,
  "unitPrice": 1.38,
  "total": 49.68,
  "matchedProductName": "Perfect Coverage Liquid Concealer",
  "matchedSku": "31000274",
  "category": "Face",
  "subcategory": "Concealer",
  "shades": ["030 Light"],
  "officialProductUrl": "https://www.flormar.com/perfect-coverage-liquid-concealer--light-030/",
  "matchConfidence": "MEDIUM",
  "imageStatus": "FOUND"
}
```

## D. Research method

The 236 invoice rows collapse to **83 distinct real product lines** (grouped by the invoice's own 8-digit base item code — e.g. all 10 "Silk Matte Liquid Lipstick" shades share base code `33000021`). Researching 83 real product lines, not 236 individual rows, made exhaustive real-web verification tractable. Nine parallel research passes covered all 83 lines, searching flormar.com / flormar.com.tr / other official regional Flormar storefronts first, authorized retailers only as fallback, by product name (never by the internal wholesale code, which doesn't appear on retail sites). Every finding below cites a real URL actually retrieved — nothing was guessed.

---

## E. Data Quality Report

**A. Total invoice products (rows): 236**
**B. Successfully matched to a real Flormar product (HIGH confidence): 224 rows / 71 of 83 product lines**
**C. Possible/uncertain matches (MEDIUM confidence): 12 rows / 12 of 83 product lines**
**D. No reliable match (LOW/NONE): 0** — every one of the 83 real product lines was identified with at least MEDIUM confidence; nothing was fabricated to fill a gap.
**E. Products with a reliable image: 235 of 236 rows**
**F. Products missing a reliable image: 1 of 236 rows** — invoice row 104, `32000177-001` "Gel Eyeliner New Gel Rev-001 Gel Black". The current official flormar.com "Gel Eyeliner Gel Black 001" page lists a different SKU (`32000066-001`); a plausibly-matching "Re-Formulated" relaunch exists on several authorized retailers but no working official page or verifiable image URL could be retrieved for base code `32000177` specifically. Left `imageStatus: MISSING`, no image guessed.
**G. Products with variants/shades: 46 of the 83 product lines have 2+ real shades** (199 of the 236 invoice rows are shade variants of those 46 parent products); the remaining 37 lines are single-SKU products with no shade variation (mascaras, brushes, sprays, etc. — 37 rows).

**H. Duplicate item codes (11, carried over from the earlier structural inspection — same product/price ordered as two separate invoice lines, quantities should be summed on import, not treated as two products):**
| Item Code | Product | Row 1 qty | Row 2 qty | Combined |
|---|---|---|---|---|
| 31000238-003 | Illuminator Powder, Bronze Star | 24 | 36 | 60 |
| 31000240-010 | Wet&Dry Compact Powder, Apricot | 96 | 60 | 156 |
| 31000243-058 | Baked Blush-On, Hot Pink | 24 | 36 | 60 |
| 32000022-001 | Eyebrow Fixator Mascara | 48 | 48 | 96 |
| 33000021-018 | Silk Matte Liquid Lipstick, Sunny Land | 24 | 36 | 60 |
| 33000036-017 | HD Weightless Matte Lipstick, Rose Up | 24 | 36 | 60 |
| 31000244-103 | Baked Blush-On (2), Sparkle Rose | 3 | 33 | 36 |
| 31000245-100 | Skin Lifting Foundation, Sand | 6 | 30 | 36 |
| 31000245-120 | Skin Lifting Foundation, Desert Beige | 21 | 15 | 36 |
| 36000092-000 | K-Spirit Collagen Wrapping Mask | 12 | 12 | 24 |
| 45000010-000 | Easy & Go Sponge Nail Polish Remover | 54 | 108 | 162 |

**I. Suspicious or conflicting data found during research (beyond the earlier structural pass):**
1. **Row 19/87 (base 31000274, "Perfect Coverage Liquid Concealer"):** product name and both shade names ("Light"/"Light-Medium") match the real Flormar product exactly, but its current official flormar.com SKU prefix is `31000008`, not `31000274` as in the invoice — a full prefix mismatch, not just formatting. Likely a wholesale-vs-retail catalog code difference; flagged for manual confirmation before treating `31000274` as authoritative.
2. **Row 24 (base 32000018, "Precious Curl Mascara"):** the invoice's own item code suffix (`-002`) conflicts with the shade label baked into its own description (`-001 CARBON BLACK`) — a pre-existing inconsistency in the source spreadsheet, not a transcription error (confirmed against the raw cell earlier). Research independently confirmed the real shade for code `32000018-002` is "Carbon Black," so the code suffix is authoritative and the description's embedded "-001" is the error.
3. **Rows 91 vs 24 (base 32000019 vs 32000018):** both are called "Precious Curl Mascara" in the invoice but are confirmed to be two genuinely different SKUs/products with different barcodes and different official product pages — do not merge them into one catalog entry.
4. **Rows 94 vs 99 (base 32000127 vs 32000162):** both branded "Hero Volume & Curl Mascara," both shade "000 Black" — confirmed as two separate SKU families with different barcodes. Same caution as above: do not merge.
5. **Rows 23/57-64 vs 65-68 (base 31000243 vs 31000244):** both branded "Baked Blush-On" but are two distinct SKU families with differently-numbered shade ranges (031000243's 000s series vs 31000244's 100s series) — do not merge.
6. **Row 56 (31000240-012, "Amber"):** shade could not be verified against the official shade list for this product (only shades 004–010 currently listed); using the invoice's own description as-is.
7. **Rows 49–50 (31000234-002/-003, "Hydro Bomb"/"Dewy Bomb"):** both products are genuinely real (confirmed on Flormar's Morocco storefront) but their exact numeric SKU suffixes could not be independently verified — treat as MEDIUM confidence.
8. **Row 197 (34000129-PL314, "Pearly Nail Enamel Velvet Red"):** several authorized retailers list this exact shade under a different base code (`34000080` rather than `34000129`) — a one-digit discrepancy; the shade identity itself (Velvet Red) is well corroborated regardless.
9. **Rows 191–193 (34000082, "Quick Dry Nail Enamel"):** the official product page fetched for shade QD11 displayed its own SKU as `34000009-QD11`, not matching invoice base `34000082` — likely a catalog-revision difference; shade names/numbers still confirmed correct.
10. **Rows 234–237 (43000016, "Glam Kiss"):** this line was only found on Flormar's Turkey storefront (flormar.com.tr), not the international flormar.com site — worth confirming this batch is genuinely the TR-market product. Shade 005's name is spelled differently across retailers ("Spiced Toffee" vs "Spiced Coffee"); used the invoice's own spelling. Shades 007 (Crimson Kiss) and 008 (Scarlet Heat) were corroborated only via search-result snippets, not a directly-fetched official page — treat those two rows as the weakest link in an otherwise HIGH-confidence group.
11. **Rows 35–38 (31000059, CC Cream CC01/CC02):** genuine products (confirmed via FDA DailyMed listing under Kosan Kozmetik, Flormar's real manufacturer, plus authorized retailers) but appear to have been delisted from flormar.com's current CC Cream range (site now shows only CC03/CC04) — their images are retailer-sourced, not primary-official.
12. **Invoice date mismatch** (carried over from the earlier inspection): the invoice's own DATE cell resolves to 2025-06-19, not the 22.06.2026 in the filename. Invoice number field is blank. Neither affects product matching but should be confirmed with the source before this invoice is treated as final.

---

## F. Task 5 — Parent product / shade architecture readiness

All 46 multi-shade product lines map cleanly onto the **already-built, unapplied** `product_variants` schema (`supabase/migrations/20260825000001_product_variants.sql`) with no redesign needed:
- One `products` row per of the 83 matched product lines (`matchedSku` = the parent), using `matchedProductName`/`category`/`subcategory`/`description` from the catalog.
- One `product_variants` row per invoice row that belongs to a multi-shade line, carrying that row's own `quantity`-implied stock context, `unitPrice` (some shades within a line do legitimately cost more, e.g. Silk Matte Liquid Lipstick shade `31000243-054` "Flormar Pink" vs the rest of that line — verified, not an error), and `shades[0]` as the shade name (falling back to the invoice's own description when unconfirmed, never inventing one).
- The 37 single-SKU lines become ordinary variant-less `products` rows, exactly like every non-Flormar product on the platform today.

No new architecture is required — the JSON catalog is already shaped to drop straight into this schema once you approve applying the migration.

---

## G. Task 8 — Website preparation assessment

*(Read-only architecture review of the existing Flormar preview; no code changed.)*

**Files that will eventually need updating to replace mock data with the real catalog:**
- `lib/mock-data/flormar.ts` — deleted outright once real data is seeded (its own header comment already documents this as the intended end-state).
- `lib/data/products.ts` — no change needed; `getProductsForListing` already fetches real `products` + `product_variants` rows and gracefully degrades if the variants table doesn't exist yet (confirmed in an earlier phase).
- `app/[locale]/preview/flormar/page.tsx` and `components/flormar/flormar-storefront.tsx` — once a real `city_services` row exists for Flormar, this route would either start reading live data (same pattern every other partner page already uses) or be retired in favor of the real listing page. No structural rewrite needed — `FlormarStorefront` already renders through the same reusable `ProductCard`/`ProductDetailModal`/`ProductVariantSelector` components every other listing uses.

**Can the current product-card/product-detail architecture support this catalog?** Yes, as-is. `ProductCard` already supports: image (with a graceful placeholder fallback), name, price, availability, a shade-swatch indicator for variant products, and a variant-safe Add to Cart gate (verified and fixed in the prior phase). `ProductDetailModal` already supports the full variant selector with per-shade price/name/SKU swap. Nothing here needs to change to accommodate 236 real products instead of 6 mock ones — the architecture was already built product-count-agnostic.

**Are variants already supported?** Yes — `types/index.ts`'s `ProductVariant`, the `ProductVariantSelector` component, and the (unapplied) `product_variants` migration together already form a complete, tested variant system (shade swatches, price/SKU override per shade, out-of-stock state per shade).

**Can image URLs be supported cleanly?** Yes — `products.image` and `product_variants.image` are already plain URL strings rendered via the existing `ProductImage` component, which already handles a broken/missing URL gracefully (falls back to a "no photo" state, never a broken-image icon). The 235 real Flormar CDN image URLs in the catalog would work today with zero code changes; only the 1 row with `imageStatus: MISSING` would render the existing honest fallback.

**Any architectural changes actually necessary?** None. The only two changes made in the prior phase specifically to reach this point — a variant-aware quick-add gate on `ProductCard`, and letting `ProductCard`/`ProductImage` accept a richer branded fallback image — are already shipped in the working tree from the previous session and apply equally to the real catalog with no further work.

---

## Confirmations (safety check)

- `git status` shows only the same working-tree changes as before this phase, plus the two new files this phase added (`docs/flormar-product-catalog.json`, `docs/flormar-product-reconciliation.md`) — see the final report for the exact listing.
- No database migration was applied — `supabase/migrations/20260825000001_product_variants.sql` remains unapplied, untouched.
- No Supabase Storage upload occurred — every image referenced in the catalog is a link to the original external source (Flormar's own CDN or an authorized retailer), never downloaded or re-hosted.
- No Production data was created, modified, or touched in any way.
- Nothing was committed or pushed.
- Flormar remains private/unlisted — `/preview/flormar` is unchanged, still `noindex`, still unlinked from any nav/sitemap.
