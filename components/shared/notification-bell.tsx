"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useFormatter } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import { Bell, Check, CheckCheck, Sparkles, Trash2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getUserNotifications, getUnreadNotificationCount } from "@/lib/actions/notifications";
import { useLiveNotifications } from "@/lib/hooks/use-live-notifications";
import { getNotificationText } from "@/lib/utils/notification-text";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import type { Notification } from "@/types";

/**
 * Global notification bell — mounted once in the site header for any
 * signed-in user, regardless of role. All three audiences (admin, business
 * owner, guest) share this one dropdown; RLS already scopes every fetch to
 * the signed-in user's own rows, so no role prop changes what's fetched,
 * only where "View all" links to.
 */
export function NotificationBell({
  locale,
  scrolled,
  isOwner,
  isBusinessOwner,
}: {
  locale: Locale;
  scrolled: boolean;
  isOwner: boolean;
  isBusinessOwner: boolean;
}) {
  const t = useTranslations("notifications");
  const format = useFormatter();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [seed, setSeed] = useState<{ items: Notification[]; unread: number }>({ items: [], unread: 0 });
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    let active = true;
    // Both Server Actions reject outright when offline — caught so a
    // signed-in visitor loading a page offline doesn't throw an unhandled
    // rejection (this component is mounted twice per page, desktop + mobile).
    Promise.all([getUserNotifications(10), getUnreadNotificationCount()])
      .then(([items, unread]) => {
        if (active) setSeed({ items, unread });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const { items, unreadCount, markOneRead, markAllRead, deleteOne } = useLiveNotifications(seed.items, seed.unread);

  const homeHref = isOwner
    ? `/${locale}/admin/notifications`
    : isBusinessOwner
      ? `/${locale}/business/notifications`
      : `/${locale}/dashboard?tab=notifications`;

  function onItemClick(n: Notification, href: string | null) {
    if (!n.isRead) void markOneRead(n.id);
    setOpen(false);
    if (href) router.push(href);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("panelTitle")}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          scrolled
            ? "text-gray-800 hover:bg-primary/10 dark:text-white/90"
            : "text-white hover:bg-white/10"
        }`}
      >
        <Bell size={19} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-overlay bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute end-0 top-12 z-overlay w-80 max-w-[92vw] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-premium dark:border-white/10 dark:bg-ink"
            >
              <div className="flex items-center justify-between gap-2 border-b border-ink/8 px-4 py-3 dark:border-white/10">
                <p className="text-sm font-bold">{t("panelTitle")}</p>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void markAllRead()}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <CheckCheck size={13} aria-hidden="true" /> {t("markAllRead")}
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center px-4 py-10 text-center">
                    <Sparkles size={22} className="text-ink/25 dark:text-sand/25" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold">{t("emptyTitle")}</p>
                    <p className="mt-1 text-xs text-ink/50 dark:text-sand/50">{t("emptyDescription")}</p>
                  </div>
                ) : (
                  items.map((n) => {
                    const { title, body, href } = getNotificationText(t, locale, n);
                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onItemClick(n, href)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onItemClick(n, href);
                          }
                        }}
                        className={`flex w-full cursor-pointer items-start gap-2 border-b border-ink/5 px-4 py-3 text-start last:border-0 dark:border-white/5 ${
                          n.isRead ? "" : "bg-primary/5"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{title}</p>
                          {body && <p className="mt-0.5 line-clamp-2 text-xs text-ink/55 dark:text-sand/55">{body}</p>}
                          <p className="mt-1 text-[11px] text-ink/35 dark:text-sand/35">
                            {format.relativeTime(new Date(n.createdAt))}
                          </p>
                        </div>
                        <div className="mt-0.5 flex shrink-0 items-center gap-1">
                          {!n.isRead && (
                            <button
                              type="button"
                              aria-label={t("markRead")}
                              onClick={(e) => {
                                e.stopPropagation();
                                void markOneRead(n.id);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 text-ink/40 hover:border-primary hover:text-primary dark:border-white/15"
                            >
                              <Check size={12} />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={t("deleteNotification")}
                            onClick={(e) => {
                              e.stopPropagation();
                              void deleteOne(n.id);
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/10 text-ink/40 hover:border-red-500 hover:text-red-500 dark:border-white/15"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <Link
                href={homeHref}
                onClick={() => setOpen(false)}
                className="block border-t border-ink/8 px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-primary/5 dark:border-white/10"
              >
                {t("viewAll")}
              </Link>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
