/**
 * Opening-hours status ("Open now" / "Closes at …" / "Opens at …") + time
 * formatting. Source: the web app's `lib/utils/opening-hours.ts` (pure
 * logic; type-only import of `OpeningHoursGroup`).
 *
 * `getVisitorNow()` reads the device clock/timezone — identical behaviour on
 * web and native. Used by every listing/detail screen's status pill.
 */
export {
  formatDayRange,
  formatTime12h,
  getHargeisaNow,
  getVisitorNow,
  isOpenNow,
  getOpenStatus,
} from "../../../lib/utils/opening-hours";
