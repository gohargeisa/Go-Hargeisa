"use client";

import { Search, X } from "lucide-react";

export function CitySearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex items-center rounded-full border border-ink/10 bg-white/95 px-4 py-3 shadow-[0_10px_30px_rgba(20,30,45,0.12)] backdrop-blur-xl dark:border-white/15 dark:bg-ink/85">
      <Search size={17} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
      <label htmlFor="city-map-search" className="sr-only">
        Search city services
      </label>
      <input
        id="city-map-search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search hospitals, mosques, ATMs…"
        className="ms-2.5 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink/40 dark:text-white dark:placeholder:text-sand/40"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="ms-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink dark:text-sand/40 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
