/**
 * In-app notifications (Alerts tab) — Layer 1 of the push-notifications
 * design: reads the website's ALREADY-EXISTING `notifications` table
 * directly (same architecture as reviews.ts/favorites.ts), the same table
 * 12+ existing DB triggers already write to for bookings/orders/
 * reservations/appointments (see supabase/migrations/
 * 20260801000005_notifications_system.sql and
 * 20260802000003_notifications_complete.sql) — zero new backend, zero
 * migration, zero change to those flows.
 *
 * `title`/`message` are stored as literal English strings by the DB
 * triggers themselves (verified by reading the actual INSERT statements —
 * not i18n keys), so they're rendered as-is here. The website re-derives a
 * localized string client-side from `category`/`data` for its own display
 * (lib/utils/notification-text.ts) — porting that whole category taxonomy
 * (~30 categories, plural rules) is out of scope for this minimal layer;
 * English-only notification text is an explicit, honest limitation, not an
 * oversight.
 *
 * Real OS-level push (background/closed-app delivery) is Layer 2 — fully
 * parked, not part of this file. This only covers in-app display while the
 * app is open (plus Realtime for "while open, without a manual refresh").
 */
import { useEffect } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/supabase-provider";

export type NotificationSeverity = "success" | "error" | "warning" | "info";

export interface AppNotification {
  id: string;
  title: string;
  message: string | null;
  type: NotificationSeverity;
  category: string | null;
  isRead: boolean;
  createdAt: string;
}

const PAGE_SIZE = 20;

function mapRow(row: {
  id: string;
  title: string;
  message: string | null;
  type: string;
  category: string | null;
  is_read: boolean;
  created_at: string;
}): AppNotification {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    type: (row.type as NotificationSeverity) ?? "info",
    category: row.category,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export function useNotifications() {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: ["notifications", user?.id],
    enabled: Boolean(user?.id),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from("notifications")
        .select("id, title, message, type, category, is_read, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (pageParam) query = query.lt("created_at", pageParam);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
    getNextPageParam: (lastPage) =>
      lastPage.length === PAGE_SIZE ? lastPage[lastPage.length - 1].createdAt : undefined,
  });
}

export function useMarkNotificationRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", notificationId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useMarkAllNotificationsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

export function useDeleteNotification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", notificationId).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] }),
  });
}

/** Realtime "while the app is open" refresh — a single per-screen
 *  subscription (this tab is never mounted twice at once, unlike the
 *  website's simultaneous desktop+mobile header bells, so none of
 *  use-live-notifications.ts's shared-channel dedup registry is needed
 *  here). Simply invalidates the list on any INSERT for this user. */
export function useLiveNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}

export function useUnreadNotificationCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications-unread-count", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
