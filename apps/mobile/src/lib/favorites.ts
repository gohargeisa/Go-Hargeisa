/**
 * Saved businesses.
 *
 * P1d: **on-device** only (AsyncStorage). The website has no city-services
 * favorites feature yet and the generated Supabase types don't include
 * `city_service` in `favorites.listing_type`, so a server-backed favorite
 * here would need a web-side migration + type regen (a separate approved
 * change). Until then this is a per-device bookmark list — real, persistent,
 * and good enough for a first beta. The hook API is written so switching to
 * a server-backed store later is a drop-in.
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "gohargeisa.saved.city_service";

type Listener = (ids: string[]) => void;
let cache: string[] | null = null;
const listeners = new Set<Listener>();

async function load(): Promise<string[]> {
  if (cache) return cache;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function persist(ids: string[]): Promise<void> {
  cache = ids;
  listeners.forEach((l) => l(ids));
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // best-effort — the in-memory cache still reflects the change this session
  }
}

function useSavedIds(): { ids: string[]; ready: boolean } {
  const [ids, setIds] = useState<string[]>(cache ?? []);
  const [ready, setReady] = useState(cache !== null);

  useEffect(() => {
    let active = true;
    load().then((initial) => {
      if (active) {
        setIds(initial);
        setReady(true);
      }
    });
    const listener: Listener = (next) => setIds([...next]);
    listeners.add(listener);
    return () => {
      active = false;
      listeners.delete(listener);
    };
  }, []);

  return { ids, ready };
}

/** Toggle + current state for one city-services listing. */
export function useFavorite(_listingType: "city_service", listingId: string) {
  const { ids, ready } = useSavedIds();
  const isFavorited = ids.includes(listingId);

  const toggle = useCallback(() => {
    const current = cache ?? ids;
    const next = current.includes(listingId)
      ? current.filter((id) => id !== listingId)
      : [listingId, ...current];
    void persist(next);
  }, [ids, listingId]);

  return { isFavorited, isReady: ready, toggle, isToggling: false };
}

export interface SavedRow {
  listing_id: string;
}

/** The device's saved city-services, most-recently-added first. */
export function useSavedCityServices() {
  const { ids, ready } = useSavedIds();
  return {
    data: ready ? ids.map((listing_id) => ({ listing_id })) : undefined,
    isPending: !ready,
    isError: false,
    refetch: () => {},
  };
}
