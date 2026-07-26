import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseAnonKey } from "@/lib/supabase/is-configured";

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getPublicSupabaseAnonKey());
}