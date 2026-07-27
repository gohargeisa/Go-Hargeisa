"use client";

import { useEffect, useState } from "react";

export interface HotelNavTab {
  id: string;
  label: string;
}

/**
 * Sticky section-jump tabs below the hero gallery. Sits right under the
 * site's fixed header (h-20 = 5rem) once scrolled. Smooth scrolling comes
 * for free from the global `scroll-behavior: smooth` in globals.css (and is
 * disabled there under prefers-reduced-motion) — this component only tracks
 * which section is currently in view via a single IntersectionObserver, so
 * re-renders happen only when the active tab actually changes, not on every
 * scroll pixel.
 */
export function HotelNavTabs({ tabs }: { tabs: HotelNavTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);

  useEffect(() => {
    const elements = tabs
      .map((tab) => document.getElementById(tab.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [tabs]);

  if (tabs.length === 0) return null;

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-20 z-30 border-y border-ink/8 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-ink/90"
    >
      <div className="container-px mx-auto flex gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={`relative shrink-0 whitespace-nowrap px-4 py-3.5 text-sm font-semibold transition-colors ${
              activeId === tab.id
                ? "text-primary"
                : "text-ink/55 hover:text-ink dark:text-sand/55 dark:hover:text-white"
            }`}
          >
            {tab.label}
            {activeId === tab.id && (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />
            )}
          </a>
        ))}
      </div>
    </nav>
  );
}
