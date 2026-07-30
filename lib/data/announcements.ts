import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import type { SiteAnnouncement } from "@/types";

/** Public, published-only, no cookies — safe for ISR. Returns the single
 * most recent published announcement, or null (the homepage banner simply
 * doesn't render when there isn't one — no fake/placeholder announcement
 * is ever shown). */
export async function getLatestAnnouncement(): Promise<SiteAnnouncement | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_announcements")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    message: data.message,
    linkUrl: data.link_url,
    linkLabel: data.link_label,
    status: data.status,
    createdAt: data.created_at,
  };
}
