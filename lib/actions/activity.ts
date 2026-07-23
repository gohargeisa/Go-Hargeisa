"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export type ActivityAction = 
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "archive"
  | "role_change"
  | "settings_update";

export async function logActivity(
  action: ActivityAction,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Not authenticated" };
    }

    // Get IP and user agent from headers
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || undefined;
    const userAgent = headersList.get("user-agent") || undefined;

    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.id,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) {
      console.warn("Failed to log activity:", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    console.warn("Activity logging error:", err);
    return { ok: true }; // Don't fail the main operation
  }
}

export async function getActivityLogs(limit = 50): Promise<any[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    // Check if user is owner
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "owner") return [];

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("Failed to fetch activity logs:", error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn("Error fetching activity logs:", err);
    return [];
  }
}
