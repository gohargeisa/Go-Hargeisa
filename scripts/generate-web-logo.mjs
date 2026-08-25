// One-off: public/images/logo.png (1536x1024, 1.3MB) is the master source
// for scripts/generate-mobile-assets.mjs's app icon/splash pipeline, kept
// at that resolution deliberately for that generator — but every on-page
// <Image> usage (site header/footer, join hero, partner footer/status
// sections) only ever displays it at <=176px, so the browser downloads the
// full 1.3MB master on every page load for a logo shown at postage-stamp
// size. This generates a right-sized web copy; the master itself is never
// touched. Run with: node scripts/generate-web-logo.mjs
import sharp from "sharp";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/images/logo.png");
const OUT = path.join(ROOT, "public/images/logo-web.png");

// 700px covers the largest real display width (176px) at up to 4x device
// pixel ratio, with headroom to spare.
await sharp(SOURCE)
  .resize({ width: 700 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(OUT);

const { size } = await sharp(OUT).metadata();
console.log(`wrote ${OUT}`);
