"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";

export function SearchWithin({
  basePath,
  placeholder,
  defaultValue,
}: {
  basePath: string;
  placeholder: string;
  defaultValue?: string;
}) {
  const t = useTranslations("listings");
  const [value, setValue] = useState(defaultValue ?? "");
  const router = useRouter();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(value ? `${basePath}?q=${encodeURIComponent(value)}` : basePath);
  }

  function clear() {
    setValue("");
    router.push(basePath);
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 max-w-lg">
      <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/12 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-2.5">
        <Search size={16} className="text-ink/40 dark:text-sand/40 shrink-0" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-sand/40"
        />
        {value && (
          <button type="button" onClick={clear} aria-label={t("clearSearchAriaLabel")} className="text-ink/40 hover:text-ink">
            <X size={14} />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
