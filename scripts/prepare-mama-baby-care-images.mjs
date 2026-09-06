// Mama & Baby Care — prepares the real product photos supplied on the
// owner's desktop (Desktop/Mama Babe Care/*.jpeg, 42 WhatsApp catalog
// photos) into public/images/partners/mama-baby-care/<category>/<slug>.jpg,
// following the same public/images/partners/<slug>/ convention already used
// for Al-Hikma/Flormar/The Village. Every source file is the business's own
// real product photography (several carry the shop's own "Mama & Baby Care"
// watermark) — nothing here is generated or stock.
//
// Two source photos needed a crop before use (both violate the "no prices,
// no stray captions" rule for this redesign):
//   - the in-store shelf shot of the black school shoes has real $20 price
//     stickers baked into the pixels — cropped to just the shoes/boxes.
//   - the Baby Dove lotion photo has a stray "Professional E-commerce
//     Product Shot" caption baked into the bottom margin — cropped off.
// One source photo (a Burberry-check-pattern headband personalised "THE
// GREGG CHALMERS BAND") is deliberately excluded from PREP entirely — not
// referenced anywhere in this file — trademark-pattern risk + an irrelevant
// third-party name baked into the image.
//
// Run: node scripts/prepare-mama-baby-care-images.mjs
import sharp from "sharp";
import fs from "fs";
import path from "path";

const SRC_DIR = "C:/Users/YASEEN/OneDrive/Desktop/Mama Babe Care";
const OUT_BASE = "public/images/partners/mama-baby-care";

// [sourceFileName, outputRelativePath, cropFraction?]
// cropFraction: keep only the top N% of the image height (removes a bottom
// strip) — used only for the two flawed photos described above.
const IMAGES = [
  // Baby clothing
  ["WhatsApp Image 2026-09-05 at 6.57.29 AM (2).jpeg", "baby-clothing/rainbow-pinafore-bodysuit-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.30 AM (1).jpeg", "baby-clothing/dino-print-dungaree-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.37 AM.jpeg", "baby-clothing/giraffe-dungaree-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.41 AM (1).jpeg", "baby-clothing/pink-bow-dress.jpg"],

  // Kids clothing
  ["WhatsApp Image 2026-09-05 at 6.57.13 AM.jpeg", "kids-clothing/mint-floral-embroidered-dress.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.14 AM.jpeg", "kids-clothing/blue-striped-dress.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.16 AM.jpeg", "kids-clothing/boys-tropical-shirt-trouser-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.19 AM (1).jpeg", "kids-clothing/boys-gamepad-shirt-shorts-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.20 AM.jpeg", "kids-clothing/girls-club-tshirt.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.24 AM.jpeg", "kids-clothing/boys-california-tshirt.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.25 AM.jpeg", "kids-clothing/mint-seashell-print-dress.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.27 AM (1).jpeg", "kids-clothing/boys-palm-print-shirt-shorts-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.26 AM (1).jpeg", "kids-clothing/boys-palm-print-shirt-shorts-set-alt1.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.26 AM.jpeg", "kids-clothing/boys-palm-print-shirt-shorts-set-alt2.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.27 AM.jpeg", "kids-clothing/pastel-rainbow-striped-top.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.28 AM (1).jpeg", "kids-clothing/yellow-rainbow-applique-top.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.28 AM.jpeg", "kids-clothing/purple-floral-shirt-shorts-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.29 AM (1).jpeg", "kids-clothing/rolling-stones-sweatshirt-legging-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.29 AM.jpeg", "kids-clothing/yellow-leaf-print-shirt.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.39 AM.jpeg", "kids-clothing/bench-tshirt-shorts-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.13 AM (1).jpeg", "kids-clothing/pink-striped-bow-dress.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.42 AM (1).jpeg", "kids-clothing/pink-top-denim-pinafore-set.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.42 AM.jpeg", "kids-clothing/floral-tiered-maxi-dress.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.43 AM.jpeg", "kids-clothing/mint-linen-belted-dress.jpg"],

  // Shoes
  ["WhatsApp Image 2026-09-05 at 6.57.15 AM.jpeg", "shoes/blue-strap-sandal.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.14 AM (1).jpeg", "shoes/grey-strap-sandal.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.19 AM.jpeg", "shoes/strappy-sandals-multicolor.jpg"],
  // Cropped: real $20 price stickers visible in the source shelf photo.
  ["WhatsApp Image 2026-09-05 at 6.57.19 AM (1).jpeg", "shoes/black-school-mary-jane.jpg", 0.6],

  // Accessories
  ["WhatsApp Image 2026-09-05 at 6.57.31 AM.jpeg", "accessories/purple-flower-headband.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.35 AM.jpeg", "accessories/olive-bow-headband.jpg"],

  // Baby essentials
  ["WhatsApp Image 2026-09-05 at 6.57.20 AM.jpeg", "baby-essentials/healthpoint-nappy-ointment.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.21 AM (1).jpeg", "baby-essentials/tommee-tippee-teats.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.21 AM.jpeg", "baby-essentials/bonjela-teething-gel.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.22 AM.jpeg", "baby-essentials/tommee-tippee-bottles.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.23 AM.jpeg", "baby-essentials/mothercare-bath-trio.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.38 AM.jpeg", "baby-essentials/colief-baby-scalp-oil.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.40 AM.jpeg", "baby-essentials/my-little-miracle-talc.jpg"],
  // Cropped: stray "Professional E-commerce Product Shot" caption baked
  // into the bottom margin of the source photo.
  ["WhatsApp Image 2026-09-05 at 6.57.41 AM.jpeg", "baby-essentials/baby-dove-lotion.jpg", 0.9],

  // Gifts
  ["WhatsApp Image 2026-09-05 at 6.57.16 AM (2).jpeg", "gifts/miss-so-perfume-mist.jpg"],
  ["WhatsApp Image 2026-09-05 at 6.57.18 AM.jpeg", "gifts/zahoor-al-khabeej-air-freshener.jpg"],
];

async function run() {
  let done = 0;
  for (const [srcName, outRel, cropFraction] of IMAGES) {
    const srcPath = path.join(SRC_DIR, srcName);
    const outPath = path.join(OUT_BASE, outRel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    let pipeline = sharp(srcPath).rotate(); // .rotate() with no args = auto-orient from EXIF, then strips it
    if (cropFraction) {
      const meta = await sharp(srcPath).rotate().toBuffer({ resolveWithObject: true });
      const { width, height } = meta.info;
      pipeline = sharp(meta.data).extract({ left: 0, top: 0, width, height: Math.round(height * cropFraction) });
    }
    await pipeline
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toFile(outPath);

    done++;
    console.log(`  ${outRel}`);
  }
  console.log(`\nDone: ${done} images written under ${OUT_BASE}/`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
