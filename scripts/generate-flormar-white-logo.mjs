/**
 * Generates public/images/partners/flormar/logo-white.png — a pure-white
 * knockout of the official pink Flormar logo (logo.png), for use ONLY on
 * dark-magenta surfaces where the pink wordmark has near-zero contrast
 * (the Flormar Rewards card / loyalty join gate — see
 * PartnerTheme.partnerLogoLight).
 *
 * It does NOT recolor or redraw the mark: every opaque pixel becomes white
 * and the original alpha channel (including the anti-aliased edges) is kept
 * byte-for-byte, so the shape/lockup is identical — only the fill flips from
 * #E6006A to #FFFFFF. The pink logo.png stays the canonical storefront logo.
 *
 * Run: node scripts/generate-flormar-white-logo.mjs
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public/images/partners/flormar/logo.png");
const out = join(root, "public/images/partners/flormar/logo-white.png");

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 0; i < data.length; i += info.channels) {
  data[i] = 255; // R
  data[i + 1] = 255; // G
  data[i + 2] = 255; // B
  // data[i + 3] — alpha untouched
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .png()
  .toFile(out);

console.log(`wrote ${out} (${info.width}×${info.height})`);
