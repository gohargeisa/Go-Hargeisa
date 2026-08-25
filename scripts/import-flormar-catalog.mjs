// Flormar catalog re-import from the new Excel workbook
// (Desktop/Flormar/Flormar_Hargeisa_Catalog_Ready_for_Import.xlsx).
//
// Run modes:
//   node scripts/import-flormar-catalog.mjs           -> dry run (no writes)
//   node scripts/import-flormar-catalog.mjs --apply    -> writes to the DB
//
// Approach (see conversation for the two explicit decisions this
// implements): the 526 "Other / Review" rows are imported under a new
// generic "other" category rather than dropped; "Eyes"/"Lips"/"Face" get
// their own new categories instead of folding into "Makeup". Gender is left
// unset everywhere — the source has no gender/Unisex column at all, so
// nothing is invented. Shade/variant siblings are reconstructed from the
// Internal Reference SKU prefix (everything before the last "-"), which
// matches how this same catalog is already modeled in the DB (1053 existing
// product_variants rows across exactly this shape of grouping).
import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const APPLY = process.argv.includes("--apply");

const envLines = fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => !l.trim().startsWith("#"));
const env = envLines.join("\n");
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

const FLORMAR_ID = "8f8e09ea-28b0-4604-95cd-9d0cb8dd0f80";
const EXCEL_PATH = "C:/Users/YASEEN/OneDrive/Desktop/Flormar/Flormar_Hargeisa_Catalog_Ready_for_Import.xlsx";

const CATEGORY_MAP = {
  Eyes: "eyes",
  Nails: "nail_care",
  Lips: "lips",
  Face: "face",
  Skincare: "skincare_creams",
  "Tools & Accessories": "beauty_tools_accessories",
  "Body Care": "body_care",
  "Other / Review": "other",
};

