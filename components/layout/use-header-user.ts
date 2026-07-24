"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface HeaderUser {
  name: string;
  isOwner: boolean;
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
        error: authError,
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", authUser);
      console.log("AUTH ERROR:", authError);

      if (!authUser) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, role, avatar_url")
        .eq("id", authUser.id)
        .single();

      console.log("PROFILE:", data);
      console.log("PROFILE ERROR:", error);

      const profile = data as Profile | null;

      if (active) {
        setUser({
          name: profile?.full_name ?? authUser.email?.split("@")[0] ?? "Account",
          isOwner: profile?.role === "owner",
          avatarUrl: profile?.avatar_url ?? undefined,
        });

        setLoading(false);
      }
    }

    // تحميل المستخدم عند فتح الموقع
    load();

    // تحديث تلقائي عند تسجيل الدخول أو الخروج
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