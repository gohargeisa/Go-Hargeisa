"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { locales, localeConfig, type Locale } from "@/lib/i18n/config";
import { FlagIcon } from "@/components/shared/flag-icon";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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
        className="flex items-center gap-1.5 rounded-full border border-ink/10 dark:border-white/15 px-3 py-2 text-sm font-medium hover:bg-ink/5 dark:hover:bg-white/10 transition-colors"
      >
        <Globe size={16} />
        <FlagIcon locale={locale} size={16} />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute end-0 mt-2 w-40 overflow-hidden rounded-xl2 border border-ink/10 dark:border-white/10 bg-white dark:bg-ink shadow-card z-50"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => switchTo(l)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-ink/5 dark:hover:bg-white/10"
              >
                <span className="flex items-center gap-2">
                  <FlagIcon locale={l} size={16} />
                  {localeConfig[l].label}
                </span>
                {l === locale && <Check size={14} className="text-primary" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
