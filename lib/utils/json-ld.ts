/**
 * `JSON.stringify` does not escape `<` — if any embedded value (a hotel
 * name, a review comment relayed into structured data, etc.) ever contains
 * the literal sequence `</script`, it closes the script tag early and lets
 * arbitrary HTML/script run. Escaping `<` as its unicode form is the
 * standard fix: `<` parses back to an identical JSON value (so this
 * never changes what search engines see) but can never be read by the
 * browser's HTML parser as a tag boundary. Use this instead of a bare
 * `JSON.stringify(...)` everywhere a `<script type="application/ld+json">`
 * is built from data that isn't a fixed, hardcoded literal.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
