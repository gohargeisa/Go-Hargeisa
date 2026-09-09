/** Turns a camelCase photo config key (e.g. "chickenGordonBleu") into plain
 * alt text ("Chicken gordon bleu") — see excellence-cafe-photos.ts. */
export function humanizePhotoKey(key: string): string {
  const spaced = key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  const lower = spaced.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
