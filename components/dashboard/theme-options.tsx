"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Laptop, Moon, Sun } from "lucide-react";

/**
 * Light/Dark/System theme picker for the dashboard Settings page.
 *
 * NOT currently rendered anywhere — components/layout/theme-provider.tsx
 * sets forcedTheme="light" (Go Hargeisa's light-mode-only launch), which
 * makes next-themes' setTheme() a no-op, so this control couldn't actually
 * change anything right now. Kept as a standalone, working component
 * (rather than deleted) so dark mode can be re-enabled later just by
 * removing forcedTheme and re-adding <ThemeOptions /> to settings-panel.tsx
 * — every dark: class and the .dark CSS across the app already still work.
 */
export function ThemeOptions() {
  const t = useTranslations("dashboard");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // next-themes only knows the real theme after mount (it reads
  // localStorage/matchMedia client-side) — rendering its value before that
  // would mismatch the server-rendered markup.
  useEffect(() => setMounted(true), []);

  const options: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light", label: t("themeLight"), icon: Sun },
    { value: "dark", label: t("themeDark"), icon: Moon },
    { value: "system", label: t("themeSystem"), icon: Laptop },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={active}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              active ? "border-primary bg-primary/10 text-primary" : "border-ink/12 dark:border-white/15 hover:border-primary/40"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
