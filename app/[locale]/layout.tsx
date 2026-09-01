import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { LazyMotion, domAnimation } from "framer-motion";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { CapacitorBootstrap } from "@/components/shared/capacitor-bootstrap";
import { OfflineBanner } from "@/components/shared/offline-banner";
import { NetworkSyncController } from "@/components/shared/network-sync-controller";
import { PageTransition } from "@/components/shared/page-transition";
import { BottomNav, BottomNavSpacer } from "@/components/layout/bottom-nav";
import { MobileActionBarProvider } from "@/components/shared/mobile-action-bar-provider";
import { SearchOverlayProvider } from "@/components/shared/search-overlay-provider";
import { NativeSplashGateProvider } from "@/components/shared/native-splash-gate";
import { OfflineFavoritesProvider } from "@/components/shared/offline-favorites-provider";
import { OfflineFavoritesSheet } from "@/components/shared/offline-favorites-sheet";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartDrawer } from "@/components/shared/cart-drawer";
import { RecentlyViewedTracker } from "@/components/shared/recently-viewed-tracker";
import { PullToRefreshIndicator } from "@/components/shared/pull-to-refresh-indicator";
import { getHeaderUser } from "@/lib/supabase/guards";
import { getSiteSettings } from "@/lib/actions/settings";
import { getVisibleCategoriesWithCounts } from "@/lib/data/categories";
import { getHargeisaWeather } from "@/lib/data/weather";

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
  const settings = await getSiteSettings();
  // og/twitter title+siteName are hardcoded "Go Hargeisa" (not localized),
  // so overriding them from the admin-editable site name/favicon carries no
  // i18n regression risk — unlike `title`/`description` above, which stay on
  // the translated defaults since site_settings has no per-locale variants.
  const siteName = settings?.site_name || "Go Hargeisa";
  const faviconUrl = settings?.favicon_url;

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

    // Every page below this layout sets its own alternates.canonical (which
    // replaces this whole object rather than merging into it), so this
    // default only ever actually applies to the homepage itself.
    alternates: localeAlternates(locale as Locale, ""),

    openGraph: {
      title: siteName,
      description: t("ogDescription"),

      url: `${siteUrl}/${locale}`,

      siteName,

      locale,

      type: "website",

      images: [
  {
    url: "/images/og-image.png",
    width: 1200,
    height: 630,
    alt: siteName,
  },
],
    },

    twitter: {
  card: "summary_large_image",
  title: siteName,
  description: t("ogDescription"),
  images: ["/images/og-image.png"],
},

    manifest: "/manifest.json",

    icons: {
      icon: faviconUrl
        ? [{ url: faviconUrl }]
        : [
            { url: "/favicon.ico" },
            { url: "/icons/icon-192.png", sizes: "192x192" },
            { url: "/icons/icon-512.png", sizes: "512x512" },
          ],

      apple: faviconUrl || "/apple-icon.png",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B5ED7",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
  const [messages, initialUser, tCommon, siteSettings, categories, weather] = await Promise.all([
    getMessages(),
    getHeaderUser(),
    getTranslations({ locale: currentLocale, namespace: "common" }),
    getSiteSettings(),
    getVisibleCategoriesWithCounts(),
    getHargeisaWeather(),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      {/* LazyMotion + the `m` component (used everywhere instead of `motion`)
          is framer-motion's own documented pattern for this exact problem:
          `motion.*` always bundles the full drag/layout/3d feature set,
          while `m.*` defers to whichever feature bundle is loaded here.
          `domAnimation` covers every animation actually used across this
          app (variants, whileHover/whileTap/whileInView, AnimatePresence) —
          nothing here uses drag or layout animations, which is what the
          larger `domMax` bundle would add. Loaded synchronously (not
          lazily) so there's no flash of unanimated content on first paint,
          e.g. the hero's entrance animation. */}
      <LazyMotion features={domAnimation} strict>
        <ThemeProvider>
          <div lang={currentLocale} dir={localeConfig[currentLocale].dir} className="min-h-screen font-body">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary-700 focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
            >
              {tCommon("skipToContent")}
            </a>
            <NativeSplashGateProvider>
              <SearchOverlayProvider>
                <OfflineFavoritesProvider>
                <CartProvider>
                  <MobileActionBarProvider>
                  <SiteHeader
                    locale={currentLocale}
                    initialUser={initialUser}
                    logoUrl={siteSettings?.logo_url ?? undefined}
                    categories={categories}
                    weather={weather}
                  />
                  <main id="main-content">
                    <PageTransition>{children}</PageTransition>
                  </main>
                  <SiteFooter
                    locale={currentLocale}
                    logoUrl={siteSettings?.logo_url ?? undefined}
                    footerText={siteSettings?.footer_text ?? undefined}
                    contactEmail={siteSettings?.contact_email ?? undefined}
                    contactPhone={siteSettings?.contact_phone ?? undefined}
                    whatsappNumber={siteSettings?.whatsapp_number ?? undefined}
                    socialFacebook={siteSettings?.social_facebook ?? undefined}
                    socialInstagram={siteSettings?.social_instagram ?? undefined}
                    socialTwitter={siteSettings?.social_twitter ?? undefined}
                    socialYoutube={siteSettings?.social_youtube ?? undefined}
                    socialTiktok={siteSettings?.social_tiktok ?? undefined}
                  />
                  {/* Reserves clearance below the page's real (in-flow) end
                      so the fixed BottomNav — which floats above everything
                      and takes no flow space of its own — never permanently
                      strands the last footer links/buttons underneath it.
                      BottomNavSpacer mirrors BottomNav's own visibility
                      (hidden on detail routes with their own fixed bottom bar,
                      and while any page-level MobileActionBar is mounted) so
                      the two bottom-clearance systems never stack. */}
                  <BottomNavSpacer />
                  <ServiceWorkerRegister />
                  <CapacitorBootstrap />
                  <OfflineBanner />
                  <NetworkSyncController />
                  <PullToRefreshIndicator />
                  <RecentlyViewedTracker />
                  <OfflineFavoritesSheet />
                  <BottomNav locale={currentLocale} />
                  <CartDrawer locale={currentLocale} />
                  </MobileActionBarProvider>
                </CartProvider>
                </OfflineFavoritesProvider>
              </SearchOverlayProvider>
            </NativeSplashGateProvider>
          </div>
        </ThemeProvider>
      </LazyMotion>
    </NextIntlClientProvider>
  );
}
