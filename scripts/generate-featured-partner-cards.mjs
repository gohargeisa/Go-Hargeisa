/**
 * Generates the homepage "Featured Partners" card artwork for the two
 * partners whose city_services row carries no usable `image` (Al-Hikma) or
 * whose card should read as one designed brand campaign rather than a photo
 * with a white-box logo pasted on top (Flormar).
 *
 * Inputs are all REAL, already-checked-in brand assets:
 *   - Al-Hikma: its official circular logo (public/images/partners/al-hikma/
 *     logo.png), presented as a brand medallion (clean circular mask + soft
 *     shadow + hairline ring — the logo art itself is never redrawn or
 *     recoloured) over one of its licensed illustrative wellness photos and
 *     a deep-green brand wash.
 *   - Flormar: its official wordmark, white knockout (logo-white.png, the
 *     pre-existing asset from generate-flormar-white-logo.mjs — not
 *     recoloured here), sitting directly on the magenta brand background
 *     (no box), over Flormar's EXISTING product hero photo (hero.png — the
 *     same image its city_services row already points at, kept as-is).
 *
 * Output: public/images/partners/<slug>/featured-card.jpg — wired in via
 * lib/config/featured-partner-card-media.ts. Re-run any time the source
 * assets change: `node scripts/generate-featured-partner-cards.mjs`
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = (rel) => path.join(root, rel);

const W = 1200;
const H = 675;

async function buildAlHikma() {
  const base = await sharp(p("public/images/partners/al-hikma/photos/treatment-room-2.jpg"))
    .resize(W, H, { fit: "cover", position: "attention" })
    .modulate({ saturation: 1.03, brightness: 0.99 })
    .toBuffer();

  // Deep-green brand wash: a full-height left-to-right fade plus a heavier
  // bottom band, so the medallion sits ON the brand colour (connected to
  // it), not on a random bright patch of the photo.
  const scrim = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#0c3a2b" stop-opacity="0.86"/>
          <stop offset="0.4" stop-color="#0f4232" stop-opacity="0.34"/>
          <stop offset="0.72" stop-color="#0f4232" stop-opacity="0.06"/>
          <stop offset="1" stop-color="#0f4232" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="foot" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#0a3327" stop-opacity="0.8"/>
          <stop offset="0.32" stop-color="#0a3327" stop-opacity="0.22"/>
          <stop offset="0.6" stop-color="#0a3327" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#side)"/>
      <rect width="${W}" height="${H}" fill="url(#foot)"/>
    </svg>`
  );

  // Brand medallion — the logo masked to a clean circle so its own uneven
  // outer ring / stray corner pixels are gone, then a soft shadow + a thin
  // translucent ring so it reads as an intentional stamp, not a pasted PNG.
  const D = 232;
  const circleMask = Buffer.from(
    `<svg width="${D}" height="${D}" xmlns="http://www.w3.org/2000/svg"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2}" fill="#fff"/></svg>`
  );
  const ring = Buffer.from(
    `<svg width="${D}" height="${D}" xmlns="http://www.w3.org/2000/svg"><circle cx="${D / 2}" cy="${D / 2}" r="${D / 2 - 2}" fill="none" stroke="#ffffff" stroke-opacity="0.55" stroke-width="3"/></svg>`
  );
  const medallion = await sharp(p("public/images/partners/al-hikma/logo.png"))
    .resize(D, D, { fit: "cover" })
    .composite([{ input: circleMask, blend: "dest-in" }, { input: ring, blend: "over" }])
    .png()
    .toBuffer();

  const shadow = await sharp({
    create: { width: D + 40, height: D + 40, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${D + 40}" height="${D + 40}" xmlns="http://www.w3.org/2000/svg"><circle cx="${(D + 40) / 2}" cy="${(D + 40) / 2}" r="${D / 2}" fill="#000" fill-opacity="0.42"/></svg>`
        ),
      },
    ])
    .blur(14)
    .png()
    .toBuffer();

  const mx = 60;
  const my = H - D - 52;
  await sharp(base)
    .composite([
      { input: scrim, top: 0, left: 0 },
      { input: shadow, top: my - 20 + 8, left: mx - 20 + 4 },
      { input: medallion, top: my, left: mx },
    ])
    .jpeg({ quality: 86, chromaSubsampling: "4:4:4" })
    .toFile(p("public/images/partners/al-hikma/featured-card.jpg"));
  console.log("✓ al-hikma/featured-card.jpg");
}

async function buildFlormar() {
  // hero.png (1747x900) is Flormar's existing product hero — a full product
  // spread on a magenta ground with wide negative space on the left. Keep it
  // as-is; just cover-fit to the card ratio (a ~4% side trim, all products
  // stay in frame) and drop the white wordmark into the empty left third.
  const base = await sharp(p("public/images/partners/flormar/hero.png"))
    .resize(W, H, { fit: "cover", position: "right" })
    .toBuffer();

  // The photo is already Flormar magenta — only a gentle deepening low-left
  // so the white wordmark has guaranteed contrast, nothing that changes the
  // product colours.
  const scrim = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bloom" cx="0.1" cy="0.86" r="0.8">
          <stop offset="0" stop-color="#7a0a42" stop-opacity="0.6"/>
          <stop offset="0.5" stop-color="#7a0a42" stop-opacity="0.18"/>
          <stop offset="1" stop-color="#7a0a42" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bloom)"/>
    </svg>`
  );

  const logo = await sharp(p("public/images/partners/flormar/logo-white.png"))
    .resize(384, null, { fit: "inside" })
    .toBuffer();
  const logoH = (await sharp(logo).metadata()).height ?? 0;

  await sharp(base)
    .composite([
      { input: scrim, top: 0, left: 0 },
      { input: logo, top: Math.round(H / 2 - logoH / 2), left: 72 },
    ])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
    .toFile(p("public/images/partners/flormar/featured-card.jpg"));
  console.log("✓ flormar/featured-card.jpg");
}

await buildAlHikma();
await buildFlormar();
