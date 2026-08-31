/**
 * Approximates a visual swatch color for a Flormar shade name, scoped ONLY
 * to Flormar (never applied to any other partner's variants — see the
 * single call site in components/flormar/flormar-storefront.tsx).
 *
 * None of the real catalog's 1053 product_variant rows have `hex_color`
 * set — only a numeric `shade_code` ("001", "060"…) and a `shade_name`
 * ("Navy Blue", "Auburn", "Glitzy Brown"…), confirmed by direct database
 * query. The brief is explicit that customers must never see the raw
 * numeric code, and that a swatch should "represent the actual shade as
 * accurately as possible" — with no verified hex value on file, the honest
 * middle ground is: match common, unambiguous color words that actually
 * appear in the (cleaned) shade name against their standard, widely
 * understood meaning (the same understanding any shopper already has of
 * "navy" or "auburn"), not an invented brand-exact swatch. A name with no
 * recognizable color word (e.g. "Digital Horizon", "Cyberspace") returns
 * null rather than guessing — the caller falls back to a clean text label
 * in that case, never a number.
 *
 * Multi-word phrases are checked before their component words so "Navy
 * Blue" resolves to navy rather than generic blue, and so on.
 */
const SHADE_COLOR_MAP: [pattern: RegExp, hex: string][] = [
  [/\brose\s*gold\b/i, "#B76E79"],
  [/\bnavy(\s*blue)?\b/i, "#22273A"],
  [/\bpink\s*diamond\b/i, "#F2B8CC"],
  [/\bsoft\s*cloud\b/i, "#D6D6D2"],
  [/\bhot\s*sun\b/i, "#F2A93B"],
  [/\bblack\b/i, "#231F20"],
  [/\bwhite\b/i, "#F3F1EC"],
  [/\bauburn\b/i, "#922B21"],
  [/\bbrown\b|\bbrwn\b/i, "#6F4E37"],
  [/\bbeige\b/i, "#E4CBA5"],
  [/\btan\b/i, "#D2A679"],
  [/\bnude\b/i, "#E3BC9A"],
  [/\bcoral\b/i, "#FF7F6B"],
  [/\bpeach\b/i, "#FFC6A0"],
  [/\bplums?\b/i, "#7B3F61"],
  [/\bberry\b/i, "#8E2653"],
  [/\bburgundy\b/i, "#6D2130"],
  [/\bwine\b/i, "#722F37"],
  [/\bpink\b/i, "#F0A0C0"],
  [/\brose\b/i, "#B76E79"],
  [/\bred\b/i, "#C0392B"],
  [/\bpurple\b/i, "#7D3C98"],
  [/\bgold\b/i, "#C9A227"],
  [/\bsilver\b/i, "#C4C4C4"],
  [/\bbronze\b/i, "#8C5E2A"],
  [/\bcopper\b/i, "#B87333"],
  [/\bgr[ae]y\b/i, "#8F8F87"],
  [/\bashy?\b/i, "#A9A79A"],
  [/\bcream\b/i, "#F1E9D2"],
  [/\bivory\b/i, "#F8F0DD"],
  [/\bchampagne\b/i, "#F0DFC8"],
  [/\btaupe\b/i, "#8B7D6B"],
  [/\bmocha\b/i, "#6F4E37"],
  [/\bcinnamon\b/i, "#7B3F00"],
  [/\bhoney\b/i, "#C68E17"],
  [/\bamber\b/i, "#B45F04"],
  [/\borange\b/i, "#E67E22"],
  [/\byellow\b/i, "#F1C40F"],
  [/\bgreen\b/i, "#4C8C4A"],
  [/\bblue\b/i, "#3B6FA0"],
  [/\bnatural\b/i, "#C9A87C"],
];

export function resolveFlormarSwatchColor(shadeName: string | null | undefined): string | null {
  if (!shadeName) return null;
  for (const [pattern, hex] of SHADE_COLOR_MAP) {
    if (pattern.test(shadeName)) return hex;
  }
  return null;
}
