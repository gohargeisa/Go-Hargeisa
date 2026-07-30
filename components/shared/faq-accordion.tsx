"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Generic FAQ accordion — same interaction/visual pattern as
 * components/join/join-faq.tsx (single-open, rotating chevron, grid-rows
 * transition) but takes pre-translated {q, a} pairs so any server component
 * can resolve its own translation namespace and pass plain strings in.
 */
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-2xl border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="font-semibold">{item.q}</span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-ink/40 transition-transform duration-300 ease-premium dark:text-sand/40 ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            <div className="grid transition-all duration-300 ease-premium" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
