import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing, getMessagesForListing } from "@/lib/data/business";
import { MessagesInbox } from "@/components/business/messages-inbox";

export const metadata: Metadata = { title: "Messages — Dashboard", robots: { index: false } };

export default async function MessagesPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/messages`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;

  const t = await getTranslations({ locale, namespace: "businessDashboard" });
  const messages = await getMessagesForListing(listing.listingType, listing.id);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold">{t("navMessages")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("messagesSubtitle")}</p>
      </div>
      <MessagesInbox listingType={listing.listingType} listingId={listing.id} messages={messages} revalidatePath={currentPath} />
    </div>
  );
}
