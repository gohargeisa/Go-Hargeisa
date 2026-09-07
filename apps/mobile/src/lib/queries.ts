/**
 * TanStack Query hooks over the `/api/v1` client. Query keys include the
 * active locale so a language switch refetches localized copy.
 */
import { useMutation, useQuery, keepPreviousData } from "@tanstack/react-query";
import type {
  CityServiceListParams,
  RestaurantCafeListParams,
  SubmitAppointmentInput,
} from "@gohargeisa/api";

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

/** Restaurants have no localized name/description columns, so the query key
 *  doesn't need to include locale — kept anyway for consistency and in case
 *  that changes. */
export function useRestaurants(params: RestaurantCafeListParams = {}) {
  return useQuery({
    queryKey: ["restaurants", params],
    queryFn: ({ signal }) => api.restaurants.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useRestaurant(slug: string | undefined) {
  return useQuery({
    queryKey: ["restaurant", slug],
    queryFn: ({ signal }) => api.restaurants.get(slug as string, signal),
    enabled: Boolean(slug),
  });
}

export function useCafes(params: RestaurantCafeListParams = {}) {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["cafes", locale, params],
    queryFn: ({ signal }) => api.cafes.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCafe(slug: string | undefined) {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["cafe", locale, slug],
    queryFn: ({ signal }) => api.cafes.get(slug as string, signal),
    enabled: Boolean(slug),
  });
}

/** Hotels' list endpoint has no locale param (see HotelListItem's own
 *  comment) — mirrors useRestaurants' rationale. */
export function useHotels(params: RestaurantCafeListParams = {}) {
  return useQuery({
    queryKey: ["hotels", params],
    queryFn: ({ signal }) => api.hotels.list(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useHotel(slug: string | undefined) {
  const locale = getActiveLocale();
  return useQuery({
    queryKey: ["hotel", locale, slug],
    queryFn: ({ signal }) => api.hotels.get(slug as string, signal),
    enabled: Boolean(slug),
  });
}

/** Slot availability for one doctor on one date — refetches whenever either
 *  changes (mirrors the website's booking form re-fetch-on-change). */
export function useAppointmentSlots(doctorId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ["appointment-slots", doctorId, date],
    queryFn: ({ signal }) => api.appointments.slots(doctorId as string, date as string, signal),
    enabled: Boolean(doctorId && date),
  });
}

export function useSubmitAppointment() {
  return useMutation({
    mutationFn: (input: SubmitAppointmentInput) => api.appointments.submit(input),
  });
}
