/**
 * @gohargeisa/core — isomorphic pure logic shared by the Next.js website and
 * the React Native / Expo app.
 *
 * Everything here re-exports the web app's already-vetted pure `lib/utils/*`
 * modules (no `next/*`, no React, no Supabase, no Node built-ins) so there is
 * exactly ONE implementation of each rule. Add a module here only when a
 * native feature needs it AND the underlying util is genuinely portable.
 */
export * from "./whatsapp";
export * from "./geo";
export * from "./url";
export * from "./search";
export * from "./google-maps";
export * from "./opening-hours";
export * from "./pricing";
export * from "./product-i18n";
export * from "./post-login";
