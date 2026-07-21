import Script from "next/script";
import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";

// next-intl's request-based APIs read headers in the installed version, so
// these locale routes must render dynamically instead of being prerendered.
export const dynamic = "force-dynamic";

// NOTE: This layout intentionally does NOT read cookies or check auth state
// server-side (no `createClient()` from lib/supabase/server here). Doing so
// would force every page in the app into full dynamic SSR on every request,
// since Next.js treats any cookies() call anywhere in a route's layout tree
// as a signal the whole route must be dynamic — even if the page itself
// only reads public data and sets `export const revalidate`.
//
// Instead, SiteHeader resolves the signed-in user client-side via
// useHeaderUser() (components/layout/use-header-user.ts), which keeps this
// layout — and therefore every public page — eligible for static
// generation + ISR. See that file for the full rationale.

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gohargeisa.com";

  return {
  metadataBase: new URL(siteUrl),

  verification: {
    google: "lvWrni4Mn0_p_TuIQhwt5j73VIdu_Rgqadn0QdpLKU4",
  },

    title: {
    default: "Go Hargeisa | Official Tourism Guide to Hargeisa, Somaliland",
    template: "%s | Go Hargeisa",
  },

    description:
      "Explore Hargeisa with Go Hargeisa. Discover hotels, restaurants, cafés, attractions, events, and travel tips across Somaliland.",

    keywords: [
      "Hargeisa",
      "Go Hargeisa",
      "Visit Hargeisa",
      "Somaliland",
      "Hotels in Hargeisa",
      "Restaurants in Hargeisa",
      "Cafes in Hargeisa",
      "Tourism Somaliland",
      "Travel Somaliland",
      "Hargeisa Guide",
    ],

    authors: [
      {
        name: "Go Hargeisa",
      },
    ],

    creator: "Go Hargeisa",

    publisher: "Go Hargeisa",

    category: "Travel",

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    alternates: {
      canonical: `/${locale}`,
      languages: {
        en: "/en",
        ar: "/ar",
        so: "/so",
      },
    },

    openGraph: {
      title: "Go Hargeisa",
      description:
        "The official tourism guide to Hargeisa, Somaliland.",

      url: `${siteUrl}/${locale}`,

      siteName: "Go Hargeisa",

      locale,

      type: "website",

      images: [
  {
    url: "/images/og-image.png",
    width: 1200,
    height: 630,
    alt: "Go Hargeisa",
  },
],
    },

    twitter: {
  card: "summary_large_image",
  title: "Go Hargeisa",
  description: "The official tourism guide to Hargeisa, Somaliland.",
  images: ["/images/og-image.png"],
},

    manifest: "/manifest.json",

    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/icons/icon-192.png", sizes: "192x192" },
        { url: "/icons/icon-512.png", sizes: "512x512" },
      ],

      apple: "/apple-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B5ED7",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  const messages = await getMessages();
  const dir = localeConfig[locale as Locale].dir;

    return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ServiceWorkerRegister />
            <SiteHeader locale={locale as Locale} />
            <main>{children}</main>
            <SiteFooter locale={locale as Locale} />
          </ThemeProvider>
        </NextIntlClientProvider>

        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
      `}
    </Script>
  </>
)}
      </body>
    </html>
  );
}