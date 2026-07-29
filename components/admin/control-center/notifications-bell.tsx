"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { markNotificationAsRead } from "@/lib/actions/notifications";

export interface NotificationItem {
  id: string;
  title: string;
  message: string | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationsBell({ initialItems, initialUnread }: { initialItems: NotificationItem[]; initialUnread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(initialItems);
  const [unread, setUnread] = useState(initialUnread);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onMarkRead(id: string) {
    startTransition(async () => {
      const result = await markNotificationAsRead(id);
      if (result.ok) {
        setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        setUnread((u) => Math.max(0, u - 1));
        router.refresh();
      }
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-xl transition-colors hover:bg-white/20"
      >
        <Bell size={17} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute end-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-premium dark:border-white/10 dark:bg-ink"
            >
              <div className="border-b border-ink/8 px-4 py-3 dark:border-white/10">
                <p className="text-sm font-bold">Notifications</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink/40 dark:text-sand/40">You're all caught up.</p>
                ) : (
                  items.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-2 border-b border-ink/5 px-4 py-3 text-start last:border-0 dark:border-white/5 ${
                        n.is_read ? "" : "bg-primary/5"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{n.title}</p>
                        {n.message && <p className="mt-0.5 text-xs text-ink/55 dark:text-sand/55">{n.message}</p>}
                      </div>
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(n.id)}
                          disabled={isPending}
                          aria-label="Mark as read"
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/40 hover:border-primary hover:text-primary dark:border-white/15"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
