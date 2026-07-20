import type { ReactNode } from "react";
import "./globals.css";

// This root layout is intentionally minimal. All real markup, fonts,
// <html lang>/<dir>, and providers live in app/[locale]/layout.tsx so that
// language + text direction are correct on first paint.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
