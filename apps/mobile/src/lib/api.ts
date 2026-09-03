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

  const {
    data: { session },
  } = await supabase.auth.getSession();

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
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("The request timed out.", 0);
    }
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
