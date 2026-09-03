/**
 * Shared type surface for web + native mobile.
 *
 * Single source of truth: the web app's `types/` directory. Re-exported here
 * (relative path, not the `@/` alias, so the web `tsc` resolves it with no
 * extra config) so the native app and the `/api/v1` layer can
 * `import type { Hotel, CityService, Product, Database } from "@gohargeisa/types"`.
 *
 * No runtime code — types only.
 */
export * from "../../../types/index";
export type { Database, Json } from "../../../types/database";
