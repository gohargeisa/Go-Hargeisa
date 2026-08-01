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
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    // CSP origins are an exact inventory of what this app actually loads —
    // verified by grep, not guessed: Supabase (API + Storage), the two
    // placeholder-image hosts already declared in images.remotePatterns
    // above, and Google Maps JS API (components/map/*.tsx, replacing the
    // Leaflet/OpenStreetMap tiles this app used to load). Origins below
    // match Google's own documented CSP requirements for the Maps
    // JavaScript API + Advanced Markers (which need `worker-src blob:` —
    // vector map rendering loads its renderer via a Web Worker).
    const connectSrc = [
      "'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
    ];
    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://*.supabase.co",
      "https://images.unsplash.com",
      "https://placehold.co",
      "https://maps.googleapis.com",
      "https://maps.gstatic.com",
      "https://*.gstatic.com",
    ];
    const csp = [
      `default-src 'self'`,
      // Next.js's own hydration bootstrap and this app's inline JSON-LD
      // <script> tags need 'unsafe-inline' without a nonce-based setup;
      // JSON-LD content itself is escaped separately (lib/utils/json-ld.ts).
      `script-src 'self' 'unsafe-inline' https://maps.googleapis.com`,
      `style-src 'self' 'unsafe-inline'`,
      `img-src ${imgSrc.join(" ")}`,
      `font-src 'self' data:`,
      `connect-src ${connectSrc.join(" ")}`,
      `worker-src 'self' blob:`,
      `frame-src 'none'`,
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
