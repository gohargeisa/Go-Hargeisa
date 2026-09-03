/**
 * WhatsApp deep-link builder. Single source of truth: the web app's
 * `lib/utils/whatsapp.ts` (import-free, fully portable). Re-exported so the
 * native app builds the exact same `wa.me/<digits>?text=` links the website
 * does.
 */
export { toWhatsAppHref } from "../../../lib/utils/whatsapp";
