/**
 * Single source of truth for Somaliland Diaspora Week 2026's dates —
 * shared by the event page's hero countdown + Event JSON-LD, and by the
 * homepage banner's visibility gate, so all three can never drift out of
 * sync with each other. Hargeisa has no DST, hence the fixed +03:00 offset.
 */
export const DIASPORA_WEEK_START_ISO = "2026-08-02T09:00:00+03:00";
export const DIASPORA_WEEK_END_ISO = "2026-08-06T23:59:59+03:00";
