#!/usr/bin/env node
// ============================================================================
// Go Hargeisa — generic supermarket product import (CSV or JSON)
//
// No legitimate public product API/catalog was found for Waafi Market (see
// the investigation notes in this session's final report) — the official
// waafimarket.com is a "Launching Soon" placeholder and the app's own data
// isn't reachable through any legitimate public endpoint. This script is
// the fallback the task asked for: once Waafi Market (or any future
// supermarket partner) provides a real CSV/JSON export, running this
// imports it safely.
//
// Idempotent: matches existing rows by (listing_type, listing_id,
// external_source, external_product_id) and UPDATEs them instead of
// inserting a duplicate — running the same file twice is a no-op the
// second time (beyond refreshing last_synced_at/price/availability). This
// relies on the unique index added by
// supabase/migrations/20260905000001_supermarket_partner_and_product_import_fields.sql
// — that migration must be applied before this script is run (it adds
// columns this script writes to: external_product_id, external_source,
// last_synced_at, sale_price, size, unit — none of which exist on the
// live `products` table yet).
//
// A row that fails validation is skipped and logged — never aborts the
// whole run, and never deletes/touches any product it didn't just import
// (no bulk delete anywhere in this file).
//
// Usage:
//   node scripts/import-supermarket-products.mjs --slug waafi-market --file catalog.csv
//   node scripts/import-supermarket-products.mjs --slug waafi-market --file catalog.json --source waafi_market
//
// CSV columns (header row required): name,name_ar,name_so,category,brand,
//   description,description_ar,description_so,price,sale_price,currency,
//   image,gallery,sku,is_available,stock_quantity,size,unit
// JSON: an array of objects with the same field names. `gallery` may be a
// JSON array of URLs (JSON import) or a "|"-separated list of URLs (CSV).
//
// Only `name` and `price` are required per row; everything else is
// optional and left null/unset if absent — this script never invents a
// value for a missing field. There is no "subcategory" or generic
// "metadata" column on `products` today — if the real catalog needs a
// subcategory, encode it into `category` (e.g. "Groceries/Dairy") until a
// real need justifies a schema change; don't invent one speculatively.
// "Partner ID" isn't a per-row field — it's resolved once from --slug.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { readFileSync } from "fs";

config({ path: ".env.local" });

function parseArgs() {
  const args = Object.fromEntries(
    process.argv.slice(2).reduce((pairs, arg, i, arr) => {
      if (arg.startsWith("--")) pairs.push([arg.slice(2), arr[i + 1]]);
      return pairs;
    }, [])
  );
  if (!args.file || !args.slug) {
    console.error("Usage: node scripts/import-supermarket-products.mjs --slug <city_services slug> --file <csv-or-json> [--source waafi_market]");
    process.exit(1);
  }
  return { file: args.file, slug: args.slug, source: args.source ?? "waafi_market" };
}

function parseCsvLine(line) {
  // Minimal CSV field splitter with quoted-field support — sufficient for a
  // supplier export (no embedded newlines inside a quoted field).
  const fields = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { fields.push(cur); cur = ""; }
    else cur += ch;
  }
  fields.push(cur);
  return fields.map((f) => f.trim());
}

