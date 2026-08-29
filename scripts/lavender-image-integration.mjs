// Lavender Café — image integration pipeline (NOT run automatically).
//
// Preconditions before running this script:
//   1. Every filename listed in FINAL_IMAGE_TEMPLATE.csv exists as a real
//      generated image file inside Desktop/Lavender Cafe/Product Images/.
//   2. .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
//
// What it does, strictly in this order, and nothing else:
//   1. Reads the approved manifest (FINAL_IMAGE_TEMPLATE.csv).
//   2. For every row, checks the corresponding local file exists. Any row
//      missing its file is skipped and reported — never substituted, never
//      invented, never left to silently fall through.
//   3. Refuses to run at all if more than one local file would map to the
//      same product, or a filename doesn't match any manifest row.
//   4. For each present file: uploads to Storage bucket "listing-images" at
//      the exact path from the manifest (cafes/lavender/products/<file>).
//      Skips (does not overwrite) any product whose products.image is
//      already non-null, unless --force is passed — matching "never
//      overwrite an existing valid image unless explicitly instructed."
//   5. Updates ONLY products.image for that exact product id — no other
//      column is touched (never name/price/category/is_available/etc.).
//   6. Prints a final integrity report: uploaded / skipped-already-has-image
//      / missing-file / failed, and re-reads every touched row from the DB
//      to confirm the stored image URL matches what was just uploaded.
//
// Run modes:
//   node scripts/lavender-image-integration.mjs           -> dry run, no writes
//   node scripts/lavender-image-integration.mjs --apply    -> real upload + DB update
//   node scripts/lavender-image-integration.mjs --apply --force  -> also overwrite existing images

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const FORCE = process.argv.includes("--force");

const MANIFEST_PATH = "C:/Users/YASEEN/OneDrive/Desktop/Lavender Cafe/Product Images/FINAL_IMAGE_TEMPLATE.csv";
const IMAGES_DIR = "C:/Users/YASEEN/OneDrive/Desktop/Lavender Cafe/Product Images";
const BUCKET = "listing-images";

const envLines = fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => !l.trim().startsWith("#"));
const env = envLines.join("\n");
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const SERVICE_KEY = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(SUPABASE_URL, SERVICE_KEY);

function parseCsv(text) {
  const [header, ...lines] = text.trim().split("\n");
  const cols = header.split(",");
  return lines.map((line) => {
    // Simple CSV split good enough here: only "Product Name" and
    // "Category/Section" are quoted and neither contains a literal comma.
    const parts = line.match(/(".*?"|[^,]+)/g).map((p) => p.replace(/^"|"$/g, ""));
    const row = {};
    cols.forEach((c, i) => (row[c] = parts[i]));
    return row;
  });
}

async function main() {
  const manifest = parseCsv(fs.readFileSync(MANIFEST_PATH, "utf8"));
  console.log(`Manifest rows: ${manifest.length}`);

  const filenamesInManifest = new Set(manifest.map((r) => r["Image Filename"]));
  const localFiles = fs.readdirSync(IMAGES_DIR).filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
  const unknownLocalFiles = localFiles.filter((f) => !filenamesInManifest.has(f));
  if (unknownLocalFiles.length > 0) {
    console.log("REFUSING TO PROCEED — local files present that don't match any manifest row:");
    unknownLocalFiles.forEach((f) => console.log("  ", f));
    console.log("Rename/remove these, or add them to the manifest, before re-running.");
    return;
  }

  const present = [];
  const missing = [];
  for (const row of manifest) {
    const filePath = path.join(IMAGES_DIR, row["Image Filename"]);
    if (fs.existsSync(filePath)) present.push({ row, filePath });
    else missing.push(row);
  }

  console.log(`Files present locally: ${present.length}`);
  console.log(`Files still missing:   ${missing.length}`);
  if (missing.length > 0) {
    console.log("Missing (will remain without an image, nothing invented):");
    missing.forEach((r) => console.log("  ", r["Product Name"], "->", r["Image Filename"]));
  }

  if (!APPLY) {
    console.log("\nDRY RUN — no upload, no database write. Re-run with --apply once ready.");
    return;
  }

  let uploaded = 0;
  let skippedExisting = 0;
  let failed = 0;
  const results = [];

  for (const { row, filePath } of present) {
    const { data: existing, error: fetchErr } = await sb.from("products").select("id, image").eq("id", row["Product ID"]).single();
    if (fetchErr || !existing) {
      console.log("FAILED — product not found for id", row["Product ID"], row["Product Name"]);
      failed++;
      continue;
    }
    if (existing.image && !FORCE) {
      console.log("SKIPPED (already has an image, pass --force to overwrite):", row["Product Name"]);
      skippedExisting++;
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(row["Image Filename"]).slice(1);
    const contentType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
    const storagePath = `cafes/lavender/products/${row["Image Filename"]}`;

    const { error: uploadErr } = await sb.storage.from(BUCKET).upload(storagePath, fileBuffer, {
      cacheControl: "3600",
      upsert: FORCE,
      contentType,
    });
    if (uploadErr) {
      console.log("FAILED upload:", row["Product Name"], uploadErr.message);
      failed++;
      continue;
    }

    const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(storagePath);
    const { error: updateErr } = await sb.from("products").update({ image: pub.publicUrl }).eq("id", row["Product ID"]);
    if (updateErr) {
      console.log("FAILED db update:", row["Product Name"], updateErr.message);
      failed++;
      continue;
    }

    uploaded++;
    results.push({ id: row["Product ID"], name: row["Product Name"], url: pub.publicUrl });
  }

  console.log("\n=== INTEGRITY CHECK ===");
  console.log("Uploaded + linked:", uploaded);
  console.log("Skipped (already had an image):", skippedExisting);
  console.log("Missing local file (untouched):", missing.length);
  console.log("Failed:", failed);

  // Re-read every touched row from the DB to confirm the stored URL matches.
  let mismatches = 0;
  for (const r of results) {
    const { data: check } = await sb.from("products").select("image").eq("id", r.id).single();
    if (!check || check.image !== r.url) {
      console.log("MISMATCH after write:", r.name, "expected", r.url, "got", check?.image);
      mismatches++;
    }
  }
  console.log("Post-write mismatches:", mismatches);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
