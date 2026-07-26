/**
 * Admin forms store website URLs as free text (e.g. "example.com" or
 * "www.example.com" without a protocol). Used as-is in an <a href>, a
 * protocol-less value is treated as a RELATIVE path by the browser —
 * "example.com" resolves to "https://gohargeisa.com/example.com" instead
 * of opening the actual external site. Prepending https:// when no
 * protocol is present fixes that for every consumer (Book Now, Visit
 * Website, ...) without touching how the value is stored.
 */
export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
