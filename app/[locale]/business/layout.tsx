import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireBusinessAccess } from "@/lib/supabase/guards";
import { getAccessibleListings, getMessagesForListing, getOwnerProfile, selectActiveListing } from "@/lib/data/business";
import { BusinessSidebar } from "@/components/business/business-sidebar";
import { BusinessHeader } from "@/components/business/business-header";

export const metadata: Metadata = { title: "Business Dashboard — Go Hargeisa", robots: { index: false, follow: false } };

/**
 * Shell for every /business/* page — sidebar (desktop persistent / mobile
 * drawer, see BusinessSidebar) + header, wrapping real routes rather than
 * client tab-state (this is closer in size to /admin than to the 6-tab
 * consumer /dashboard). Business owners with multiple listings (e.g. one
 * login managing both Lavender Café and Lavender Flowers) get the "My
 * Businesses" switcher in BusinessHeader — selectActiveListing resolves
 * which one is active from the gh_active_business cookie it writes.
 */
export default async function BusinessLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  const redirectTo = `/${locale}/business`;
  const access = await requireBusinessAccess(locale, redirectTo);
  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  const listings = access ? await getAccessibleListings(access.userId) : [];
  // A business_owner may own a mix of trial and official listings (e.g. a
  // second business just linked, pending activation) — the dashboard opens
  // on their first OFFICIAL one. If every listing they own is still trial,
  // that's a distinct state from owning nothing at all, so it gets its own
  // message instead of the generic "no business assigned" one.
  const listing = await selectActiveListing(listings);

  if (!listing) {
    const hasTrialOnly = listings.length > 0;
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-sand px-5 dark:bg-ink">
        <div className="max-w-md rounded-2xl border border-ink/8 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-white/[0.03]">
          <h1 className="font-display text-xl font-bold">{t("noBusinessTitle")}</h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            {hasTrialOnly ? t("partnerStatusTrialBanner") : t("noBusinessDescription")}
          </p>
        </div>
      </div>
    );
  }

  const [owner, messages] = await Promise.all([
    getOwnerProfile(),
    getMessagesForListing(listing.listingType, listing.id),
  ]);
  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    // lg:pt-[...] clears the fixed global <SiteHeader> (h-20 + safe-area) —
    // on mobile this is already handled by BusinessSidebar's own hamburger
    // bar (which carries its own matching offset), so this only applies at
    // the desktop breakpoint where the sidebar/header below render flush
    // against the top of the flex row with nothing else pushing them down.
    // Same header-height expression AdminLayout and BusinessSidebar's
    // mobile bar already use, for one consistent fix instead of three
    // slightly different ones.
    <div className="flex min-h-screen flex-col bg-sand dark:bg-ink lg:flex-row lg:pt-[calc(env(safe-area-inset-top)+5rem)]">
      <BusinessSidebar locale={locale} listing={listing} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BusinessHeader
          locale={locale}
          businessName={listing.name}
          ownerName={owner.name}
          unreadCount={unreadCount}
          businesses={listings.filter((l) => l.partnerStatus === "official")}
          activeListing={listing}
        />
        {listing.isSuspended && (
          <div className="mx-5 mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300 sm:mx-8 sm:mt-8">
            <p className="font-semibold">{t("suspendedBannerTitle")}</p>
            <p className="mt-1 text-red-700/90 dark:text-red-300/80">{t("suspendedBannerDescription")}</p>
          </div>
        )}
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
