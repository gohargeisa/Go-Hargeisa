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
const LOGO_SOURCE = path.join(ROOT, "public/images/logo.png");
const HERO_SOURCE = path.join(ROOT, "public/images/hero-bg.png");
const BRAND_ICON_BG = "#FFFFFF"; // matches ic_launcher_background.xml + the source's own canvas
const BRAND_SPLASH_NAVY = "#051427"; // tailwind.config.ts navy-900 — the splash's own scrim/background color
const SPLASH_TAGLINE = "DISCOVER • EXPLORE • EXPERIENCE";

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

/**
 * public/images/logo.png (1536x1024) is not a clean wordmark — row-by-row
 * alpha sampling confirms "DISCOVER • EXPLORE • EXPERIENCE" is baked into
 * the raster as a separate pill around rows 650-680, separated from the
 * actual logo mark (content ends ~row 622) by a fully-transparent gap
 * (~rows 626-648). Cropping to the top 630px keeps the whole mark — which
 * already has a soft golden glow baked in — while excluding the tagline
 * pill entirely, so the splash overlay's own separately-animated tagline
 * (components/shared/splash-overlay.tsx) never renders a duplicate.
 * Written to public/images/logo-mark.png as a checked-in web asset (used
 * by the splash overlay's <Image>) as well as returned for native
 * compositing below.
 */
async function getLogoMark() {
  // Two separate sharp pipelines rather than one chained
  // .extract().trim() — sharp's trim() re-derives its threshold area from
  // the pre-extract image when chained directly, throwing "bad extract
  // area"; round-tripping through an intermediate buffer avoids that.
  const extracted = await sharp(LOGO_SOURCE).extract({ left: 0, top: 0, width: 1536, height: 630 }).toBuffer();
  const cropped = await sharp(extracted).trim().toBuffer();
  const { width, height } = await sharp(cropped).metadata();
  // Palette quantization (quality 92 — high enough to keep the mark's own
  // soft golden glow gradient banding-free) cuts this from ~670KB to
  // ~95KB; it's loaded with `priority` by the splash overlay, so its size
  // directly affects perceived startup speed.
  await sharp(cropped).png({ palette: true, quality: 92, compressionLevel: 9 }).toFile(path.join(ROOT, "public/images/logo-mark.png"));
  console.log(`  public/images/logo-mark.png: ${width}x${height} generated (cropped from logo.png, baked tagline excluded)`);
  return { buffer: cropped, width, height };
}

/**
 * Native splash frame (Android Theme.SplashScreen + iOS LaunchScreen
 * .storyboard) — both platforms hard-limit this layer to one static image,
 * so it's designed to look like the first frame of the web splash overlay
 * (splash-overlay.tsx) it hands off to: the same Hero photo, never hard-
 * cropped (spec: "never crop important visual elements"), letterboxed onto
 * a blurred/darkened full-bleed copy of itself for atmosphere, with the
 * (cropped) logo mark + tagline in the scrimmed space below. Sizing is
 * relative to the canvas so the same logic produces a correct frame at
 * every density/orientation this script already loops over, and for iOS's
 * single 2732x2732 square canvas.
 */
