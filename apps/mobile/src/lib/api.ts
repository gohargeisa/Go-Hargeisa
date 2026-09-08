/**
 * Thin client for the website's additive `/api/v1/*` read layer (built in
 * P1c). Every request:
 *   - is prefixed with `env.apiBaseUrl`
 *   - carries the current Supabase access token as a Bearer header when the
 *     user is signed in (the Route Handlers create an RLS-scoped server
 *     client from it — never service-role)
 *   - carries the active UI locale so the API can return localised fields
 *   - times out (mobile networks stall silently)
 *
 * The typed per-resource wrappers live in `@gohargeisa/api` (P1c) and call
 * `apiFetch` under the hood.
 */
import {
  createGoHargeisaApi,
  type ApiTransport,
  type TransportInit,
} from "@gohargeisa/api";

import { supabase } from "@/lib/supabase";
import { env } from "@/env";
import { getActiveLocale } from "@/i18n";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, ...rest } = init;
  const url = path.startsWith("http")
    ? path
    : `${env.apiBaseUrl}/api/v1${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Session lookup failing must not take down an otherwise-public read (most
  // /api/v1 GETs work anonymously) — and it must still be visible when it
  // does fail, instead of silently skipping the Authorization header with
  // no trace of why.
  let session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;
  try {
    session = (await supabase.auth.getSession()).data.session;
  } catch (err) {
    console.error(`[api] ${url} -> getSession() failed, continuing unauthenticated:`, err);
  }

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Accept-Language": getActiveLocale(),
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
        ...headers,
      },
    });

    const text = await res.text();
    const json = text ? safeParse(text) : null;

    if (!res.ok) {
      const message =
        (json && typeof json === "object" && "error" in json
          ? String((json as { error: unknown }).error)
          : null) ?? `Request failed (${res.status})`;
      throw new ApiError(message, res.status, json);
    }

    return json as T;
  } catch (err) {
    // Surfaced in the UI is just "couldn't load" — this is the only place
    // the actual cause (wrong host, timeout, DNS/connection refused, etc.)
    // is visible, so log it plainly to the Metro terminal every time.
    if (err instanceof ApiError) {
      console.error(`[api] ${url} ->`, err.status, err.message);
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      console.error(`[api] ${url} -> timed out after ${timeoutMs}ms`);
      throw new ApiError("The request timed out.", 0);
    }
    console.error(`[api] ${url} -> network error:`, err);
    throw new ApiError(
      err instanceof Error ? err.message : "Network error",
      0,
    );
  } finally {
    clearTimeout(timer);
  }
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Adapts `apiFetch` to the `@gohargeisa/api` transport contract (JSON-encodes
 *  the body, threads the abort signal). */
const transport: ApiTransport = <T>(path: string, init?: TransportInit) =>
  apiFetch<T>(path, {
    method: init?.method,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
    headers:
      init?.body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
  });

/** The typed `/api/v1` client — `api.categories.list()`, `api.cityServices.get(slug)`, … */
export const api = createGoHargeisaApi(transport);
