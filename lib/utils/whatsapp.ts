/** wa.me deep links need digits only (no +, spaces, or punctuation). */
export function toWhatsAppHref(phone: string, message?: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}
