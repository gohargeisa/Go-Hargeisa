const STORAGE_KEY = "gohargeisa.recentSearches";
const MAX_ITEMS = 6;

/**
 * Recent search queries for the search takeover's empty state. Uses
 * @capacitor/preferences (already installed, used elsewhere for push-token
 * bookkeeping) inside the native app, and falls back to localStorage on
 * plain mobile/desktop web — both are synchronous-feeling, small, per-device
 * stores, so one small module covers both without the caller needing to
 * know which environment it's in.
 */
async function isNative(): Promise<boolean> {
  const { Capacitor } = await import("@capacitor/core");
  return Capacitor.isNativePlatform();
}

export async function getRecentSearches(): Promise<string[]> {
  try {
    if (await isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      return value ? (JSON.parse(value) as string[]) : [];
    }
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (!trimmed) return;

  try {
    const current = await getRecentSearches();
    const next = [trimmed, ...current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ITEMS);
    const serialized = JSON.stringify(next);

    if (await isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: STORAGE_KEY, value: serialized });
      return;
    }
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Best-effort only — losing recent-search history is not worth surfacing an error for.
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    if (await isNative()) {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: STORAGE_KEY });
      return;
    }
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}
