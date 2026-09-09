/**
 * Alerts — the signed-in user's notifications, read directly from the
 * website's existing `notifications` table (see lib/notifications.ts's own
 * comment: this table is already populated by 12+ existing DB triggers for
 * bookings/orders/reservations/appointments — zero new backend for this
 * screen). Plus a Realtime subscription so new activity appears without a
 * manual pull-to-refresh while the tab is open.
 *
 * Real OS-level push (background/closed-app delivery) is a separate,
 * fully-parked later phase — this is in-app only.
 */
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { AuthGate } from "@/components/auth-gate";
import { useConfirmExitOnBack } from "@/lib/back-handler";
import {
  useDeleteNotification,
  useLiveNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type AppNotification,
} from "@/lib/notifications";
import { useTheme } from "@/providers/theme-provider";
import { spacing } from "@/theme";
import { AppText, Card, Screen, Skeleton } from "@/ui";
import { EmptyState, ErrorState } from "@/ui/states";

function timeAgoOrDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString();
}

function NotificationRow({ item }: { item: AppNotification }) {
  const { theme } = useTheme();
  const markRead = useMarkNotificationRead();
  const deleteNotification = useDeleteNotification();

  return (
    <Pressable
      onPress={() => {
        if (!item.isRead) markRead.mutate(item.id);
      }}
    >
      <Card style={{ marginBottom: 10, gap: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 6,
              backgroundColor: item.isRead
                ? "transparent"
                : item.type === "error"
                  ? "#DC2626"
                  : theme.colors.primary,
            }}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
              <AppText variant="bodyStrong" style={{ flex: 1 }}>
                {item.title}
              </AppText>
              <AppText variant="label" color="muted">
                {timeAgoOrDate(item.createdAt)}
              </AppText>
            </View>
            {item.message ? (
              <AppText variant="caption" color="muted">
                {item.message}
              </AppText>
            ) : null}
          </View>
          <Pressable onPress={() => deleteNotification.mutate(item.id)} hitSlop={8}>
            <Ionicons name="close" size={16} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

function NotificationsList() {
  const { t } = useTranslation();
  const notifications = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  useLiveNotifications();

  const items = notifications.data?.pages.flat() ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  if (notifications.isPending) {
    return (
      <View style={{ gap: 10 }}>
        <Skeleton height={70} radius={16} />
        <Skeleton height={70} radius={16} />
        <Skeleton height={70} radius={16} />
      </View>
    );
  }

  if (notifications.isError) {
    return (
      <ErrorState
        title={t("alerts.error", "Couldn't load your alerts")}
        onAction={() => notifications.refetch()}
        actionLabel={t("common.retry", "Retry")}
      />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={t("alerts.emptyTitle", "No updates")}
        message={t("alerts.emptyBody", "Booking confirmations and order updates will show up here.")}
      />
    );
  }

  return (
    <View>
      {hasUnread ? (
        <Pressable onPress={() => markAllRead.mutate()} style={{ alignSelf: "flex-end", marginBottom: 10 }}>
          <AppText variant="label" color="primary">
            {t("alerts.markAllRead", "Mark all read")}
          </AppText>
        </Pressable>
      ) : null}
      {items.map((item) => (
        <NotificationRow key={item.id} item={item} />
      ))}
      {notifications.hasNextPage ? (
        <Pressable
          onPress={() => notifications.fetchNextPage()}
          style={{ alignItems: "center", paddingVertical: 12 }}
        >
          <AppText variant="label" color="primary">
            {notifications.isFetchingNextPage
              ? t("alerts.loadingMore", "Loading…")
              : t("alerts.loadMore", "Load more")}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function AlertsScreen() {
  useConfirmExitOnBack();
  const { t } = useTranslation();

  return (
    <Screen scroll>
      <AppText variant="display" style={{ marginBottom: spacing.section }}>
        {t("nav.alerts", "Alerts")}
      </AppText>
      <AuthGate>
        <NotificationsList />
      </AuthGate>
    </Screen>
  );
}
