// Removes the circular "F" ring monogram from the left of the Flormar
// Hargeisa logo lockup, keeping only the "flormar" / "hargeisa" wordmark
// stack — per the owner's explicit request to match the reference image
// (plain text lockup, no icon). Crop boundary (x=660px of 2109) found by
// sampling per-column alpha sums: the icon's content ends ~x=640, the
// "flormar" text begins ~x=690, with a clean zero-alpha gap between them.
import sharp from "sharp";

const SRC_DIR = "public/images/partners/flormar";
const CROP_X = 660;

async function processLogo(filename) {
  const path = `${SRC_DIR}/${filename}`;
  const meta = await sharp(path).metadata();
  const cropped = await sharp(path)
    .extract({ left: CROP_X, top: 0, width: meta.width - CROP_X, height: meta.height })
    .toBuffer();
  await sharp(cropped).trim({ threshold: 5 }).toFile(path);
  const after = await sharp(path).metadata();
  console.log(`${filename}: ${meta.width}x${meta.height} -> ${after.width}x${after.height}`);
}

await processLogo("logo.png");
await processLogo("logo-white.png");
