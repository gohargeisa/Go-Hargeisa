"use client";

import { useCallback, useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapNotification } from "@/lib/data/mappers";
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getMoreNotifications } from "@/lib/actions/notifications";
import type { Notification } from "@/types";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type InsertListener = (n: Notification) => void;

/**
 * lib/supabase/client.ts's createClient() returns a cached singleton
 * SupabaseClient in the browser, and Supabase's RealtimeClient.channel(topic)
 * returns the SAME channel object for a repeated topic string instead of a
 * fresh one. Two components mounting this hook at once for the same user
 * (e.g. the header's desktop + mobile notification bells, both rendered in
 * the DOM simultaneously) would otherwise both call .channel("notifications-
 * <uid>") and get back the same object — the second caller's .on() then
 * throws "cannot add `postgres_changes` callbacks ... after `subscribe()`"
 * because the first caller already subscribed it.
 *
 * This module-level registry makes exactly one real channel.on().subscribe()
 * happen per userId per browser tab, however many components observe it,
 * and only tears it down once the last one unmounts.
 */
const sharedChannels = new Map<string, { channel: RealtimeChannel; listeners: Set<InsertListener>; refCount: number }>();

function subscribeShared(userId: string, onInsert: InsertListener): () => void {
  let entry = sharedChannels.get(userId);

  if (!entry) {
    const listeners = new Set<InsertListener>();
    const channel = createClient()
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const next = mapNotification(payload.new as NotificationRow);
          listeners.forEach((listener) => listener(next));
        }
      )
      .subscribe();
    entry = { channel, listeners, refCount: 0 };
    sharedChannels.set(userId, entry);
  }

  entry.listeners.add(onInsert);
  entry.refCount += 1;

  return () => {
    const current = sharedChannels.get(userId);
    if (!current) return;
    current.listeners.delete(onInsert);
    current.refCount -= 1;
    if (current.refCount <= 0) {
      createClient().removeChannel(current.channel);
      sharedChannels.delete(userId);
    }
  };
}

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
export function useLiveNotifications(
  initialItems: Notification[],
  initialUnread: number,
  pageSize = 20,
  onInsert?: (n: Notification) => void
) {
  const [items, setItems] = useState<Notification[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialItems.length >= pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setItems(initialItems);
    setUnreadCount(initialUnread);
    setHasMore(initialItems.length >= pageSize);
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

    return subscribeShared(userId, (next) => {
      setItems((prev) => [next, ...prev].slice(0, 50));
      if (!next.isRead) setUnreadCount((count) => count + 1);
      onInsert?.(next);
    });
    // onInsert is a per-render closure (usually inline in the caller); only
    // userId should ever re-subscribe the channel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Every Server Action call below is wrapped in try/catch, not just
  // checked for `!result.ok` — offline (or any genuine network failure)
  // makes the call itself reject, which would otherwise both throw an
  // unhandled rejection and skip the optimistic-update rollback entirely.

  const markOneRead = useCallback(async (id: string) => {
    const target = items.find((n) => n.id === id);
    if (!target || target.isRead) return;

    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));

    function rollback() {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      setUnreadCount((count) => count + 1);
    }

    try {
      const result = await markNotificationAsRead(id);
      if (!result.ok) rollback();
    } catch {
      rollback();
    }
  }, [items]);

  const markAllRead = useCallback(async () => {
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    function rollback() {
      setItems(previous);
      setUnreadCount(previous.filter((n) => !n.isRead).length);
    }

    try {
      const result = await markAllNotificationsAsRead();
      if (!result.ok) rollback();
    } catch {
      rollback();
    }
  }, [items]);

  const deleteOne = useCallback(async (id: string) => {
    const found = items.find((n) => n.id === id);
    if (!found) return;
    // Rebound as a plain `Notification` (not `| undefined`) so the
    // `rollback` closure below doesn't lose the narrowing `found` already has.
    const target: Notification = found;

    setItems((prev) => prev.filter((n) => n.id !== id));
    if (!target.isRead) setUnreadCount((count) => Math.max(0, count - 1));

    function rollback() {
      setItems((prev) => [...prev, target].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
      if (!target.isRead) setUnreadCount((count) => count + 1);
    }

    try {
      const result = await deleteNotification(id);
      if (!result.ok) rollback();
    } catch {
      rollback();
    }
  }, [items]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || items.length === 0) return;
    setIsLoadingMore(true);
    const oldestCreatedAt = items[items.length - 1].createdAt;
    try {
      const next = await getMoreNotifications(oldestCreatedAt, pageSize);
      setItems((prev) => [...prev, ...next]);
      setHasMore(next.length >= pageSize);
    } catch {
      // Offline or a genuine server error — leave the existing list as-is
      // rather than getting stuck with the "Load more" button spinning.
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, items, pageSize]);

  return { items, unreadCount, markOneRead, markAllRead, deleteOne, loadMore, hasMore, isLoadingMore };
}
