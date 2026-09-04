/**
 * The signed-in user's `profiles` row — direct supabase-js (RLS: public
 * read, "Users update own profile"). Only the customer-relevant fields are
 * exposed here.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/env";
import { useAuth } from "@/providers/supabase-provider";

export interface Profile {
  id: string;
  fullName: string | null;
  phone: string | null;
  bio: string | null;
  createdAt: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["profile", userId],
    enabled: Boolean(userId) && isSupabaseConfigured,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, bio, created_at")
        .eq("id", userId as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        fullName: data.full_name,
        phone: data.phone,
        bio: data.bio,
        createdAt: data.created_at,
      };
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "fullName" | "phone" | "bio">>) => {
      const row: { full_name?: string | null; phone?: string | null; bio?: string | null } = {};
      if (patch.fullName !== undefined) row.full_name = patch.fullName || null;
      if (patch.phone !== undefined) row.phone = patch.phone || null;
      if (patch.bio !== undefined) row.bio = patch.bio || null;
      const { error } = await supabase
        .from("profiles")
        .update(row)
        .eq("id", user?.id as string);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}
