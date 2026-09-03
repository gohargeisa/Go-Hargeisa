/**
 * A Supabase auth-storage adapter backed by `expo-secure-store` (Android
 * Keystore / iOS Keychain).
 *
 * SecureStore values are capped at ~2 KB. A Supabase session (JWT + refresh
 * token + user) can exceed that, so values are transparently chunked across
 * `<key>.0`, `<key>.1`, … with a small manifest at `<key>`.
 *
 * On web (Expo web / tests) SecureStore is unavailable — fall back to an
 * in-memory map so the client still constructs.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHUNK_SIZE = 1800;
const memory = new Map<string, string>();
const canUseSecureStore =
  Platform.OS === "ios" || Platform.OS === "android";

async function rawGet(key: string): Promise<string | null> {
  if (!canUseSecureStore) return memory.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function rawSet(key: string, value: string): Promise<void> {
  if (!canUseSecureStore) {
    memory.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function rawDelete(key: string): Promise<void> {
  if (!canUseSecureStore) {
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    const head = await rawGet(key);
    if (head === null) return null;
    if (!head.startsWith("__chunks__:")) return head;

    const count = Number(head.slice("__chunks__:".length));
    if (!Number.isFinite(count) || count <= 0) return null;

    const parts: string[] = [];
    for (let i = 0; i < count; i += 1) {
      const part = await rawGet(`${key}.${i}`);
      if (part === null) return null; // corrupt — treat as no session
      parts.push(part);
    }
    return parts.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    // Clear any previous chunking for this key first.
    await secureStorage.removeItem(key);

    if (value.length <= CHUNK_SIZE) {
      await rawSet(key, value);
      return;
    }

    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) => rawSet(`${key}.${i}`, chunk)),
    );
    await rawSet(key, `__chunks__:${chunks.length}`);
  },

  async removeItem(key: string): Promise<void> {
    const head = await rawGet(key);
    if (head?.startsWith("__chunks__:")) {
      const count = Number(head.slice("__chunks__:".length));
      for (let i = 0; i < count; i += 1) {
        await rawDelete(`${key}.${i}`);
      }
    }
    await rawDelete(key);
  },
};
