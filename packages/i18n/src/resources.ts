/**
 * The en / ar / so message catalogues, imported verbatim from the web app's
 * `messages/*.json` — the SAME 74 namespaces / ~3,956 strings the website
 * ships. No re-translation, no divergence.
 *
 * The web app loads these through `next-intl`; the native app feeds
 * `messageResources` into `i18next` (see apps/mobile/src/i18n). Both read the
 * identical files, so a string only ever needs editing in one place.
 *
 * Static import (bundled) rather than lazy — enables the native app to show
 * translated UI with no network, and i18next wants the resource tree upfront.
 */
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import so from "../../../messages/so.json";

export const messageResources = { en, ar, so } as const;

export type MessageResources = typeof messageResources;

/** The shape of one locale's message tree (keyed off English). */
export type Messages = typeof en;
