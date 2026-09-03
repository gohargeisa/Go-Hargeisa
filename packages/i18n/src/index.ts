/**
 * @gohargeisa/i18n — shared localisation surface for web + native mobile.
 *
 * Locale list, per-locale metadata (writing direction, label, flag asset),
 * and `isLocale`. Single source of truth: the web app's `lib/i18n/config.ts`
 * (import-free). Only `ar` is RTL; `so` (Somali) is LTR Latin script.
 *
 * The Somaliland flag is referenced by asset path — it must never be
 * substituted with Somalia's flag (same rule as the web).
 */
export {
  locales,
  defaultLocale,
  localeConfig,
  isLocale,
  type Locale,
} from "../../../lib/i18n/config";

export { messageResources, type MessageResources } from "./resources";
