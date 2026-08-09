"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Search, X } from "lucide-react";
import { searchUsersForLinking, type UserSearchResult } from "@/lib/actions/claims";

/** Inline searchable account picker — used for admin-initiated ownership
 * assignment/transfer wherever it's needed (claim resolution, business
 * ownership transfer, City Services "Assigned Owner"). Extracted from
 * components/admin/claims-list.tsx so all three share one implementation. */
export function UserPicker({
  onPick,
  onCancel,
}: {
  onPick: (userId: string, user: UserSearchResult) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  function onSearch(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchUsersForLinking(value)
      .then(setResults)
      .finally(() => setSearching(false));
  }

  return (
    <div className="mt-2 rounded-xl border border-ink/12 bg-ink/[0.02] p-3 dark:border-white/15 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2">
        <Search size={14} className="shrink-0 text-ink/40" />
        <input
          autoFocus
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("searchUserPlaceholder")}
          className="w-full bg-transparent text-sm outline-none"
        />
        <button type="button" onClick={onCancel} aria-label={t("extendCancel")} className="shrink-0 text-ink/40 hover:text-ink">
          <X size={14} />
        </button>
      </div>
      {searching && <Loader2 size={13} className="mt-2 animate-spin text-ink/40" />}
      {!searching && results.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onPick(u.id, u)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-start text-sm hover:bg-primary/10"
              >
                <span className="truncate">{u.fullName || u.email}</span>
                <span className="ms-2 shrink-0 text-xs text-ink/45">{u.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
