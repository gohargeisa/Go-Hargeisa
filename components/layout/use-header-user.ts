"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface HeaderUser {
  name: string;
  isAdmin: boolean;
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
 * be statically generated and revalidated on a schedule (see each page's
 * `export const revalidate`) instead of being forced into full dynamic SSR
 * on every request. The trade-off is a brief "signed out" flash on first
 * paint for returning visitors, which is standard for this pattern.
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
          isAdmin: profile?.role === "admin",
          avatarUrl: profile?.avatar_url ?? undefined,
        });

        setLoading(false);
      }
    }

    load();

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