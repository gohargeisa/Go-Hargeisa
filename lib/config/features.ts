/**
 * Temporary kill switch for the public-facing Services feature (Phase 2).
 * Every public surface that shows or links to Services — the nav, the
 * homepage section, the Explore Hargeisa cards, the /services routes, and
 * the Interactive Map — reads this one flag, so re-enabling the feature is
 * a single-line flip back to `true`. Nothing about the underlying data,
 * schema, or components changes: the business dashboard, admin tools, and
 * the `services` table are untouched and keep working normally.
 */
export const SERVICES_PUBLIC_ENABLED = false;
