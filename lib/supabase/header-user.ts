import type { User } from "@supabase/supabase-js";

export interface HeaderUser {
  name: string;
  isOwner: boolean;
  isBusinessOwner: boolean;
  avatarUrl?: string;
}

export interface HeaderProfile {
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
}

/**
 * Shared by the server-side resolver (lib/supabase/guards.ts#getHeaderUser,
 * used in app/[locale]/layout.tsx) and the client-side one
 * (components/layout/use-header-user.ts) so both compute the exact same
 * shape from an auth user + profile row.
 */
export function toHeaderUser(authUser: Pick<User, "email">, profile: HeaderProfile | null): HeaderUser {
  return {
    name: profile?.full_name ?? authUser.email?.split("@")[0] ?? "Account",
    isOwner: profile?.role === "owner",
    isBusinessOwner: profile?.role === "business_owner",
    avatarUrl: profile?.avatar_url ?? undefined,
  };
}