function titleCase(s) {
  return s
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Splits an Internal Reference into (skuPrefix, shadeCode) on the LAST
 * hyphen — e.g. "31000179-001" -> ("31000179", "001"), "34000014-FC44" ->
 * ("34000014", "FC44"). A ref with no hyphen is its own standalone group. */
function splitRef(ref) {
  const idx = ref.lastIndexOf("-");
  if (idx === -1) return { skuPrefix: ref, shadeCode: "" };
  return { skuPrefix: ref.slice(0, idx), shadeCode: ref.slice(idx + 1) };
}

/** Finds where a row's own shade code appears inside its own Name and
 * splits there: text before -> base product name, text after -> the
 * shade's own display label. Tries the exact code first (works for
 * "31000179-001" / "...-001 FAIR"), then falls back to just the code's
 * trailing digits (works for "34000014-FC44" / "...FCNE-44 TROPIC BROWN",
 * where the letter prefix isn't repeated in the Name). If neither is
 * found, returns the whole Name as base with no separate shade label —
 * degraded but never wrong: the row still imports correctly, just without
 * a prettified shade name. */
/** Finds `needle` inside `haystack` at a digit-boundary — i.e. not
 * immediately preceded or followed by another digit — so searching for
 * "01" in "PMD-01 BEIGE" matches correctly, but searching for "1" doesn't
 * accidentally match the "1" inside an unrelated "14". Returns -1 if no
 * boundary-respecting match exists. */
function findAtDigitBoundary(haystack, needle) {
  let from = 0;
  while (true) {
    const idx = haystack.indexOf(needle, from);
    if (idx === -1) return -1;
    const before = haystack[idx - 1];
    const after = haystack[idx + needle.length];
    if (!/[0-9]/.test(before ?? "") && !/[0-9]/.test(after ?? "")) return idx;
    from = idx + 1;
  }
}

function splitName(name, shadeCode) {
  const upperName = name.toUpperCase();
  const tryCode = shadeCode.toUpperCase();

  // Candidates in order of preference: the exact code, then the same code
  // with leading zeros progressively stripped (the source data isn't
  // consistent about zero-padding shade numbers inside the free-text Name
  // vs. the Internal Reference, e.g. code "001" appears as "-01" or "-1"
  // in the Name for some product lines).
  const candidates = [tryCode];
  const digitsOnly = tryCode.replace(/[^0-9]/g, "");
  if (digitsOnly && digitsOnly !== tryCode) candidates.push(digitsOnly);
  if (digitsOnly) {
    let stripped = digitsOnly;
    while (stripped.length > 1 && stripped[0] === "0") {
      stripped = stripped.slice(1);
      candidates.push(stripped);
    }
  }

  let idx = -1;
  let matchLen = 0;
  for (const c of candidates) {
    if (!c) continue;
    const found = findAtDigitBoundary(upperName, c);
    if (found !== -1) {
      idx = found;
      matchLen = c.length;
      break;
    }
  }

  if (idx === -1) return { base: titleCase(name), shadeLabel: null };

  const base = name.slice(0, idx).replace(/[-\s]+$/, "").trim();
  const trailing = name.slice(idx + matchLen).replace(/^[-\s.]+/, "").trim();
  // The code itself (e.g. "227") is sometimes the only differentiator —
  // nothing descriptive follows it in the Name ("...FMS-227" at the very
  // end). Falling back to the code as the shade's own label beats leaving
  // it unset when a real match was found.
  const shadeLabel = trailing || shadeCode;
  return { base: titleCase(base || name), shadeLabel: shadeLabel ? titleCase(shadeLabel) : null };
}

function loadCatalog() {
  const wb = xlsx.readFile(EXCEL_PATH);
  const rows = xlsx.utils.sheet_to_json(wb.Sheets["Products"], { defval: null });

  const seen = new Set();
  const clean = [];
  for (const r of rows) {
    const ref = r["Internal Reference"] ? String(r["Internal Reference"]).trim() : "";
    if (!ref || seen.has(ref)) continue;
    seen.add(ref);
    clean.push({
      ref,
      name: String(r.Name ?? "").trim(),
      price: Number(r["Sales Price"]) || 0,
      qty: Number(r["Quantity On Hand"]) || 0,
      category: CATEGORY_MAP[r.Category] ?? "other",
      inStock: r["Stock Status"] === "In Stock",
    });
  }
  return clean;
}

function buildGroups(rows) {
  const groups = new Map();
  for (const r of rows) {
    const { skuPrefix, shadeCode } = splitRef(r.ref);
    const list = groups.get(skuPrefix) ?? [];
    list.push({ ...r, shadeCode });
    groups.set(skuPrefix, list);
  }
  return groups;
}

async function loadExistingImages() {
  const { data: products } = await sb
    .from("products")
    .select("sku, image")
    .eq("listing_type", "city_service")
    .eq("listing_id", FLORMAR_ID)
    .not("image", "is", null);
  const { data: existingProductIds } = await sb.from("products").select("id").eq("listing_type", "city_service").eq("listing_id", FLORMAR_ID);
  const ids = (existingProductIds ?? []).map((p) => p.id);
  const { data: variants } = ids.length
    ? await sb.from("product_variants").select("sku, image").in("product_id", ids).not("image", "is", null)
    : { data: [] };

  const map = new Map();
  for (const p of products ?? []) if (p.sku && p.image) map.set(p.sku.toUpperCase(), p.image);
  for (const v of variants ?? []) if (v.sku && v.image) map.set(v.sku.toUpperCase(), v.image);
  return map;
}

async function main() {
  const rows = loadCatalog();
  const groups = buildGroups(rows);
  const imageBySku = await loadExistingImages();

  const parentInserts = [];
  const variantsByGroupIndex = [];
  let imagesReused = 0;
  let namesUnsplit = 0;

  for (const [skuPrefix, members] of groups) {
    if (members.length === 1) {
      const m = members[0];
      const image = imageBySku.get(m.ref.toUpperCase()) ?? null;
      if (image) imagesReused++;
      parentInserts.push({
        listing_type: "city_service",
        listing_id: FLORMAR_ID,
        name: titleCase(m.name),
        brand: "Flormar",
        category: m.category,
        price: m.price,
        currency: "USD",
        image,
        is_available: m.inStock,
        sku: m.ref,
        stock_quantity: m.qty,
        sort_order: 0,
      });
      variantsByGroupIndex.push(null);
      continue;
    }

    // Multi-member group: one parent product + N shade variants.
    const splits = members.map((m) => ({ ...m, ...splitName(m.name, m.shadeCode) }));
    if (splits.some((s) => s.shadeLabel === null)) namesUnsplit++;
    // Base name: the shortest non-empty base among members (most likely
    // the cleanest cut — a longer "base" on another row usually means its
    // own code match landed later than it should have).
    const base = splits.map((s) => s.base).filter(Boolean).sort((a, b) => a.length - b.length)[0] ?? titleCase(members[0].name);

    const anyAvailable = members.some((m) => m.inStock);
    const minPrice = Math.min(...members.map((m) => m.price));
    const totalQty = members.reduce((sum, m) => sum + m.qty, 0);
    // Most common category among the group's members, not just the first
    // row — the source sheet has occasional single-row mis-tags within an
    // otherwise-uniform group (e.g. one "Eyebrows" row inside 13 "Blush"
    // rows); the majority vote is far more reliable than row order.
    const catTally = new Map();
    for (const m of members) catTally.set(m.category, (catTally.get(m.category) ?? 0) + 1);
    const category = [...catTally.entries()].sort((a, b) => b[1] - a[1])[0][0];

    parentInserts.push({
      listing_type: "city_service",
      listing_id: FLORMAR_ID,
      name: base,
      brand: "Flormar",
      category,
      price: minPrice,
      currency: "USD",
      image: null, // set below once we know if any variant has a reusable image
      is_available: anyAvailable,
      sku: skuPrefix,
      stock_quantity: totalQty,
      sort_order: 0,
    });

    const variantRows = splits.map((s, i) => {
      const image = imageBySku.get(s.ref.toUpperCase()) ?? null;
      if (image) imagesReused++;
      return {
        name: s.shadeLabel ?? s.name,
        shade_name: s.shadeLabel ?? null,
        shade_code: s.shadeCode || null,
        image,
        sku: s.ref,
        price: s.price,
        is_available: s.inStock,
        sort_order: i,
      };
    });
    // Parent card shows the first available (or just first) variant's own
    // image, if any were found — better than no image when at least one
    // shade has a verified real photo.
    const withImage = variantRows.find((v) => v.image);
    if (withImage) parentInserts[parentInserts.length - 1].image = withImage.image;
    variantsByGroupIndex.push(variantRows);
  }

  const standaloneCount = variantsByGroupIndex.filter((v) => v === null).length;
  const groupedCount = variantsByGroupIndex.filter((v) => v !== null).length;
  const totalVariantRows = variantsByGroupIndex.filter((v) => v !== null).reduce((s, v) => s + v.length, 0);
  const catCounts = {};
  for (const p of parentInserts) catCounts[p.category] = (catCounts[p.category] ?? 0) + 1;

  console.log("=== Flormar catalog import summary ===");
  console.log("Source rows (deduped):", rows.length);
  console.log("Parent products to create:", parentInserts.length, `(${standaloneCount} standalone + ${groupedCount} with variants)`);
  console.log("Variant rows to create:", totalVariantRows);
  console.log("Images reused from existing verified data:", imagesReused, "of", rows.length, "source rows");
  console.log("Groups where shade-name splitting fell back to the raw name:", namesUnsplit, "of", groupedCount);
  console.log("Category distribution:", catCounts);
  console.log("\nSample parent products:");
  for (const p of parentInserts.slice(0, 5)) console.log(" ", JSON.stringify({ name: p.name, category: p.category, price: p.price, sku: p.sku, image: p.image ? "yes" : "no" }));

  if (process.argv.includes("--dump")) {
    fs.writeFileSync(
      "scripts/tmp-flormar-dump.json",
      JSON.stringify(
        {
          parents: parentInserts.map((p, i) => ({ ...p, variants: variantsByGroupIndex[i] })),
        },
        null,
        2
      )
    );
    console.log("\nFull dump written to scripts/tmp-flormar-dump.json");
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no database writes performed. Re-run with --apply to write.");
    return;
  }

  console.log("\n=== APPLYING to production ===");
  const { error: delErr } = await sb.from("products").delete().eq("listing_type", "city_service").eq("listing_id", FLORMAR_ID);
  if (delErr) throw new Error("Failed to clear existing Flormar products: " + delErr.message);
  console.log("Cleared existing Flormar products (variants cascade-deleted automatically).");

  const CHUNK = 200;
  const insertedIds = [];
  for (let i = 0; i < parentInserts.length; i += CHUNK) {
    const chunk = parentInserts.slice(i, i + CHUNK);
    const { data, error } = await sb.from("products").insert(chunk).select("id");
    if (error) throw new Error("Product insert failed at chunk " + i + ": " + error.message);
    insertedIds.push(...data.map((d) => d.id));
  }
  console.log("Inserted", insertedIds.length, "parent products.");

  const variantInserts = [];
  for (let i = 0; i < parentInserts.length; i++) {
    const vRows = variantsByGroupIndex[i];
    if (!vRows) continue;
    const productId = insertedIds[i];
    for (const v of vRows) variantInserts.push({ product_id: productId, ...v });
  }
  for (let i = 0; i < variantInserts.length; i += CHUNK) {
    const chunk = variantInserts.slice(i, i + CHUNK);
    const { error } = await sb.from("product_variants").insert(chunk);
    if (error) throw new Error("Variant insert failed at chunk " + i + ": " + error.message);
  }
  console.log("Inserted", variantInserts.length, "variant rows.");
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
