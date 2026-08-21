import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // Default is 60s. Listing photos rarely change once published, so the
    // optimizer's own cache (separate from vercel.json's raw-file caching,
    // which only covers unoptimized /images/* requests, not /_next/image
    // variants) can safely hold each resized/re-encoded variant far longer.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "placehold.co" },
      // Real Flormar product photography for the private, unlisted Flormar
      // partner preview (app/[locale]/preview/flormar) — sourced only from
      // Flormar's own official CDNs (flormar.com, flormar.com.tr,
      // flormar.ma) during the product reconciliation research
      // (docs/flormar-product-catalog.json), never downloaded/re-hosted.
      // A one-off retailer CDN (idefix.com) was briefly here for a single
      // product image that turned out not to match the real product on
      // closer verification — removed along with the image itself; see
      // docs/flormar-product-reconciliation.md's resolution log. Harmless
      // to keep even after `unoptimized: true` below, which is the actual
      // reason these don't need proxying.
      { protocol: "https", hostname: "d1ak51zwgmtslz.cloudfront.net" },
      { protocol: "https", hostname: "afb801.a-cdn.akinoncloud.com" },
      { protocol: "https", hostname: "admin.flormar.ma" },
    ],
    // Every /_next/image request (every product/listing photo — all remote,
    // hosted on Supabase Storage) started failing in production with 402
    // "OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED" — Vercel's Image
    // Optimization API billing/quota rejecting the request outright, not a
    // bug in this app's own code, CSP, or remotePatterns (all confirmed
    // correct independently: the same URLs return 200 when fetched
    // directly). `unoptimized: true` makes next/image render a plain <img
    // src="{original-url}"> instead of proxying through /_next/image, so
    // every image loads straight from Supabase Storage's own CDN — no
    // dependency on Vercel's paid optimization pipeline at all. Trade-off:
    // no automatic AVIF/WebP re-encoding or responsive resizing; acceptable
    // here since Storage already serves reasonably-sized uploaded photos.
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    // CSP origins are an exact inventory of what this app actually loads —
    // verified by grep, not guessed: Supabase (API + Storage) and the
    // placeholder-image host already declared in images.remotePatterns
    // above. "Open in Google Maps" is a plain <a target="_blank"> out to
    // Google Maps (lib/utils/google-maps.ts) and needs no CSP entry — a
    // normal top-level navigation, not a fetch/script/iframe load this page
    // makes itself. LocationMapSection's embedded map preview is different:
    // it's a real <iframe src="https://maps.google.com/maps?...&output=
    // embed">, so that host must be allowed in frame-src below, the same
    // way the YouTube embed already is.
    const connectSrc = ["'self'", "https://*.supabase.co", "wss://*.supabase.co"];
    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      "https://placehold.co",
      // Real Flormar product photography sources, private Flormar preview
      // only — see the matching remotePatterns comment above.
      "https://d1ak51zwgmtslz.cloudfront.net",
      "https://afb801.a-cdn.akinoncloud.com",
      "https://admin.flormar.ma",
    ];
    // Uploaded videos (components/shared/video-gallery.tsx) are served from
    // Supabase Storage, a cross-origin host — with no media-src directive,
    // CSP falls back to default-src 'self' and silently blocks every
    // uploaded video's playback. YouTube embeds go through the nocookie
    // iframe host, which frame-src must allow explicitly (frame-src 'none'
    // blocked those too, sitewide, since the Media Manager shipped).
    const mediaSrc = ["'self'", "https://*.supabase.co"];
    // maps.google.com/maps?...&output=embed redirects to
    // www.google.com/maps/embed?... — confirmed by following the actual
    // redirect in a browser, not assumed — so frame-src must allow the
    // real final destination, not just the URL this app's own <iframe src>
    // literally specifies.
    const frameSrc = ["'self'", "https://www.youtube-nocookie.com", "https://maps.google.com", "https://www.google.com"];
    // Dev-mode-only relaxation: Next.js's Fast Refresh / webpack HMR runtime
    // (next/dist/compiled/@next/react-refresh-utils) calls eval() to wrap
    // modules with source maps — with no 'unsafe-eval', that throws on
    // every single page load in `next dev` (confirmed via a headless-browser
    // pageerror capture: "Evaluating a string as JavaScript violates ...
    // 'unsafe-eval' is not an allowed source"), which aborts the client
    // bundle before React ever hydrates. Every page's PageTransition wrapper
    // then stays stuck at its SSR `opacity:0` initial state forever, since
    // nothing client-side survives to run the framer-motion animation that
    // would bring it to opacity:1 — the exact "header renders, content area
    // is blank white" symptom. `next build`/`next start` never hit this
    // (production doesn't ship Fast Refresh or use eval), so this only
    // loosens the policy for local development, not production.
    const scriptSrc =
      process.env.NODE_ENV === "production"
        ? "script-src 'self' 'unsafe-inline'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
    const csp = [
      `default-src 'self'`,
      // Next.js's own hydration bootstrap and this app's inline JSON-LD
      // <script> tags need 'unsafe-inline' without a nonce-based setup;
      // JSON-LD content itself is escaped separately (lib/utils/json-ld.ts).
      scriptSrc,
      `style-src 'self' 'unsafe-inline'`,
      `img-src ${imgSrc.join(" ")}`,
      `media-src ${mediaSrc.join(" ")}`,
      `font-src 'self' data:`,
      `connect-src ${connectSrc.join(" ")}`,
      `frame-src ${frameSrc.join(" ")}`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'self'`,
      `upgrade-insecure-requests`,
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // geolocation=(self): the City Services "X km away" distance
          // (lib/hooks/use-visitor-location.ts) calls navigator.geolocation
          // directly — an empty allowlist here would silently block that
          // permission prompt from ever firing. Camera/microphone stay
          // disabled; neither is used anywhere in the app.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      {
        // iOS Universal Links: Apple's verification fetch expects this
        // extensionless file served as application/json — Next's static
        // file server would otherwise infer a generic content-type from
        // the missing extension. Android's assetlinks.json already gets
        // the right type from its .json extension, no override needed.
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
