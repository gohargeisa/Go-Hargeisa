import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { getOwnedListings, getMessagesForListing, getOwnerProfile } from "@/lib/data/business";
import { BusinessSidebar } from "@/components/business/business-sidebar";
import { BusinessHeader } from "@/components/business/business-header";

export const metadata: Metadata = { title: "Business Dashboard — Go Hargeisa", robots: { index: false, follow: false } };

/**
 * Shell for every /business/* page — sidebar (desktop persistent / mobile
 * drawer, see BusinessSidebar) + header, wrapping real routes rather than
 * client tab-state (this is closer in size to /admin than to the 6-tab
 * consumer /dashboard). Business owners with multiple listings currently
 * see their first-created one; a real listing switcher is a scoped
 * fast-follow (see the sidebar footer note in that case).
 */
export default async function BusinessLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: Locale };
}) {
  const redirectTo = `/${locale}/business`;
  const access = await requireListingsAccess(locale, redirectTo);
  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  const listings = access ? await getOwnedListings(access.userId) : [];
  // A business_owner may own a mix of trial and official listings (e.g. a
  // second business just linked, pending activation) — the dashboard opens
  // on their first OFFICIAL one. If every listing they own is still trial,
  // that's a distinct state from owning nothing at all, so it gets its own
  // message instead of the generic "no business assigned" one.
  const listing = listings.find((l) => l.partnerStatus === "official");

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
    <div className="flex min-h-screen bg-sand dark:bg-ink">
      <BusinessSidebar locale={locale} listing={listing} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BusinessHeader locale={locale} businessName={listing.name} ownerName={owner.name} unreadCount={unreadCount} />
        <main className="flex-1 p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
