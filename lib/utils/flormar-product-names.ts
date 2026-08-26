import { FLORMAR_VERIFIED_NAMES } from "@/lib/config/flormar-verified-names";

/**
 * Cleans a raw Flormar catalog product name for customer-facing display,
 * scoped ONLY to Flormar (never applied to any other business's products —
 * see the single call site in components/flormar/flormar-storefront.tsx).
 * Never invents a name: every transform below is either (a) a real,
 * web-verified product name from FLORMAR_VERIFIED_NAMES, or (b) expanding a
 * specific internal-code token whose meaning that same verified research
 * already confirmed across multiple real product lines (see the comment on
 * each), or (c) a pure formatting fix (capitalization) that changes no
 * letters, only their case. Anything not covered by one of these is
 * returned completely unchanged — never guessed.
 *
 * The raw `name`/`sku` DB columns are never modified by this — it's a
 * display-time transform only, so search (which matches against the raw
 * name) and the underlying data stay exactly as imported.
 */

// Confirmed via docs/flormar-product-reconciliation.md's research (each
// appears, unambiguously, across 2+ independently-verified real product
// lines in FLORMAR_VERIFIED_NAMES — e.g. CBL appears in both "Blush-On"
// and "Blush" contexts, BBCR/BCR in "BB Cream", MAS in every *Mascara*
// line). "NP" and "NEW" never appear in any of the verified real names —
// they're the source spreadsheet's own inventory/packaging-revision flags,
// not part of the product's identity, so they're dropped rather than
// guessed at.
const TOKEN_MAP: Record<string, string> = {
  NP: "",
  NEW: "",
  MAS: "Mascara",
  FDT: "Foundation",
  CPW: "Compact Powder",
  BBCR: "BB Cream",
  BCR: "BB Cream",
  CBL: "Blush",
  BCNE: "Breathing Color Nail Enamel",
  MSTURZR: "Moisturizer",
  PCL: "Pencil",
  PLT: "Palette",
  BRS: "Brush",
  LCN: "Liquid Concealer",
  SLS: "Lipstick",
};

function alnum(word: string): string {
  return word.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

// The catalog's own titleCase() (scripts/import-flormar-catalog.mjs) only
// capitalizes after spaces, so hyphen-/ampersand-joined words stay
// lowercase after the joiner ("Blush-on", "K-spirit", "Wet&dry") — pure
// formatting, capitalizes after every word boundary including "-" and "&",
// never changes which letters exist.
function fixInternalCapitalization(word: string): string {
  return word.replace(/(^|[-&])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

export function cleanFlormarProductName(rawName: string, sku?: string | null): string {
  if (!rawName) return rawName;

  const base8 = (sku ?? "").split("-")[0]?.slice(0, 8) ?? "";
  if (sku && FLORMAR_VERIFIED_NAMES[sku]) return FLORMAR_VERIFIED_NAMES[sku];
  if (FLORMAR_VERIFIED_NAMES[base8]) return FLORMAR_VERIFIED_NAMES[base8];

  // "//"-doubled names are a raw-data anomaly in the source spreadsheet
  // itself (a handful of rows literally repeat their own name after "//") —
  // not something a per-token cleanup can safely untangle without risking
  // mangling it further, so those are left completely untouched.
  if (rawName.includes("//")) return rawName;

  const words = rawName.split(/\s+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const word of words) {
    const token = alnum(word);
    const expansion = token in TOKEN_MAP ? TOKEN_MAP[token] : fixInternalCapitalization(word);
    const expansionKey = alnum(expansion);
    // Drop a word that expands to nothing (NP/NEW), or whose expanded form
    // exactly repeats a real word already placed earlier in the name
    // (case-insensitive) — covers both "Pcl" appearing after a spelled-out
    // "Pencil", and the reverse order.
    if (!expansion) continue;
    if (expansionKey.length >= 3 && seen.has(expansionKey)) continue;
    out.push(expansion);
    if (expansionKey.length >= 3) seen.add(expansionKey);
  }
  const result = out.join(" ").replace(/\s+/g, " ").trim();
  return result || rawName;
}
