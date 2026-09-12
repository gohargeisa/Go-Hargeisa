"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OrderableListingType, Product, ProductGender } from "@/types";
import type { ProductSortKey } from "@/lib/data/products";

export interface ProductFilters {
  /** A single category value, or several (e.g. Flormar's UI groups span
   * multiple raw category values — see ProductsPageOptions). */
  category?: string | string[];
  gender?: ProductGender | "all";
  /** Substring brand search (a free-text search box). */
  brandQuery?: string;
  /** Exact brand match (a dropdown of real brand values) — distinct from
   * `brandQuery` above; see ProductsPageOptions' own doc comment for why a
   * dropdown needs exact match. Use `"all"` (or omit) for no filter. */
  brandExact?: string | "all";
  nameQuery?: string;
  sort?: ProductSortKey;
}

function buildQuery(
  listingId: string,
  listingType: OrderableListingType,
  limit: number,
  offset: number,
  filters: ProductFilters
): string {
  const qs = new URLSearchParams({ listingId, listingType, limit: String(limit), offset: String(offset) });
  if (filters.category) {
    const category = Array.isArray(filters.category) ? filters.category.join(",") : filters.category;
    if (category) qs.set("category", category);
  }
  if (filters.gender && filters.gender !== "all") qs.set("gender", filters.gender);
  if (filters.brandQuery) qs.set("brand", filters.brandQuery);
  if (filters.brandExact && filters.brandExact !== "all") qs.set("brandExact", filters.brandExact);
  if (filters.nameQuery) qs.set("q", filters.nameQuery);
  if (filters.sort) qs.set("sort", filters.sort);
  return qs.toString();
}

/**
 * Drives a storefront's product grid against /api/products (see
 * lib/data/products.ts's getProductsPageForListing) — real server-side
 * pagination and filtering, not "fetch everything once and slice/filter in
 * JS". The server component that renders the page already fetched page 1
 * with the DEFAULT filters (see `initialItems`/`initialTotal`); this hook
 * only talks to the network when the visitor actually changes a filter or
 * clicks "Load More", never on first mount.
 *
 * A monotonically increasing request id guards against a slow, stale
 * response (e.g. a fast double filter change, or a slow "Load More"
 * followed immediately by a filter change) overwriting the result of a
 * newer request — the classic race that would otherwise show wrong or
 * flickering results, never an infinite request loop (there is nothing
 * here that re-triggers itself; a request fires only from an explicit
 * filter-state change or an explicit loadMore() call).
 */
export function usePaginatedProducts({
  listingId,
  listingType,
  initialItems,
  initialTotal,
  pageSize = 48,
  filters,
}: {
  listingId: string;
  listingType: OrderableListingType;
  initialItems: Product[];
  initialTotal: number;
  pageSize?: number;
  filters: ProductFilters;
}) {
  const [items, setItems] = useState<Product[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const skipNextEffect = useRef(true);
  const filtersKey = JSON.stringify(filters ?? {});

  // Re-query page 1 of the new filter combination whenever a filter
  // actually changes — skipped on first mount since the server already
  // rendered page 1 for the initial (default) filters.
  useEffect(() => {
    if (skipNextEffect.current) {
      skipNextEffect.current = false;
      return;
    }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    fetch(`/api/products?${buildQuery(listingId, listingType, pageSize, 0, filters)}`)
      .then((r) => r.json())
      .then((data: { items?: Product[]; total?: number }) => {
        if (requestId !== requestIdRef.current) return;
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, listingId, listingType, pageSize]);

  const loadMore = useCallback(() => {
    if (loading) return;
    const offset = items.length;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    fetch(`/api/products?${buildQuery(listingId, listingType, pageSize, offset, filters)}`)
      .then((r) => r.json())
      .then((data: { items?: Product[] }) => {
        if (requestId !== requestIdRef.current) return;
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const fresh = (data.items ?? []).filter((p) => !seen.has(p.id));
          return [...prev, ...fresh];
        });
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, listingType, pageSize, items.length, filtersKey, loading]);

  return { items, total, hasMore: items.length < total, loading, loadMore };
}
