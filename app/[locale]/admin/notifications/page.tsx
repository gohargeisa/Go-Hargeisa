import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { NotificationList } from "@/components/shared/notification-list";

export const metadata: Metadata = { title: "Notifications — Admin", robots: { index: false, follow: false } };

export default async function AdminNotificationsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/notifications`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const [items, unread] = await Promise.all([getUserNotifications(50), getUnreadNotificationCount()]);

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("notificationsNav")}</h1>
      </div>

      <div className="mt-8">
        <NotificationList locale={locale} initialItems={items} initialUnread={unread} />
      </div>
    </section>
  );
}
