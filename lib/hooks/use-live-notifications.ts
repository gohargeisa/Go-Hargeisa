"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapNotification } from "@/lib/data/mappers";
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notifications";
import type { Notification } from "@/types";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/**
 * Client-side live view of the signed-in user's notifications — seeded
 * from server-fetched `initialItems`/`initialUnread` (no flash of empty
 * state), then kept current two ways: a Supabase Realtime subscription for
 * new rows arriving from another session/device, and optimistic local
 * updates for mark-read actions the user triggers here themselves.
 *
 * The signed-in user's id is resolved client-side purely to scope the
 * realtime channel filter — every actual read/write still goes through
 * the session-authenticated server actions in lib/actions/notifications.ts,
 * which independently enforce "own rows only" via RLS/auth.uid(), so
 * callers don't need to source or pass an id themselves.
 */
export function useLiveNotifications(initialItems: Notification[], initialUnread: number) {
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setUnreadCount(initialUnread);
    // Only re-sync when the server-fetched snapshot itself changes (e.g.
    // navigating between pages that each fetch their own initial page of
    // notifications) — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems, initialUnread]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setUserId(data.user?.id ?? null);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = mapNotification(payload.new as NotificationRow);
          setItems((prev) => [next, ...prev].slice(0, 50));
          if (!next.isRead) setUnreadCount((count) => count + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markOneRead = useCallback(async (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));

    const result = await markNotificationAsRead(id);
    if (!result.ok) {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      setUnreadCount((count) => count + 1);
    }
  }, [items]);

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    const result = await markAllNotificationsAsRead();
    if (!result.ok) {
      setItems(previous);
      setUnreadCount(previous.filter((n) => !n.isRead).length);
    }
  }, [items]);

  return { items, unreadCount, markOneRead, markAllRead };
}