function loadRows(filePath) {
  const raw = readFileSync(filePath, "utf8");
  if (filePath.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("JSON import file must be an array of product objects");
    return parsed;
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

function toNullableNumber(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const TRUTHY_STRINGS = ["true", "1", "yes"];

function toBoolean(v, fallback = true) {
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "boolean") return v;
  return TRUTHY_STRINGS.includes(String(v).trim().toLowerCase());
}

function toGallery(v) {
  if (v === undefined || v === null || v === "") return [];
  if (Array.isArray(v)) return v.filter((u) => typeof u === "string" && u.trim().length > 0);
  return String(v)
    .split("|")
    .map((u) => u.trim())
    .filter(Boolean);
}

async function main() {
  const { file, slug, source } = parseArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  const admin = createClient(url, key);

  const { data: listing, error: listingError } = await admin.from("city_services").select("id, name, category_id, status").eq("slug", slug).single();
  if (listingError || !listing) throw new Error(`No city_services row found for slug "${slug}": ${listingError?.message ?? "not found"}`);

  const { data: category } = await admin.from("categories").select("supports_products").eq("id", listing.category_id).maybeSingle();
  if (!category?.supports_products) {
    console.warn(
      `WARNING: "${listing.name}"'s category does not have supports_products=true — imported products will be stored but won't display anywhere on the site until that's enabled.`
    );
  }
  if (listing.status !== "published") {
    console.warn(`NOTE: "${listing.name}" is currently status="${listing.status}" — importing products does not publish the listing itself.`);
  }

  const rows = loadRows(file);
  console.log(`Loaded ${rows.length} row(s) from ${file} for "${listing.name}" (${slug}).`);

  let imported = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  for (const [i, row] of rows.entries()) {
    const name = (row.name ?? "").trim();
    const price = toNullableNumber(row.price);
    const externalId = (row.external_product_id ?? row.sku ?? row.id ?? "").toString().trim();

    if (!name || price === null) {
      console.warn(`Row ${i + 1}: skipped — missing required "name" or "price".`);
      skipped++;
      continue;
    }
    if (!externalId) {
      console.warn(`Row ${i + 1} ("${name}"): skipped — no external_product_id/sku/id to key on; cannot guarantee idempotency without one.`);
      skipped++;
      continue;
    }

    // Optional fields are only included in the upsert payload when the
    // source row actually provides a value — PostgREST's upsert only
    // touches the columns present in the request body, so a field omitted
    // here is left exactly as it was on a re-sync, never nulled out. This
    // is what makes "preserve internal Go Hargeisa fields" (e.g. a manual
    // edit to a description, or a gallery curated by hand in the admin)
    // actually true across repeated syncs, not just on first import.
    const record = {
      listing_type: "city_service",
      listing_id: listing.id,
      name,
      price,
      external_product_id: externalId,
      external_source: source,
      last_synced_at: now,
      // Only set on insert/re-sync when the source actually specifies it —
      // same "don't clobber what's already there" reasoning as every other
      // optional field below. A brand-new row still gets the DB's own
      // `is_available default true` when this column is omitted entirely.
      ...(row.is_available !== undefined && row.is_available !== "" ? { is_available: toBoolean(row.is_available, true) } : {}),
      ...(row.name_ar ? { name_ar: row.name_ar } : {}),
      ...(row.name_so ? { name_so: row.name_so } : {}),
      ...(row.description ? { description: row.description } : {}),
      ...(row.description_ar ? { description_ar: row.description_ar } : {}),
      ...(row.description_so ? { description_so: row.description_so } : {}),
      ...(row.brand ? { brand: row.brand } : {}),
      ...(row.category ? { category: row.category } : {}),
      ...(row.sale_price !== undefined && row.sale_price !== "" ? { sale_price: toNullableNumber(row.sale_price) } : {}),
      ...(row.currency ? { currency: row.currency } : {}),
      ...(row.image ? { image: row.image } : {}),
      ...(row.gallery ? { gallery: toGallery(row.gallery) } : {}),
      ...(row.sku ? { sku: row.sku } : {}),
      ...(row.stock_quantity !== undefined && row.stock_quantity !== "" ? { stock_quantity: toNullableNumber(row.stock_quantity) } : {}),
      ...(row.size ? { size: row.size } : {}),
      ...(row.unit ? { unit: row.unit } : {}),
    };

    const { error } = await admin
      .from("products")
      .upsert(record, { onConflict: "listing_type,listing_id,external_source,external_product_id" });

    if (error) {
      console.error(`Row ${i + 1} ("${name}"): FAILED — ${error.message}`);
      skipped++;
      continue;
    }
    imported++;
  }

  console.log(`\nDone. Imported/updated: ${imported}. Skipped: ${skipped}. Total rows: ${rows.length}.`);
}

main().catch((err) => {
  console.error("Import failed:", err.message);
  process.exit(1);
});
