"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { toHeaderUser, type HeaderUser } from "@/lib/supabase/header-user";

export type { HeaderUser };

/**
 * Resolves the signed-in user's header info, seeded from `initialUser` —
 * resolved server-side by lib/supabase/guards.ts#getHeaderUser() in
 * app/[locale]/layout.tsx, using the same cookie-based session that gates
 * /dashboard and /admin, so the header is correct on first paint (no
 * "signed out" flash, no client/server mismatch).
 *
 * A live subscription still re-resolves on sign-in/sign-out/token refresh
 * so the header updates immediately without a page reload.
 */
export function useHeaderUser(initialUser: HeaderUser | null): { user: HeaderUser | null; loading: boolean } {
  const [user, setUser] = useState<HeaderUser | null>(initialUser);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        if (active) setUser(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", authUser.id)
        .single();

      if (active) setUser(toHeaderUser(authUser, data));
    }

    // The initial session is already reflected in `initialUser` (resolved
    // server-side), so skip re-fetching on the INITIAL_SESSION event and
    // only react to actual changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "INITIAL_SESSION") return;
      load();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading: false };
}
