/**
 * Runtime configuration for the native app.
 *
 * `process.env.EXPO_PUBLIC_*` are inlined by Metro at build time and MUST be
 * referenced statically (no `process.env[dynamicKey]`), so each is read by
 * name here. `Constants.expoConfig.extra` (from app.config.ts) is the
 * fallback for values that also have a non-public default.
 *
 * NOTHING secret lives here. The mobile app is a public client: it ships the
 * Supabase URL + anon (publishable) key and relies entirely on RLS. The
 * service-role key must never reach this file or the bundle.
 */
import Constants from "expo-constants";

type Extra = {
  apiBaseUrl?: string;
  appVariant?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const nonEmpty = (v: string | undefined, fallback = ""): string =>
  typeof v === "string" && v.length > 0 ? v : fallback;

export const env = {
  supabaseUrl: nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: nonEmpty(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  /** Where the additive `/api/v1/*` read layer lives (the website). */
  apiBaseUrl: nonEmpty(
    process.env.EXPO_PUBLIC_API_BASE_URL,
    extra.apiBaseUrl ?? "https://gohargeisa.com",
  ).replace(/\/+$/, ""),
  appVariant: nonEmpty(
    process.env.APP_VARIANT,
    extra.appVariant ?? "development",
  ),
} as const;

export const isProdVariant = env.appVariant === "production";

/** True only when Supabase is wired up — screens fall back to a config
 *  notice instead of crashing when it isn't (e.g. a bare CI export). */
export const isSupabaseConfigured =
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0;
