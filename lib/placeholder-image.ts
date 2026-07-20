/**
 * Generates a clearly-labeled placeholder image (via placehold.co) using
 * the Go Hargeisa brand palette, so every image in the app visibly reads
 * as "replace me" rather than looking like real (but wrong) stock photos
 * of some other city.
 *
 * Swap these out listing-by-listing once you have real photography — every
 * call site is a single `coverImage` / `image` string, so there's nothing
 * else to change.
 */
const PALETTE = {
  primary: "0B5ED7",
  secondary: "009688",
  accent: "F4B400",
  ink: "0F1720",
} as const;

export function placeholderImage(
  label: string,
  options?: { width?: number; height?: number; tone?: keyof typeof PALETTE }
): string {
  const { width = 1200, height = 800, tone = "primary" } = options ?? {};
  const bg = PALETTE[tone];
  const text = encodeURIComponent(label);
  return `https://placehold.co/${width}x${height}/${bg}/FFFFFF/png?text=${text}&font=roboto`;
}
