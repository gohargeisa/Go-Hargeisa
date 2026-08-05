"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { Bell, Check, CheckCheck, Loader2, Sparkles, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { useLiveNotifications } from "@/lib/hooks/use-live-notifications";
import { getNotificationText } from "@/lib/utils/notification-text";
import { EmptyState } from "@/components/shared/empty-state";
import type { Notification } from "@/types";

/**
 * Full-page notification center — mounted at /admin/notifications,
 * /business/notifications, and the consumer /dashboard "Notifications"
 * tab. Same live data/actions as <NotificationBell>, just laid out as a
 * scannable list instead of a header dropdown.
 */
export function NotificationList({
  locale,
  initialItems,
  initialUnread,
}: {
  locale: Locale;
  initialItems: Notification[];
  initialUnread: number;
}) {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const router = useRouter();
  // "X minutes ago" depends on the render-time clock, which can differ by a
  // few seconds between the server render and the client hydration pass —
  // enough to land on a different label (e.g. "59s ago" vs "1m ago") and
  // trigger a hydration-mismatch error. Rendered only after mount, like
  // every other clock-dependent value in this codebase (open-status-badge.tsx).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { items, unreadCount, markOneRead, markAllRead, deleteOne, loadMore, hasMore, isLoadingMore } = useLiveNotifications(
    initialItems,
    initialUnread
  );

  if (items.length === 0) {
    return <EmptyState icon={Sparkles} title={t("emptyTitle")} description={t("emptyDescription")} />;
  }

  return (
    <div className="rounded-2xl border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Bell size={17} className="text-primary" aria-hidden="true" />
          <p className="text-sm font-semibold">{t("unreadCount", { count: unreadCount })}</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary dark:border-white/15"
          >
            <CheckCheck size={13} aria-hidden="true" /> {t("markAllRead")}
          </button>
        )}
      </div>

      <div className="divide-y divide-ink/5 dark:divide-white/5">
        {items.map((n) => {
          const { title, body, href } = getNotificationText(t, locale, n);
          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                if (!n.isRead) void markOneRead(n.id);
                if (href) router.push(href);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                if (!n.isRead) void markOneRead(n.id);
                if (href) router.push(href);
              }}
              className={`flex w-full items-start gap-3 px-5 py-4 text-start transition-colors ${href ? "cursor-pointer hover:bg-primary/[0.03]" : ""} ${
                n.isRead ? "" : "bg-primary/5"
              }`}
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.isRead ? "bg-transparent" : "bg-primary"}`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                {body && <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{body}</p>}
                <p className="mt-1.5 text-xs text-ink/35 dark:text-sand/35">
                  {mounted ? format.relativeTime(new Date(n.createdAt)) : " "}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void markOneRead(n.id);
                    }}
                    aria-label={t("markRead")}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink/40 hover:border-primary hover:text-primary dark:border-white/15"
                  >
                    <Check size={13} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    void deleteOne(n.id);
                  }}
                  aria-label={t("deleteNotification")}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-ink/40 hover:border-red-500 hover:text-red-500 dark:border-white/15"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="border-t border-ink/8 px-5 py-4 text-center dark:border-white/10">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
          >
            {isLoadingMore && <Loader2 size={13} className="animate-spin" />} {t("loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
