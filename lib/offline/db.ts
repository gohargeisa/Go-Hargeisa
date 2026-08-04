import { FAVORITES_STORE, OFFLINE_DB_NAME, OFFLINE_DB_VERSION, RECENTLY_VIEWED_STORE } from "@/lib/offline/constants";

/**
 * Minimal hand-rolled IndexedDB promise wrapper — this feature only needs
 * basic put/getAll/delete/clear over two small object stores, well short of
 * justifying a new dependency (no idb/dexie/localforage exists in this repo
 * today). Every export resolves to a safe empty/no-op value on failure
 * (private browsing, quota errors, unsupported environments) rather than
 * throwing, matching the best-effort posture of lib/mobile/recent-searches.ts.
 */

let dbPromise: Promise<IDBDatabase> | null = null;

function openOfflineDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }

    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        db.createObjectStore(FAVORITES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(RECENTLY_VIEWED_STORE)) {
        const store = db.createObjectStore(RECENTLY_VIEWED_STORE, { keyPath: "path" });
        store.createIndex("by_visitedAt", "visitedAt");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openOfflineDb();
    return await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function idbPut<T>(storeName: string, value: T): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best-effort — losing an offline-cache write is not worth surfacing an error for.
  }
}

export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best-effort.
  }
}

export async function idbClear(storeName: string): Promise<void> {
  try {
    const db = await openOfflineDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Best-effort.
  }
}
