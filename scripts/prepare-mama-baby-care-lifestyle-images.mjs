// Mama & Baby Care — prepares the two licensed Pexels lifestyle photos used
// in the storefront's "Little moments, beautifully cared for" section (see
// lib/config/mama-baby-care-media.ts for sourcing details: photo IDs,
// photographers, and the Pexels License terms). Downloads once from Pexels'
// CDN, then resizes/recompresses into public/images/partners/mama-baby-care/
// lifestyle/ — same self-hosting pattern already used for Al-Hikma's
// illustrative stock (never hotlinks images.pexels.com from the live site).
//
// Run: node scripts/prepare-mama-baby-care-lifestyle-images.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";
import https from "https";

const OUT_DIR = "public/images/partners/mama-baby-care/lifestyle";

// [pexelsPhotoId, outputFileName]
const PHOTOS = [
  [34566653, "mother-and-newborn-embrace.jpg"],
  [5893841, "girls-pastel-fashion-studio.jpg"],
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [id, outName] of PHOTOS) {
    const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;
    const buf = await download(url);
    const outPath = path.join(OUT_DIR, outName);
    await sharp(buf)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 84, progressive: true, mozjpeg: true })
      .toFile(outPath);
    console.log(`  ${outPath}`);
  }
  console.log("\nDone.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
