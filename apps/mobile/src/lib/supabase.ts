/**
 * The native Supabase client — same project as the website, PUBLIC anon key
 * only, RLS-enforced. Auth tokens persist in the OS keychain via
 * `secureStorage`; the PKCE flow is used for the Google OAuth redirect
 * (`expo-web-browser`) in P1c/P1d.
 *
 * There is exactly one client for the app's lifetime.
 */
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import type { Database } from "@gohargeisa/types";
import { env, isSupabaseConfigured } from "@/env";
import { secureStorage } from "@/lib/secure-storage";

export const supabase = createClient<Database>(
  // Falls back to harmless placeholders when unconfigured so the module still
  // loads; `isSupabaseConfigured` gates any real call.
  env.supabaseUrl || "https://placeholder.supabase.co",
  env.supabaseAnonKey || "public-anon-placeholder",
  {
    auth: {
      storage: secureStorage,
      storageKey: "gohargeisa-auth",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no URL-based sessions in a native app
      flowType: "pkce",
    },
  },
);

// Supabase recommends pausing/resuming the refresh timer with app focus so a
// backgrounded app doesn't spin token refreshes.
let appStateSub: { remove: () => void } | null = null;

export function startAuthAutoRefresh(): () => void {
  if (!isSupabaseConfigured || appStateSub) return () => {};
  appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
  supabase.auth.startAutoRefresh();
  return () => {
    appStateSub?.remove();
    appStateSub = null;
    supabase.auth.stopAutoRefresh();
  };
}
