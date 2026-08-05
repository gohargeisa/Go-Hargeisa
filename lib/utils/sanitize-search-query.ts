/**
 * PostgREST's `.or()` filter syntax uses comma to separate conditions and
 * parentheses to denote nested grouping — a raw search query containing
 * either breaks the filter grammar and errors the query instead of
 * searching it (e.g. "cafe, wifi" or "(test)" would 500 rather than
 * return results). Stripped rather than escaped: simpler than relying on
 * PostgREST's exact quoting/backslash rules, and losing a literal comma or
 * parenthesis from a search phrase is a non-issue for this app's listing
 * names/descriptions.
 */
export function sanitizeSearchQuery(q: string): string {
  return q.replace(/[,()]/g, " ").replace(/\s+/g, " ").trim();
}
