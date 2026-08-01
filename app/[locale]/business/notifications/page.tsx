import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { NotificationList } from "@/components/shared/notification-list";

export const metadata: Metadata = { title: "Notifications — Business", robots: { index: false, follow: false } };

export default async function BusinessNotificationsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "businessDashboard" });

  const [items, unread] = await Promise.all([getUserNotifications(50), getUnreadNotificationCount()]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{t("navNotifications")}</h1>

      <div className="mt-6">
        <NotificationList locale={locale} initialItems={items} initialUnread={unread} />
      </div>
    </div>
  );
}
