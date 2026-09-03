/**
 * Regenerate the native app icons + splash image from the website's brand
 * assets. Run from the repo root: `node apps/mobile/scripts/generate-app-icons.mjs`
 * (uses the root `sharp`).
 *
 *   assets/images/icon.png                    iOS / store icon  (1024, white)
 *   assets/images/android-icon-foreground.png adaptive foreground (pin, padded)
 *   assets/images/android-icon-background.png adaptive background (white)
 *   assets/images/splash-icon.png             white wordmark, transparent
 *   assets/images/favicon.png                 48px
 *
 * The adaptive background colour is also set to #FFFFFF in app.config.ts; the
 * splash ground is NAVY_DEEP (#051427), painted by the expo-splash-screen
 * plugin behind the transparent wordmark.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");
const SRC_ICON = path.join(REPO, "public/icons/icon-512.png");
const SRC_WORDMARK = path.join(REPO, "public/images/logo-mark.png");
const OUT = path.resolve(here, "../assets/images");

async function iosIcon() {
  await sharp(SRC_ICON)
    .resize(1024, 1024, { fit: "contain", background: "#FFFFFF" })
    .flatten({ background: "#FFFFFF" })
    .png()
    .toFile(path.join(OUT, "icon.png"));
}

async function androidForeground() {
  const inner = 740;
  const pad = Math.round((1024 - inner) / 2);
  const mark = await sharp(SRC_ICON)
    .resize(inner, inner, { fit: "contain", background: "#FFFFFF" })
    .flatten({ background: "#FFFFFF" })
    .toBuffer();
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: "#FFFFFF" },
  })
    .composite([{ input: mark, top: pad, left: pad }])
    .png()
    .toFile(path.join(OUT, "android-icon-foreground.png"));
}

async function androidBackground() {
  await sharp({
    create: { width: 1024, height: 1024, channels: 3, background: "#FFFFFF" },
  })
    .png()
    .toFile(path.join(OUT, "android-icon-background.png"));
}

async function splashIcon() {
  await sharp(SRC_WORDMARK)
    .trim()
    .resize(820, null, { fit: "contain" })
    .extend({
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUT, "splash-icon.png"));
}

async function favicon() {
  await sharp(SRC_ICON)
    .resize(48, 48, { fit: "contain", background: "#FFFFFF" })
    .flatten({ background: "#FFFFFF" })
    .png()
    .toFile(path.join(OUT, "favicon.png"));
}

await iosIcon();
await androidForeground();
await androidBackground();
await splashIcon();
await favicon();
console.log("Wrote native icons to", OUT);
