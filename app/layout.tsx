import type { ReactNode } from "react";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// tailwind.config.ts's fontFamily.display/body reference --font-display/
// --font-body, but nothing ever defined those CSS variables, so every
// `font-display`/`font-body` class in the app was silently falling back to
// the browser's generic serif/sans-serif the whole time. next/font
// self-hosts these (no extra runtime request to Google, no layout shift)
// and exposes them as CSS variables here so the fallback is never used.
const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const fontBody = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>{children}</body>
    </html>
  );
}
