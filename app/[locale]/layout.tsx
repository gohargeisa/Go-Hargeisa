import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { getHeaderUser } from "@/lib/supabase/guards";

// next-intl's request-based APIs read headers in the installed version, so
// these locale routes must render dynamically instead of being prerendered.
export const dynamic = "force-dynamic";

// Since the line above already forces this whole route tree to render
// dynamically on every request, resolving the signed-in user here too
// (via getHeaderUser()) costs nothing extra — and it means <SiteHeader>
// renders with the correct auth state on first paint instead of a brief
// "signed out" flash. A client-side subscription in
// components/layout/use-header-user.ts still keeps it live after
// sign-in/sign-out without a full page reload.

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gohargeisa.com";
  const t = await getTranslations({ locale, namespace: "siteMetadata" });

  return {
  metadataBase: new URL(siteUrl),

  verification: {
    google: "lvWrni4Mn0_p_TuIQhwt5j73VIdu_Rgqadn0QdpLKU4",
  },

    title: {
    default: t("titleDefault"),
    template: t("titleTemplate"),
  },

    description: t("description"),

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
      description: t("ogDescription"),

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
  description: t("ogDescription"),
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

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();

  const currentLocale = locale as Locale;
  const [messages, initialUser] = await Promise.all([getMessages(), getHeaderUser()]);

  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider>
        <div lang={currentLocale} dir={localeConfig[currentLocale].dir} className="min-h-screen font-body">
          <SiteHeader locale={currentLocale} initialUser={initialUser} />
          <main>{children}</main>
          <SiteFooter locale={currentLocale} />
          <ServiceWorkerRegister />
        </div>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
