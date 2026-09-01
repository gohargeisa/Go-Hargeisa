import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PackageSearch, PartyPopper } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllPurchaseRequestsForAdmin } from "@/lib/data/purchase-requests";
import { getAllEventRequestsForAdmin } from "@/lib/data/event-requests";
import { PurchaseRequestsTable } from "@/components/business/purchase-requests-table";
import { EventRequestsTable } from "@/components/business/event-requests-table";

export const metadata: Metadata = { title: "Order Requests — Admin", robots: { index: false, follow: false } };

// The quote/proposal/status actions mutate rows this page lists; always
// re-fetch on visit (same stance as /admin/product-orders' data being
// uncached) so a change made here is reflected immediately.
export const dynamic = "force-dynamic";

const REVALIDATE_PATH = "/admin/order-requests";

/**
 * Platform-wide inbox for every purchase (buy-for-me) request and event
 * request submitted through a partner storefront — the admin-side
 * counterpart to /business/requests + /business/events.
 *
 * Why this exists: those two business-dashboard pages resolve their listing
 * through getActiveListing(), which only returns listings the signed-in
 * user owns (city_services.owner_id) or has a team grant on. Emaankoo Group
 * — the only partner using the purchase/event-request system today — is
 * published with owner_id = NULL (its onboarding migration
 * 20260907000004 deliberately defers owner assignment to the admin "Add
 * Partner" flow), and the notify_owner_* triggers all no-op when owner_id
 * is null. So a request a customer submits currently reaches nobody. This
 * page closes that gap using the "Admins manage all {purchase,event}
 * requests" RLS policies that already exist (profiles.role = 'owner'),
 * grouped by listing so it stays correct if more partners opt in later.
 */
export default async function AdminOrderRequestsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/order-requests`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const tp = await getTranslations({ locale, namespace: "purchaseRequest" });
  const te = await getTranslations({ locale, namespace: "eventRequest" });

  const [purchaseGroups, eventGroups] = await Promise.all([
    getAllPurchaseRequestsForAdmin(),
    getAllEventRequestsForAdmin(),
  ]);

  const purchaseCount = purchaseGroups.reduce((n, g) => n + g.requests.length, 0);
  const eventCount = eventGroups.reduce((n, g) => n + g.requests.length, 0);

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("orderRequestsAdminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("orderRequestsAdminSubtitle", { count: purchaseCount + eventCount })}
        </p>
      </div>

      <div className="mt-10 space-y-14">
        <div>
          <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold">
            <PackageSearch size={18} aria-hidden="true" />
            {tp("dashboardTitle")}
          </h2>
          {purchaseGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
              <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{tp("noRequestsYet")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {purchaseGroups.map((group) => (
                <div key={group.listingId}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{group.listingName}</p>
                  <PurchaseRequestsTable listingId={group.listingId} requests={group.requests} revalidatePath={REVALIDATE_PATH} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-5 flex items-center gap-2 font-display text-lg font-bold">
            <PartyPopper size={18} aria-hidden="true" />
            {te("dashboardTitle")}
          </h2>
          {eventGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
              <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{te("noRequestsYet")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {eventGroups.map((group) => (
                <div key={group.listingId}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{group.listingName}</p>
                  <EventRequestsTable listingId={group.listingId} requests={group.requests} revalidatePath={REVALIDATE_PATH} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
