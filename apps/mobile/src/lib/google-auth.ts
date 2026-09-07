/**
 * Google sign-in — the exact same Supabase-mediated OAuth flow the website
 * already uses (components/shared/oauth.tsx: supabase.auth.signInWithOAuth
 * with provider "google"). Google's consent screen is handled entirely by
 * Supabase's own hosted OAuth proxy using the Web OAuth client already
 * configured there for the website — this app needs no separate Google
 * Cloud client of its own, no new backend, no schema change.
 *
 * Native-specific additions over the website's flow (standard Supabase +
 * Expo pattern, not invented):
 *   - `skipBrowserRedirect: true` — the web flow auto-navigates via
 *     `window.location`; native has no such thing, so the resulting
 *     authorize URL is opened explicitly instead.
 *   - `expo-web-browser`'s `openAuthSessionAsync` opens that URL in the
 *     system browser and resolves once Google + Supabase redirect back to
 *     this app's own custom scheme (`Linking.createURL("/auth/callback")`
 *     resolves to `gohargeisa://auth/callback` in production or
 *     `gohargeisa-dev://auth/callback` in the dev client — both must be on
 *     Supabase's Redirect URLs allow-list, confirmed added).
 *   - `exchangeCodeForSession` completes the PKCE exchange (flowType:
 *     "pkce" is already set on this app's Supabase client) and persists
 *     the session into the existing secureStorage-backed store; the
 *     app-wide onAuthStateChange listener (supabase-provider.tsx) picks it
 *     up automatically — no extra plumbing needed.
 */
import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

import { supabase } from "@/lib/supabase";

// Required once per app for expo-web-browser's auth-session flow to
// correctly dismiss the browser and resolve openAuthSessionAsync's promise.
WebBrowser.maybeCompleteAuthSession();

export class GoogleSignInError extends Error {}

export function useSignInWithGoogle() {
  const [loading, setLoading] = useState(false);

  /** Returns `true` once a session is actually established, `false` when
   *  the user closed the browser / cancelled (not an error — the caller
   *  should just do nothing, not navigate as though signed in). Throws
   *  `GoogleSignInError` only on a genuine failure. */
  async function signInWithGoogle(): Promise<boolean> {
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("/auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw new GoogleSignInError(error.message);
      if (!data.url) throw new GoogleSignInError("Could not start Google sign-in.");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success" || !result.url) {
        return false;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
      if (exchangeError) throw new GoogleSignInError(exchangeError.message);
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { signInWithGoogle, loading };
}
