import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapEvent } from "./mappers";
import { events as mockEvents } from "@/lib/mock-data";
import type { EventItem } from "@/types";

export async function getEvents(options?: { category?: string }): Promise<EventItem[]> {
  const { category } = options ?? {};

  if (!isSupabaseConfigured()) {
    return category && category !== "all" ? mockEvents.filter((e) => e.category === category) : mockEvents;
  }

  const supabase = createPublicClient();
  let query = supabase.from("events").select("*").eq("status", "published").order("start_date", { ascending: true });
  if (category && category !== "all") query = query.eq("category", category as any);

  const { data, error } = await query;
  if (error) {
    console.error("getEvents:", error.message);
    return [];
  }
  return (data ?? []).map(mapEvent);
}

async function _getEventBySlug(slug: string): Promise<EventItem | null> {
  if (!isSupabaseConfigured()) return mockEvents.find((e) => e.slug === slug) ?? null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("events").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return mapEvent(data);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getEventBySlug = cache(_getEventBySlug);

export async function getAllEventSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockEvents.map((e) => e.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("events").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
