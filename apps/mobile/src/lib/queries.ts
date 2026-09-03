/**
 * TanStack Query hooks over the `/api/v1` client. Query keys include the
 * active locale so a language switch refetches localized copy.
 */
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { CityServiceListParams } from "@gohargeisa/api";

import { api } from "@/lib/api";
import { getActiveLocale } from "@/i18n";

export function useCategories() {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["categories", locale],
    queryFn: ({ signal }) => api.categories.list(signal),
  });
}

export function useCityServices(params: CityServiceListParams = {}) {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["city-services", locale, params],
    queryFn: ({ signal }) => api.cityServices.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCityService(slug: string | undefined) {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["city-service", locale, slug],
    queryFn: ({ signal }) => api.cityServices.get(slug as string, signal),
    enabled: Boolean(slug),
  });
}
