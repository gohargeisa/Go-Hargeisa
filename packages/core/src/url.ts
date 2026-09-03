/**
 * Free-text website URL normaliser (prepends `https://` when no protocol is
 * present). Source: the web app's `lib/utils/normalize-url.ts` (import-free).
 * The native app uses it before handing a partner's "Visit Website" value to
 * the OS.
 */
export { normalizeExternalUrl } from "../../../lib/utils/normalize-url";
