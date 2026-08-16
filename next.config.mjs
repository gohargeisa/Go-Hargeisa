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
    // above. No map SDK/embed of any kind runs in this app — every "View
    // on Map"/"Directions" action is a plain <a target="_blank"> out to
    // Google Maps (lib/utils/google-maps.ts), which needs no CSP entry
    // since it's a normal top-level navigation, not a fetch/script/iframe
    // load this page makes itself.
    const connectSrc = ["'self'", "https://*.supabase.co", "wss://*.supabase.co"];
    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      "https://placehold.co",
    ];
    // Uploaded videos (components/shared/video-gallery.tsx) are served from
    // Supabase Storage, a cross-origin host — with no media-src directive,
    // CSP falls back to default-src 'self' and silently blocks every
    // uploaded video's playback. YouTube embeds go through the nocookie
    // iframe host, which frame-src must allow explicitly (frame-src 'none'
    // blocked those too, sitewide, since the Media Manager shipped).
    const mediaSrc = ["'self'", "https://*.supabase.co"];
    const frameSrc = ["'self'", "https://www.youtube-nocookie.com"];
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
