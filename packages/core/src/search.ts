/**
 * Strips PostgREST `.or()`-breaking characters (`,` `(` `)`) from a raw
 * search query. Source: the web app's `lib/utils/sanitize-search-query.ts`
 * (import-free). The native search screen sends its query through the
 * `/api/v1/search` endpoint, which applies the same rule server-side; this
 * is the client-side mirror.
 */
export { sanitizeSearchQuery } from "../../../lib/utils/sanitize-search-query";
