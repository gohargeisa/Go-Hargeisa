// Generates every native Android + iOS icon/splash asset from the existing
// brand mark (public/icons/icon-512.png — the square pin+skyline glyph, not
// the full wordmark logo). Run with: node scripts/generate-mobile-assets.mjs
//
// Source has no alpha and a white background baked in, so:
//  - "full-bleed" icon slots (legacy Android launcher, iOS single-size icon)
//    just resize the source directly — it already reads correctly framed.
//  - "inset" slots (Android adaptive-icon foreground layer, both platforms'
//    splash screens) use a tightly-trimmed cutout of the mark, recomposited
//    at a smaller scale onto the right background so it sits safely inside
//    the adaptive-icon mask safe zone / reads as a centered splash mark.
import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "public/icons/icon-512.png");
const BRAND_SPLASH_BG = "#FBF8F3"; // manifest.json background_color
const BRAND_ICON_BG = "#FFFFFF"; // matches ic_launcher_background.xml + the source's own canvas

const DENSITIES = [
  { name: "mdpi", scale: 1 },
  { name: "hdpi", scale: 1.5 },
  { name: "xhdpi", scale: 2 },
  { name: "xxhdpi", scale: 3 },
  { name: "xxxhdpi", scale: 4 },
];

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

async function getTrimmedMark() {
  const { data, info } = await sharp(SOURCE).trim().toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

/** The trimmed mark scaled to fit within `fraction` of a `size`x`size`
 * square, centered, composited onto `background` (or transparent). */
async function markOnSquare({ mark, size, fraction, background }) {
  const inner = Math.round(size * fraction);
  const scale = Math.min(inner / mark.width, inner / mark.height);
  const w = Math.round(mark.width * scale);
  const h = Math.round(mark.height * scale);
  const resizedMark = await sharp(mark.buffer).resize(w, h, { fit: "fill" }).toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedMark, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer();
}

/** The trimmed mark centered on a `w`x`h` rectangle at `fraction` of the
 * shorter side — used for splash screens of arbitrary aspect ratio. */
async function markOnRect({ mark, w, h, fraction, background }) {
  const inner = Math.round(Math.min(w, h) * fraction);
  const scale = Math.min(inner / mark.width, inner / mark.height);
  const mw = Math.round(mark.width * scale);
  const mh = Math.round(mark.height * scale);
  const resizedMark = await sharp(mark.buffer).resize(mw, mh, { fit: "fill" }).toBuffer();

  return sharp({
    create: { width: w, height: h, channels: 4, background },
  })
    .composite([{ input: resizedMark, left: Math.round((w - mw) / 2), top: Math.round((h - mh) / 2) }])
    .png()
    .toBuffer();
}

/** White-on-transparent silhouette for Android's status-bar notification
 * icon (the OS requires flat white glyphs here — colored icons get
 * discarded/rendered as a white square on Android 5+). */
async function monochromeMark({ mark, size }) {
  const inner = Math.round(size * 0.72);
  const scale = Math.min(inner / mark.width, inner / mark.height);
  const w = Math.round(mark.width * scale);
  const h = Math.round(mark.height * scale);

  // Grayscale + invert: the navy glyph (dark) becomes bright, the white
  // backdrop becomes dark — used directly as an alpha channel so the glyph
  // ends up opaque-white and everything else transparent.
  const alpha = await sharp(mark.buffer).resize(w, h, { fit: "fill" }).grayscale().negate().toColorspace("b-w").raw().toBuffer();

  const white = await sharp({ create: { width: w, height: h, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .raw()
    .toBuffer();

  const merged = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    merged[i * 4] = white[i * 3];
    merged[i * 4 + 1] = white[i * 3 + 1];
    merged[i * 4 + 2] = white[i * 3 + 2];
    merged[i * 4 + 3] = alpha[i];
  }

  const glyph = await sharp(merged, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();

  return sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: glyph, left: Math.round((size - w) / 2), top: Math.round((size - h) / 2) }])
    .png()
    .toBuffer();
}

async function generateAndroid(mark) {
  const resBase = path.join(ROOT, "android/app/src/main/res");

  for (const { name, scale } of DENSITIES) {
    const dir = path.join(resBase, `mipmap-${name}`);
    await ensureDir(dir);

    // Legacy full-bleed launcher icon — direct resize of the framed source.
    const legacySize = Math.round(48 * scale);
    const legacy = await sharp(SOURCE).resize(legacySize, legacySize).png().toBuffer();
    await sharp(legacy).toFile(path.join(dir, "ic_launcher.png"));
    await sharp(legacy).toFile(path.join(dir, "ic_launcher_round.png"));

    // Adaptive-icon foreground — inset mark on transparent, safe-zone aware
    // (Android masks a 108dp canvas down to a ~66dp visible circle/squircle).
    const fgSize = Math.round(108 * scale);
    const fg = await markOnSquare({ mark, size: fgSize, fraction: 0.6 });
    await sharp(fg).toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`  mipmap-${name}: ic_launcher (${legacySize}px), foreground (${fgSize}px)`);
  }

  // Splash screens — brand-cream background, centered mark, every
  // density x both orientations, matching Capacitor's default template shape.
  const PORT_BASE = { w: 320, h: 480 };
  const LAND_BASE = { w: 480, h: 320 };
  for (const { name, scale } of DENSITIES) {
    for (const [orientation, base] of [["port", PORT_BASE], ["land", LAND_BASE]]) {
      const dir = path.join(resBase, `drawable-${orientation}-${name}`);
      await ensureDir(dir);
      const w = Math.round(base.w * scale);
      const h = Math.round(base.h * scale);
      const splash = await markOnRect({ mark, w, h, fraction: 0.34, background: BRAND_SPLASH_BG });
      await sharp(splash).toFile(path.join(dir, "splash.png"));
    }
    console.log(`  drawable-{port,land}-${name}: splash generated`);
  }

  // Default fallback (no density/orientation qualifier — pre-API-21 devices).
  const fallback = await markOnRect({ mark, w: 480, h: 320, fraction: 0.34, background: BRAND_SPLASH_BG });
  await sharp(fallback).toFile(path.join(resBase, "drawable/splash.png"));

  // Status-bar notification icon (small monochrome silhouette).
  const notifBase = 24;
  for (const { name, scale } of DENSITIES) {
    const dir = path.join(resBase, `drawable-${name}`);
    await ensureDir(dir);
    const size = Math.round(notifBase * scale);
    const icon = await monochromeMark({ mark, size });
    await sharp(icon).toFile(path.join(dir, "ic_stat_notify.png"));
  }
  console.log("  drawable-*/ic_stat_notify.png: notification icon generated");

  // Adaptive icon background stays a flat color (already brand white via
  // ic_launcher_background.xml) — nothing to generate there.
}

