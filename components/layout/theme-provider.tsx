"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // forcedTheme locks every page to light, ignoring stored preference and
  // OS color-scheme, and makes setTheme() a no-op — so even if some code
  // path still called it, nothing could switch the app into dark mode.
  // Dark mode itself is untouched: every dark: class and the .dark CSS
  // still exist and render correctly the moment forcedTheme is removed.
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      {children}
    </NextThemesProvider>
  );
}
