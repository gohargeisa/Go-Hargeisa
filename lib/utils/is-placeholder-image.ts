/**
 * True for the placehold.co generated images used across the app whenever a
 * listing was seeded/created without a real uploaded photo (see the many
 * `placehold.co/...&text=` cover images across admin-seeded businesses).
 * Lets the hero gallery show a tasteful branded placeholder instead of a
 * giant literal "text on a color block" image — a real, reusable signal,
 * not a one-off check for any specific business.
 */
export function isPlaceholderImage(url: string | null | undefined): boolean {
  return !!url && url.includes("placehold.co");
}
