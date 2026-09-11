// Additive asset step for the Excellence Café page (2026-09-11).
//
//  1. Installs the business's new official logo — a transparent-background
//     gold "Excellence Café" mark supplied by the owner (Desktop source,
//     never moved/renamed) — over the old placeholder at the SAME path the
//     DB/theme already point to. Transparency is preserved; no background,
//     no crop, aspect ratio (3:2) kept; only a straight down-resize for web.
//
//  2. Copies a few more real owner photos (verified frame-by-frame) that the
//     first curation missed — the covered garden terrace and a group table
//     setup — resized + q82 jpeg, same treatment as build-excellence-cafe-
//     photos.mjs. Source pixels otherwise untouched; originals never
//     modified.
//
// Safe to re-run (idempotent overwrite). Run from the repo root:
//   node scripts/update-excellence-cafe-assets.mjs
import sharp from "sharp";
import path from "node:path";

const DESKTOP = "C:/Users/YASEEN/OneDrive/Desktop/Excellence Café";
const SMASH = path.join(DESKTOP, "Smash");
const DEST = "public/images/partners/excellence-cafe";

// 1 — logo (transparent PNG, keep alpha, keep aspect, just shrink for web)
await sharp(path.join(DESKTOP, "logo.png"))
  .resize({ width: 1024, withoutEnlargement: true }) // 1024x683, 3:2 preserved
  .png({ compressionLevel: 9, quality: 90 })
  .toFile(path.join(DEST, "logo.png"));
console.log("✔ logo.png (transparent, 1024w)");

// 2 — additional verified photos
const jobs = [
  // Real covered garden terrace — long tables, woven chairs, pergola frame,
  // mashrabiya screens, string lights, lawn + turf pitch beyond. Owner-
  // watermarked ("Excellence Café", bottom-right).
  ["IZON0558.JPG", "atmosphere/terrace-dining-wide.jpg"],
  // Same terrace, a U-shaped group table laid for a private function.
  ["IZON0538.JPG", "atmosphere/terrace-group-table.jpg"],
  // Indoor buffet hall — skirted linen tables, gold + steel chafing dishes,
  // forest-mural wall, staff in branded shirts, guests serving themselves.
  ["5M4A9909.JPG", "atmosphere/buffet-hall-wide.jpg"],
  // Buffet close-up — salads/mezze in gold-rimmed bowls, floral centrepiece.
  ["5M4A9878.JPG", "atmosphere/buffet-spread-closeup.jpg"],
  // Staff member in a branded shirt serving from a chafing dish.
  ["5M4A9927.JPG", "atmosphere/staff-plating-buffet.jpg"],
];

for (const [src, dest] of jobs) {
  await sharp(path.join(SMASH, src))
    .rotate()
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(path.join(DEST, dest));
  console.log("✔", dest);
}

console.log(`\nDone — logo + ${jobs.length} photos.`);
