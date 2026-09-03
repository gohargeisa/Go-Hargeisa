/**
 * Auth session context. Wraps the one `supabase` client, exposes the current
 * session/user, and keeps the auth-refresh timer tied to app focus.
 *
 * Sign-in / sign-up / OAuth flows are added in P1c–P1d; this provider only
 * owns SESSION STATE so screens can gate on it now.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/env";
import { supabase, startAuthAutoRefresh } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  configured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // When Supabase isn't configured there's no session to resolve — start
  // settled so the UI never hangs on a spinner.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    const stopRefresh = startAuthAutoRefresh();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      stopRefresh();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      status: loading
        ? "loading"
        : session
          ? "authenticated"
          : "anonymous",
      configured: isSupabaseConfigured,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <SupabaseProvider>");
  return ctx;
}
