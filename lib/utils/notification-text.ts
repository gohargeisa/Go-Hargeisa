import type { Locale } from "@/lib/i18n/config";
import type { Notification } from "@/types";

type Translator = (key: string, values?: Record<string, string | number>) => string;

const BOOKING_STATUSES = new Set(["pending", "confirmed", "cancelled", "completed"]);

/**
 * Resolves a notification's `category` + `data` into a localized
 * {title, body, href}. Falls back to the row's raw (English) title/message
 * for any notification with no recognised category — old rows written
 * before this system existed, or anything future code forgets to map here.
 * `t` must come from useTranslations("notifications") / getTranslations
 * with that namespace.
 */
export function getNotificationText(
  t: Translator,
  locale: Locale,
  n: Notification
): { title: string; body: string | null; href: string | null } {
  const d = n.data;
  const href = n.actionUrl ? `/${locale}${n.actionUrl}` : null;
  const str = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

  switch (n.category) {
    case "business_claim_new":
      return { title: t("businessClaimNewTitle"), body: t("businessClaimNewBody", { name: str(d.fullName) }), href };
    case "contact_message_new":
      return { title: t("contactMessageNewTitle"), body: t("contactMessageNewBody", { name: str(d.name), preview: str(d.messagePreview) }), href };
    case "join_request_new":
      return { title: t("joinRequestNewTitle"), body: t("joinRequestNewBody", { name: str(d.businessName) }), href };
    case "join_request_approved":
      return { title: t("joinRequestApprovedTitle"), body: t("joinRequestApprovedBody", { name: str(d.businessName) }), href };
    case "join_request_rejected":
      return { title: t("joinRequestRejectedTitle"), body: t("joinRequestRejectedBody", { name: str(d.businessName) }), href };
    case "booking_new":
      return { title: t("bookingNewTitle"), body: t("bookingNewBody", { guest: str(d.guestName), listing: str(d.listingName) }), href };
    case "reservation_new":
      return { title: t("reservationNewTitle"), body: t("reservationNewBody", { guest: str(d.customerName), listing: str(d.listingName) }), href };
    case "order_new":
      return { title: t("orderNewTitle"), body: t("orderNewBody", { guest: str(d.customerName), listing: str(d.listingName) }), href };
    case "appointment_new":
      return { title: t("appointmentNewTitle"), body: t("appointmentNewBody", { guest: str(d.patientName), listing: str(d.listingName) }), href };
    case "booking_status": {
      const status = typeof d.status === "string" && BOOKING_STATUSES.has(d.status) ? d.status : "pending";
      return { title: t("bookingStatusTitle"), body: t(`bookingStatusBody_${status}`, { listing: str(d.listingName) }), href };
    }
    case "review_new":
      return { title: t("reviewNewTitle"), body: t("reviewNewBody", { listing: str(d.listingName), rating: str(d.rating) }), href };
    case "offer_approved":
      return { title: t("offerApprovedTitle"), body: t("offerApprovedBody", { offer: str(d.offerTitle) }), href };
    case "offer_rejected":
      return { title: t("offerRejectedTitle"), body: t("offerRejectedBody", { offer: str(d.offerTitle) }), href };
    case "message_new":
      return { title: t("messageNewTitle"), body: t("messageNewBody", { sender: str(d.senderName), listing: str(d.listingName) }), href };
    case "review_reply":
      return { title: t("reviewReplyTitle"), body: t("reviewReplyBody", { listing: str(d.listingName) }), href };
    case "promotion_new":
      return { title: t("promotionNewTitle"), body: t("promotionNewBody", { offer: str(d.offerTitle), listing: str(d.listingName) }), href };
    case "event_published":
      return { title: t("eventPublishedTitle"), body: t("eventPublishedBody", { event: str(d.eventTitle) }), href };
    case "account_verified":
      return { title: t("accountVerifiedTitle"), body: t("accountVerifiedBody", { listing: str(d.listingName) }), href };
    case "system_announcement":
      return { title: str(d.announcementTitle) || n.title, body: str(d.announcementMessage) || n.message, href };
    default:
      return { title: n.title, body: n.message, href };
  }
}
