import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { destinations as mockDestinations } from "@/lib/mock-data";
import type { Destination } from "@/types";

export async function getDestinations(): Promise<Destination[]> {
  if (!isSupabaseConfigured()) return mockDestinations;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("destinations").select("*").order("place_count", { ascending: false });
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getDestinations:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    image: row.image,
    placeCount: row.place_count,
    highlights: [],
  }));
}

export async function getDestinationBySlug(slug: string): Promise<Destination | null> {
  if (!isSupabaseConfigured()) return mockDestinations.find((d) => d.slug === slug) ?? null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("destinations").select("*").eq("slug", slug).single();
  if (error || !data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    image: data.image,
    placeCount: data.place_count,
    highlights: [],
  };
}
