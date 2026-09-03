/**
 * TanStack Query client. Reads go through `/api/v1/*` (see src/lib/api.ts);
 * writes go straight to the Supabase SECURITY DEFINER RPCs. Tuned for a
 * mobile network: generous staleness, retry once, no window-focus refetch
 * (there is no window — an AppState listener handles resume in P1d).
 */
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
