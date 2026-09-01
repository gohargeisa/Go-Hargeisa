import QRCode from "qrcode";

/**
 * Server-side QR generation for the digital loyalty card. Returns an inline
 * SVG string (no external request, no client JS, crisp at any size). Kept in
 * its own module so `qrcode` — a Node/CJS library — is only ever pulled into
 * server components / server actions, never a client bundle.
 *
 * Black-on-white with a quiet zone: the most reliable combination for a phone
 * screen scanned by another phone under shop lighting. The card component
 * frames it on white; we deliberately do NOT tint the modules a brand colour,
 * which lowers contrast and scan rate.
 */
export async function generateLoyaltyQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 2,
    color: { dark: "#0B0B0B", light: "#FFFFFF" },
  });
}