async function generateIOS(mark) {
  const iosDir = path.join(ROOT, "ios/App/App/Assets.xcassets");
  if (!existsSync(iosDir)) {
    console.log("  ios/ project not found — skipping iOS asset generation (run `npx cap add ios` first).");
    return;
  }

  // Single 1024x1024 App Store icon — Apple rejects icons with an alpha
  // channel, so flatten explicitly even though the source has none.
  const iconDir = path.join(iosDir, "AppIcon.appiconset");
  await ensureDir(iconDir);
  await sharp(SOURCE).resize(1024, 1024).flatten({ background: BRAND_ICON_BG }).png().toFile(path.join(iconDir, "AppIcon-512@2x.png"));
  console.log("  AppIcon.appiconset: 1024x1024 generated");

  // Splash — one 2732x2732 "universal" image duplicated to all 3 filenames
  // Xcode's default template Contents.json references (1x/2x/3x all point
  // at the same physical asset for the simplified single-image splash).
  const splashDir = path.join(iosDir, "Splash.imageset");
  await ensureDir(splashDir);
  const splash = await markOnRect({ mark, w: 2732, h: 2732, fraction: 0.3, background: BRAND_SPLASH_BG });
  const flatSplash = await sharp(splash).flatten({ background: BRAND_SPLASH_BG }).png().toBuffer();
  for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    await sharp(flatSplash).toFile(path.join(splashDir, filename));
  }
  console.log("  Splash.imageset: 2732x2732 generated (x3 filenames)");
}

const BRAND_PRIMARY = "#0B5ED7";
const BRAND_PRIMARY_DARK = "#084BB0";

/** Play Store listing assets — not shipped inside the app itself, so these
 * live in store-assets/ rather than android/ or ios/. Placeholders in the
 * sense that they're programmatically composed from existing brand assets
 * rather than custom marketing artwork, but are real, correctly-sized,
 * presentable files — not stand-ins that need redoing before upload. */
async function generateStoreAssets(mark) {
  const outDir = path.join(ROOT, "store-assets");
  await ensureDir(outDir);

  // Feature graphic — Play Console requires exactly 1024x500, no alpha.
  // Diagonal brand-gradient background (matches the primary blue used
  // throughout the app's own UI) with the mark on the left and the
  // wordmark rendered as crisp SVG text on the right — avoids the full
  // logo file's baked-in vignette background, which doesn't composite
  // cleanly onto another background.
  const featureSvg = `
    <svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${BRAND_PRIMARY}"/>
          <stop offset="100%" stop-color="${BRAND_PRIMARY_DARK}"/>
        </linearGradient>
      </defs>
      <rect width="1024" height="500" fill="url(#bg)"/>
      <text x="490" y="225" font-family="Georgia, 'Times New Roman', serif" font-size="68" font-weight="700" fill="#FFFFFF">Go Hargeisa</text>
      <text x="492" y="275" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#FBF8F3" opacity="0.92">Discover · Explore · Experience</text>
    </svg>
  `;
  const markForFeature = await markOnSquare({ mark, size: 380, fraction: 0.82, background: { r: 255, g: 255, b: 255, alpha: 1 } });
  const markCircle = await sharp(markForFeature)
    .composite([{ input: Buffer.from('<svg width="380" height="380"><circle cx="190" cy="190" r="190" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp({ create: { width: 1024, height: 500, channels: 4, background: { r: 11, g: 94, b: 215, alpha: 1 } } })
    .composite([
      { input: Buffer.from(featureSvg), left: 0, top: 0 },
      { input: markCircle, left: 60, top: 60 },
    ])
    .flatten({ background: BRAND_PRIMARY })
    .removeAlpha()
    .png()
    .toFile(path.join(outDir, "feature-graphic.png"));
  console.log("  store-assets/feature-graphic.png: 1024x500 generated");

  // Hi-res icon for the Play Console listing itself (separate field from
  // the in-app launcher icon, same source, Play just wants its own copy).
  await sharp(SOURCE).resize(512, 512).png().toFile(path.join(outDir, "play-store-icon-512.png"));
  console.log("  store-assets/play-store-icon-512.png: 512x512 generated");
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Source icon not found: ${SOURCE}`);
  const mark = await getTrimmedMark();
  console.log(`Source mark trimmed to ${mark.width}x${mark.height}`);

  console.log("\nAndroid:");
  await generateAndroid(mark);

  console.log("\niOS:");
  await generateIOS(mark);

  console.log("\nStore listing assets:");
  await generateStoreAssets(mark);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
