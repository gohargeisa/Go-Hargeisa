"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface HeaderUser {
  name: string;
  isOwner: boolean;
  isBusinessOwner: boolean;
  avatarUrl?: string;
}

interface Profile {
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
}

/**
 * Resolves the signed-in user's header info entirely client-side.
 *
 * This intentionally does NOT run on the server: the layout that renders
 * <SiteHeader> must stay free of cookies()/auth calls so public pages can
 * be statically generated and revalidated on a schedule instead of being
 * forced into full dynamic SSR on every request.
 */
export function useHeaderUser(): { user: HeaderUser | null; loading: boolean } {
  const [user, setUser] = useState<HeaderUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", authUser.id)
        .single();

      const profile = data as Profile | null;

      if (active) {
        setUser({
          name: profile?.full_name ?? authUser.email?.split("@")[0] ?? "Account",
          isOwner: profile?.role === "owner",
          isBusinessOwner: profile?.role === "business_owner",
          avatarUrl: profile?.avatar_url ?? undefined,
        });

        setLoading(false);
      }
    }

    load();

    // Re-resolve whenever auth state changes (sign in, sign out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}