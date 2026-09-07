/**
 * A transport-injected client for `/api/v1/*`.
 *
 * The caller supplies how a request is actually made (base URL, auth header,
 * timeout, locale header, JSON parsing). On native that's
 * `apps/mobile/src/lib/api.ts#apiFetch`; a test can pass a fake.
 *
 * Paths passed to the transport are RELATIVE to `/api/v1` and always start
 * with "/".
 */
import type {
  CafeDetail,
  CafeListItem,
  CategoryDTO,
  CityServiceDetail,
  CityServiceListItem,
  CityServiceListParams,
  HealthResponse,
  HotelDetail,
  HotelListItem,
  Paginated,
  RestaurantCafeListParams,
  RestaurantDetail,
  RestaurantListItem,
  SlotStatusDTO,
  SubmitAppointmentInput,
  SubmitAppointmentResult,
} from "./types";

export interface TransportInit {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Already-serializable body; the transport JSON-encodes it. */
  body?: unknown;
  signal?: AbortSignal;
}

export type ApiTransport = <T>(path: string, init?: TransportInit) => Promise<T>;

function queryString(params: Record<string, string | number | undefined>): string {
  const pairs = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== "",
  );
  if (pairs.length === 0) return "";
  return (
    "?" +
    pairs
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&")
  );
}

export function createGoHargeisaApi(transport: ApiTransport) {
  return {
    health: (signal?: AbortSignal) =>
      transport<HealthResponse>("/health", { signal }),

    categories: {
      list: (signal?: AbortSignal) =>
        transport<CategoryDTO[]>("/categories", { signal }),
    },

    cityServices: {
      list: (params: CityServiceListParams = {}, signal?: AbortSignal) =>
        transport<Paginated<CityServiceListItem>>(
          `/city-services${queryString({
            category: params.category,
            q: params.q,
            page: params.page,
            pageSize: params.pageSize,
          })}`,
          { signal },
        ),

      get: (slug: string, signal?: AbortSignal) =>
        transport<CityServiceDetail>(
          `/city-services/${encodeURIComponent(slug)}`,
          { signal },
        ),
    },

    restaurants: {
      list: (params: RestaurantCafeListParams = {}, signal?: AbortSignal) =>
        transport<Paginated<RestaurantListItem>>(
          `/restaurants${queryString({
            q: params.q,
            page: params.page,
            pageSize: params.pageSize,
          })}`,
          { signal },
        ),

      get: (slug: string, signal?: AbortSignal) =>
        transport<RestaurantDetail>(`/restaurants/${encodeURIComponent(slug)}`, { signal }),
    },

    cafes: {
      list: (params: RestaurantCafeListParams = {}, signal?: AbortSignal) =>
        transport<Paginated<CafeListItem>>(
          `/cafes${queryString({
            q: params.q,
            page: params.page,
            pageSize: params.pageSize,
          })}`,
          { signal },
        ),

      get: (slug: string, signal?: AbortSignal) =>
        transport<CafeDetail>(`/cafes/${encodeURIComponent(slug)}`, { signal }),
    },

    hotels: {
      list: (params: RestaurantCafeListParams = {}, signal?: AbortSignal) =>
        transport<Paginated<HotelListItem>>(
          `/hotels${queryString({
            q: params.q,
            page: params.page,
            pageSize: params.pageSize,
          })}`,
          { signal },
        ),

      get: (slug: string, signal?: AbortSignal) =>
        transport<HotelDetail>(`/hotels/${encodeURIComponent(slug)}`, { signal }),
    },

    appointments: {
      slots: (doctorId: string, date: string, signal?: AbortSignal) =>
        transport<SlotStatusDTO[]>(
          `/appointment-slots${queryString({ doctorId, date })}`,
          { signal },
        ),

      submit: (input: SubmitAppointmentInput, signal?: AbortSignal) =>
        transport<SubmitAppointmentResult>("/appointments", {
          method: "POST",
          body: input,
          signal,
        }),
    },
  };
}

export type GoHargeisaApi = ReturnType<typeof createGoHargeisaApi>;
