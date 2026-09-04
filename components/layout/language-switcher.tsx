"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, Check } from "lucide-react";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { FlagIcon } from "@/components/shared/flag-icon";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useAndroidBackHandler } from "@/lib/hooks/use-android-back-handler";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  useScrollLock(open);
  useAndroidBackHandler(open, () => setOpen(false));

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function switchTo(next: Locale) {
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || "/");
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("changeLanguage")}
        className="flex items-center gap-1.5 rounded-full border border-ink/10 dark:border-white/15 px-3 py-2 text-sm font-medium hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
      >
        <Globe size={16} />
        <FlagIcon locale={locale} size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-overlay bg-ink/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            className="absolute end-0 mt-2 w-44 overflow-hidden rounded-2xl border border-ink/10 dark:border-white/10 bg-white dark:bg-ink shadow-card z-overlay"
          >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => switchTo(l)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-ink transition-colors hover:bg-ink/5 dark:text-white dark:hover:bg-white/10"
              >
                <span className="flex items-center gap-3 font-medium text-ink dark:text-white">
                  <FlagIcon locale={l} size={16} />
                  {localeConfig[l].label}
                </span>

                {l === locale && (
                  <Check size={16} className="text-primary" />
                )}
              </button>
            </li>
          ))}
          </ul>
        </>
      )}
    </div>
  );
}