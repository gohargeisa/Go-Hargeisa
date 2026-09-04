/**
 * Android hardware Back button controller — native shell only.
 *
 * The Capacitor `App` plugin fires a `backButton` event ONLY on Android
 * (iOS has no hardware back button; on the web this module is inert). We
 * want that press to behave the way a native Android app does:
 *
 *   1. If any overlay is open (modal / sheet / drawer / dialog / menu /
 *      dropdown), close the *topmost* one and consume the press.
 *   2. Otherwise, if the WebView has history, go back one entry (which
 *      Next.js's router picks up via `popstate`).
 *   3. Otherwise, exit the app — the normal Android behaviour at a root
 *      screen.
 *
 * Exactly ONE `backButton` listener is ever installed (session-lifetime,
 * bounded — not a leak). Overlays register a close-handler through
 * `pushAndroidBackHandler()` (usually via the `useAndroidBackHandler`
 * hook) and get an unregister function back; the stack is LIFO so the
 * last-opened overlay is closed first, and nested overlays unwind in order.
 *
 * Web / iOS: `initAndroidBackButton()` is a no-op and `pushAndroidBackHandler()`
 * returns a no-op unregister, so importing this from a shared component
 * costs nothing off-Android. The `@capacitor/*` packages are dynamically
 * imported so they never enter the browser bundle's initial load.
 */

type BackHandler = () => void;

interface StackEntry {
  id: number;
  fn: BackHandler;
}

const stack: StackEntry[] = [];
let nextId = 1;

/** null until the first successful native install; set so repeat calls are cheap. */
let installed = false;
let installing: Promise<void> | null = null;

/**
 * Register an overlay's close-handler. Returns an unregister function —
 * call it when the overlay closes or unmounts. LIFO: the most recently
 * pushed handler runs first on the next Back press.
 */
export function pushAndroidBackHandler(fn: BackHandler): () => void {
  const entry: StackEntry = { id: nextId++, fn };
  stack.push(entry);
  return () => {
    const i = stack.findIndex((e) => e.id === entry.id);
    if (i !== -1) stack.splice(i, 1);
  };
}

async function install(): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  const { App } = await import("@capacitor/app");
  await App.addListener("backButton", ({ canGoBack }) => {
    // 1 — an overlay is open: close the topmost, consume the press.
    if (stack.length > 0) {
      const top = stack[stack.length - 1];
      try {
        top.fn();
      } catch {
        // A handler throwing must never crash the app on a Back press —
        // drop it from the stack so a repeat press can fall through.
        const i = stack.indexOf(top);
        if (i !== -1) stack.splice(i, 1);
      }
      return;
    }
    // 2 — in-app history to go back to.
    if (canGoBack) {
      window.history.back();
      return;
    }
    // 3 — at a root screen: exit like a normal Android app.
    void App.exitApp();
  });

  installed = true;
}

/**
 * Install the single native Back-button listener. Idempotent and safe to
 * call from a `useEffect` that runs twice under React Strict Mode — the
 * in-flight promise is shared so only one listener is ever added. No-op on
 * web and iOS. Fire-and-forget: the listener lives for the app session.
 */
export function initAndroidBackButton(): void {
  if (installed || installing) return;
  installing = install()
    .catch(() => {
      // Swallow — a failed install just means the app keeps Android's
      // default Back behaviour, which is safe (no navigation regression).
    })
    .finally(() => {
      installing = null;
    });
}
