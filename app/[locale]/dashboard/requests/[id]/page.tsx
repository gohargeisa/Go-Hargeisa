import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/supabase/guards";
import { getMyPurchaseRequestById } from "@/lib/data/purchase-requests";
import { PurchaseRequestTrackingView } from "@/components/dashboard/purchase-request-tracking-view";

export const metadata: Metadata = { title: "Order Request — Go Hargeisa", robots: { index: false } };

export default async function PurchaseRequestTrackingPage({ params: { locale, id } }: { params: { locale: Locale; id: string } }) {
  await requireUser(locale, `/${locale}/dashboard/requests/${id}`);

  const request = await getMyPurchaseRequestById(id);
  if (!request) notFound();

  return <PurchaseRequestTrackingView locale={locale} request={request} />;
}
