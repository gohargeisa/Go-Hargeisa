// Regenerates lib/config/flormar-product-details.ts from the committed
// catalogue reconciliation (docs/flormar-product-catalog.json) filtered down
// to SKUs that still exist in the live Flormar `products` / `product_variants`
// rows. Read the generated file's own header for what it is and why it exists.
//
//   node scripts/generate-flormar-product-details.mjs
//
// Needs .env.local (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) to
// read the current catalogue; makes NO writes to the database.
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const FID = "8f8e09ea-28b0-4604-95cd-9d0cb8dd0f80";

const catalog = JSON.parse(fs.readFileSync("docs/flormar-product-catalog.json", "utf8"));

let prods = [];
for (let f = 0; ; f += 1000) {
  const { data } = await sb.from("products").select("id,sku").eq("listing_id", FID).range(f, f + 999);
  prods.push(...data);
  if (data.length < 1000) break;
}
const dbProductSkus = new Set(prods.map((p) => p.sku));
const ids = prods.map((p) => p.id);
let vars = [];
for (let i = 0; i < ids.length; i += 150) {
  const { data } = await sb.from("product_variants").select("sku").in("product_id", ids.slice(i, i + 150));
  vars.push(...data);
}
const dbVariantSkus = new Set(vars.map((v) => v.sku));

function sanitize(desc) {
  let d = String(desc).trim();
  // Drop a trailing research/sourcing note (not customer-facing copy). These
  // phrases only ever appear as a tacked-on final sentence, so matching to
  // end-of-string is safe.
  d = d.replace(/\s*(?:Sold on|Only (?:found|listed|available) on|Listed on|Available (?:only )?(?:on|via)|Found (?:only )?on|Per (?:the )?official)\b[\s\S]*$/i, "").trim();
  return d;
}

const descBySku = new Map();
for (const e of catalog) {
  if (!e.matchedSku || !e.description) continue;
  if (!dbProductSkus.has(e.matchedSku)) continue;
  if (!descBySku.has(e.matchedSku)) descBySku.set(e.matchedSku, { desc: sanitize(e.description), conf: e.matchConfidence, name: e.matchedProductName });
}

const hexByVariantSku = new Map();
for (const e of catalog) {
  if (!e.hexColor || !e.invoiceSku) continue;
  if (!dbVariantSkus.has(e.invoiceSku)) continue;
  if (!/^#[0-9a-fA-F]{6}$/.test(e.hexColor)) continue;
  hexByVariantSku.set(e.invoiceSku, e.hexColor.toUpperCase());
}
// Drop hexes that are NOT unique within their own product's shade set — the
// reconciliation occasionally reused one colour for two or three
// visually-similar shades it couldn't individually read off the pack shot,
// and rendering identical swatches for differently-named shades reads as a
// bug. Those shades fall back to the approximation / real photo instead.
{
  const groups = new Map();
  for (const [vsku, hex] of hexByVariantSku) {
    const base = vsku.split("-")[0];
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push([vsku, hex]);
  }
  for (const [, list] of groups) {
    const counts = {};
    for (const [, hex] of list) counts[hex] = (counts[hex] ?? 0) + 1;
    for (const [vsku, hex] of list) if (counts[hex] > 1) hexByVariantSku.delete(vsku);
  }
}

const descEntries = [...descBySku.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const hexEntries = [...hexByVariantSku.entries()].sort((a, b) => a[0].localeCompare(b[0]));
const q = (s) => JSON.stringify(s);

let out = `/**
 * Display-time product-detail overrides for Flormar Hargeisa, applied the
 * same way FLORMAR_CATEGORY_OVERRIDES / cleanFlormarProductName already are
 * (in FlormarStorefront's \`productsWithPricing\` memo) — read-only, keyed by
 * SKU, NEVER written back to the database.
 *
 * WHY THIS EXISTS: the live \`products\` rows were imported from a wholesale
 * spreadsheet that carries no description text and no verified shade colour,
 * so \`products.description\` is NULL on every row and \`product_variants.
 * hex_color\` is NULL on every row. A separate, earlier reconciliation
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
 * Coverage: ${descEntries.length} of the ~218 visible products have a verified
 * description; ${hexEntries.length} shade variants have a verified hex. Products
 * / shades not listed here fall back to their existing behaviour (no
 * description block; approximated swatch colour via flormar-shade-colors.ts).
 * All description matches are flormar.com-verified at HIGH or MEDIUM
 * confidence (docs/flormar-product-reconciliation.md, section E).
 */
export const FLORMAR_PRODUCT_DESCRIPTIONS: Record<string, string> = {
`;
for (const [sku, v] of descEntries) {
  out += `  // ${v.name}${v.conf === "MEDIUM" ? " [MEDIUM confidence]" : ""}\n`;
  out += `  ${q(sku)}: ${q(v.desc)},\n`;
}
out += `};

/**
 * Verified per-shade swatch colours, keyed by the FULL variant SKU
 * (\`product_variants.sku\`, e.g. "33000021-045"). Read off the official
 * Flormar pack shot for that exact shade during the reconciliation above.
 * Takes priority over resolveFlormarSwatchColor()'s word-match approximation
 * wherever present; a shade not listed here keeps the approximation.
 */
export const FLORMAR_SHADE_HEX: Record<string, string> = {
`;
for (const [sku, hex] of hexEntries) out += `  ${q(sku)}: ${q(hex)},\n`;
out += `};
`;

fs.writeFileSync("lib/config/flormar-product-details.ts", out);
console.log("wrote lib/config/flormar-product-details.ts —", descEntries.length, "descriptions,", hexEntries.length, "hexes");