async function heroSplashComposite({ w, h, logoMark }) {
  const heroMeta = await sharp(HERO_SOURCE).metadata();

  // Backdrop: full-bleed blurred + darkened cover-crop — pure atmosphere,
  // cropping here is invisible/fine since it's never the focal content.
  const backdrop = await sharp(HERO_SOURCE)
    .resize(w, h, { fit: "cover" })
    .blur(24)
    .modulate({ brightness: 0.55 })
    .toBuffer();

  // Foreground: the entire, uncropped photo — bounded to fit within the
  // canvas width AND at most ~50% of the canvas height (whichever is more
  // restrictive), never cropped, anchored near the top so the lower portion
  // stays clear for the logo/tagline at every orientation.
  const scale = Math.min(w / heroMeta.width, (h * 0.5) / heroMeta.height);
  const fgWidth = Math.round(heroMeta.width * scale);
  const fgHeight = Math.round(heroMeta.height * scale);
  const foreground = await sharp(HERO_SOURCE).resize(fgWidth, fgHeight).toBuffer();
  const fgLeft = Math.round((w - fgWidth) / 2);
  const fgTop = Math.round(h * 0.07);

  // Scrim — flat navy top-to-bottom gradient mirroring the web Hero's own
  // bg-hero-gradient ramp (native drawables can't render a CSS gradient, so
  // this bakes it as pixels instead).
  const scrimSvg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${BRAND_SPLASH_NAVY}" stop-opacity="0.10"/>
        <stop offset="100%" stop-color="${BRAND_SPLASH_NAVY}" stop-opacity="0.72"/>
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#scrim)"/>
  </svg>`;

  // Logo mark + tagline, sized off the shorter canvas side so both read at
  // a consistent physical size regardless of portrait/landscape orientation.
  const shortSide = Math.min(w, h);
  const logoW = Math.round(shortSide * 0.42);
  const logoH = Math.round((logoMark.height / logoMark.width) * logoW);
  const resizedLogo = await sharp(logoMark.buffer).resize(logoW, logoH, { fit: "fill" }).toBuffer();
  const logoLeft = Math.round((w - logoW) / 2);
  const logoTop = fgTop + fgHeight + Math.round(h * 0.05);

  const taglineFontSize = Math.max(10, Math.round(shortSide * 0.032));
  const taglineTop = logoTop + logoH + Math.round(h * 0.02);
  const taglineSvg = `<svg width="${w}" height="${Math.round(taglineFontSize * 2.5)}" xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="${Math.round(taglineFontSize * 1.4)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
      font-size="${taglineFontSize}" letter-spacing="${Math.round(taglineFontSize * 0.3)}"
      font-weight="600" fill="#FFFFFF" fill-opacity="0.85">${SPLASH_TAGLINE}</text>
  </svg>`;

  return sharp({ create: { width: w, height: h, channels: 4, background: BRAND_SPLASH_NAVY } })
    .composite([
      { input: backdrop, left: 0, top: 0 },
      { input: foreground, left: fgLeft, top: fgTop },
      { input: Buffer.from(scrimSvg), left: 0, top: 0 },
      { input: resizedLogo, left: logoLeft, top: logoTop },
      { input: Buffer.from(taglineSvg), left: 0, top: taglineTop },
    ])
    .flatten({ background: BRAND_SPLASH_NAVY })
    // Palette-quantized PNG (still a valid, losslessly-decoded PNG — the
    // format Android/iOS both require here) rather than true-color: this is
    // a full-bleed photographic composite, which true-color PNG encodes at
    // ~1.3MB per density/orientation (10+ copies ship in one APK). Palette
    // quantization at quality 90 cuts that to ~300KB with no visible
    // banding on the photo or the navy scrim gradient.
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toBuffer();
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

async function generateAndroid(mark, logoMark) {
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

  // Splash screens — Hero-photo composite (see heroSplashComposite), every
  // density x both orientations, matching Capacitor's default template shape.
  const PORT_BASE = { w: 320, h: 480 };
  const LAND_BASE = { w: 480, h: 320 };
  for (const { name, scale } of DENSITIES) {
    for (const [orientation, base] of [["port", PORT_BASE], ["land", LAND_BASE]]) {
      const dir = path.join(resBase, `drawable-${orientation}-${name}`);
      await ensureDir(dir);
      const w = Math.round(base.w * scale);
      const h = Math.round(base.h * scale);
      const splash = await heroSplashComposite({ w, h, logoMark });
      await sharp(splash).toFile(path.join(dir, "splash.png"));
    }
    console.log(`  drawable-{port,land}-${name}: splash generated`);
  }

  // Default fallback (no density/orientation qualifier — pre-API-21 devices).
  const fallback = await heroSplashComposite({ w: 480, h: 320, logoMark });
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

async function generateIOS(mark, logoMark) {
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
  const splash = await heroSplashComposite({ w: 2732, h: 2732, logoMark });
  for (const filename of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    await sharp(splash).toFile(path.join(splashDir, filename));
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

/**
 * Fixes a real bug: public/icons/icon-192.png, icon-512.png,
 * icon-maskable-512.png, app/apple-icon.png and public/images/og-image.png
 * were all found to be byte-identical copies of one uncompressed 1254x1254
 * source (~950KB each) despite manifest.json declaring 192x192/512x512 —
 * browsers/OSes trust that declared size without necessarily re-verifying
 * it, and og-image.png being square instead of the standard 1200x630 (1.91:1)
 * meant link-preview crawlers were cropping it awkwardly. `originalBuffer`
 * (captured once, before this function overwrites icon-512.png = SOURCE)
 * preserves the existing full-bleed framing for the "any"-purpose icons;
 * only the maskable icon and OG image need an actual redesign (real safe-
 * zone padding / a non-square canvas), not just a resize.
 */
async function generatePwaAndOgAssets(mark, originalBuffer) {
  const iconsDir = path.join(ROOT, "public/icons");
  const imagesDir = path.join(ROOT, "public/images");
  const appDir = path.join(ROOT, "app");

  await sharp(originalBuffer).resize(512, 512).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, "icon-512.png"));
  console.log("  public/icons/icon-512.png: 512x512 generated");

  await sharp(originalBuffer).resize(192, 192).png({ compressionLevel: 9 }).toFile(path.join(iconsDir, "icon-192.png"));
  console.log("  public/icons/icon-192.png: 192x192 generated");

  await sharp(originalBuffer).resize(180, 180).png({ compressionLevel: 9 }).toFile(path.join(appDir, "apple-icon.png"));
  console.log("  app/apple-icon.png: 180x180 generated");

  // public-mobile/icon.png — the offline-fallback page's own icon
  // (public-mobile/offline.html displays it at a CSS 68px). Same bug as the
  // manifest icons above: this was the same untouched 1254x1254/944KB
  // source, packaged into every native build (Capacitor bundles
  // public-mobile/ directly into the app's assets) for a 68px image. 256px
  // gives clean headroom for retina displays at a fraction of the size.
  await sharp(originalBuffer)
    .resize(256, 256)
    .png({ compressionLevel: 9 })
    .toFile(path.join(ROOT, "public-mobile/icon.png"));
  console.log("  public-mobile/icon.png: 256x256 generated");

  // Maskable — the OS applies its own mask (circle/squircle/rounded-square)
  // that can crop up to a ~20% margin, so unlike the icons above this one
  // needs the glyph genuinely inset (smaller fraction), not just resized.
  const iconMaskable = await markOnSquare({ mark, size: 512, fraction: 0.5, background: { r: 255, g: 255, b: 255, alpha: 1 } });
  await sharp(iconMaskable)
    .flatten({ background: BRAND_ICON_BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, "icon-maskable-512.png"));
  console.log("  public/icons/icon-maskable-512.png: 512x512 (maskable safe-zone) generated");

  // Open Graph / Twitter card image — standard 1200x630 (1.91:1), same
  // gradient-badge-plus-wordmark composition as the Play Store feature
  // graphic below (proven layout, just re-scaled), so link previews get a
  // correctly-cropped, on-brand image instead of an off-ratio square crop.
  const ogSvg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${BRAND_PRIMARY}"/>
          <stop offset="100%" stop-color="${BRAND_PRIMARY_DARK}"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bg)"/>
      <text x="370" y="345" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700" fill="#FFFFFF">Go Hargeisa</text>
      <text x="372" y="400" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FBF8F3" opacity="0.92">Discover · Explore · Experience</text>
    </svg>
  `;
  const markForOg = await markOnSquare({ mark, size: 260, fraction: 0.82, background: { r: 255, g: 255, b: 255, alpha: 1 } });
  const markCircle = await sharp(markForOg)
    .composite([{ input: Buffer.from('<svg width="260" height="260"><circle cx="130" cy="130" r="130" fill="#fff"/></svg>'), blend: "dest-in" }])
    .png()
    .toBuffer();

  await sharp({ create: { width: 1200, height: 630, channels: 4, background: { r: 11, g: 94, b: 215, alpha: 1 } } })
    .composite([
      { input: Buffer.from(ogSvg), left: 0, top: 0 },
      { input: markCircle, left: 80, top: 185 },
    ])
    .flatten({ background: BRAND_PRIMARY })
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toFile(path.join(imagesDir, "og-image.png"));
  console.log("  public/images/og-image.png: 1200x630 generated");
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Source icon not found: ${SOURCE}`);
  const originalSourceBuffer = await sharp(SOURCE).png().toBuffer();
  const mark = await getTrimmedMark();
  console.log(`Source mark trimmed to ${mark.width}x${mark.height}`);

  console.log("\nLogo mark (splash):");
  const logoMark = await getLogoMark();

  console.log("\nAndroid:");
  await generateAndroid(mark, logoMark);

  console.log("\niOS:");
  await generateIOS(mark, logoMark);

  console.log("\nStore listing assets:");
  await generateStoreAssets(mark);

  console.log("\nPWA manifest / Apple touch icon / Open Graph image:");
  await generatePwaAndOgAssets(mark, originalSourceBuffer);

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
