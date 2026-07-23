"use server";

import { createClient } from "@/lib/supabase/server";

export type NotificationType = "success" | "error" | "warning" | "info";

export async function createNotification(
  userId: string,
  title: string,
  message?: string,
  type: NotificationType = "info",
  actionUrl?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message: message || null,
      type,
      action_url: actionUrl || null,
    });

    if (error) {
      console.warn("Failed to create notification:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.warn("Error creating notification:", err);
    return { ok: false, error: "Failed to create notification" };
  }
}

export async function getUserNotifications(limit = 20, onlyUnread = false) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (onlyUnread) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Failed to fetch notifications:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("Error fetching notifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to mark as read" };
  }
}

export async function deleteNotification(notificationId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { ok: false, error: "Not authenticated" };

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: "Failed to delete notification" };
  }
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return 0;

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) return 0;
    return count || 0;
  } catch (err) {
    return 0;
  }
}
