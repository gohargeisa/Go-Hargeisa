/**
 * Where a just-signed-in account should land, by role. Source: the web app's
 * `lib/utils/post-login-redirect.ts` (import-free).
 *
 * On the native app: customers → Home; `owner` / `business_owner` roles →
 * a "this is a staff account, manage it on the web dashboard" screen (the
 * Admin + Business dashboards stay web-only).
 */
export { defaultPostLoginPath } from "../../../lib/utils/post-login-redirect";
