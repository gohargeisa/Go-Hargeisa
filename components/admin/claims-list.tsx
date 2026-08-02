"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Loader2, Search, X } from "lucide-react";
import {
  approveBusinessClaim,
  rejectBusinessClaim,
  transferOwnership,
  searchUsersForLinking,
  type BusinessClaimRow,
  type OwnedListingRow,
  type UserSearchResult,
} from "@/lib/actions/claims";
import type { Locale } from "@/lib/i18n/config";
import type { BusinessListingType } from "@/types";

const STATUS_STYLE: Record<BusinessClaimRow["status"], string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Inline searchable account picker — used both when a claim has no
 * resolvable account and for admin-initiated ownership transfers. */
function UserPicker({ onPick, onCancel }: { onPick: (userId: string) => void; onCancel: () => void }) {
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
                onClick={() => onPick(u.id)}
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

export function ClaimsList({ locale, claims, ownedListings }: { locale: Locale; claims: BusinessClaimRow[]; ownedListings: OwnedListingRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<{ id: string; message: string } | null>(null);

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(id);
    setErrorFor(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setPickerFor(null);
        router.refresh();
      } else {
        setErrorFor({ id, message: result.error ?? t("somethingWentWrong") });
      }
      setPendingId(null);
    });
  }

  const pending = claims.filter((c) => c.status === "pending");
  const history = claims.filter((c) => c.status !== "pending");

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-display text-lg font-semibold">{t("pendingClaims")}</h2>
        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl2 border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
            {t("noClaimsYet")}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {pending.map((claim) => (
              <div key={claim.id} className="rounded-xl2 border border-ink/8 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{claim.businessName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{claim.listingType}</p>
                    <p className="mt-2 text-sm">{claim.fullName}</p>
                    <p className="text-sm text-ink/60 dark:text-sand/60">{claim.email}</p>
                    {claim.phone && <p className="text-sm text-ink/60 dark:text-sand/60">{claim.phone}</p>}
                    {claim.message && <p className="mt-1 text-sm italic text-ink/50 dark:text-sand/50">"{claim.message}"</p>}
                    <p className="mt-2 text-xs text-ink/45 dark:text-sand/45">{formatDate(claim.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={isPending && pendingId === claim.id}
                      onClick={() => run(claim.id, () => approveBusinessClaim(locale, claim.id))}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-60"
                    >
                      {isPending && pendingId === claim.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {t("approveAction")}
                    </button>
                    <button
                      type="button"
                      disabled={isPending && pendingId === claim.id}
                      onClick={() => run(claim.id, () => rejectBusinessClaim(locale, claim.id))}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-60 dark:border-white/20"
                    >
                      <X size={12} />
                      {t("rejectAction")}
                    </button>
                  </div>
                </div>
                {errorFor?.id === claim.id && (
                  <div className="mt-3">
                    <p className="text-sm text-red-600">{errorFor.message}</p>
                    <button type="button" onClick={() => setPickerFor(claim.id)} className="mt-1 text-sm font-semibold text-primary hover:underline">
                      {t("linkAccountLabel")}
                    </button>
                  </div>
                )}
                {pickerFor === claim.id && (
                  <UserPicker
                    onCancel={() => setPickerFor(null)}
                    onPick={(userId) => run(claim.id, () => approveBusinessClaim(locale, claim.id, userId))}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">{t("claimHistory")}</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50 dark:text-sand/50">{t("noClaimsYet")}</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/[0.03] dark:bg-white/5">
                <tr>
                  <th className="px-4 py-2.5 text-start font-semibold">{t("colName")}</th>
                  <th className="px-4 py-2.5 text-start font-semibold">{t("emailLabel")}</th>
                  <th className="px-4 py-2.5 text-start font-semibold">{t("colStatus")}</th>
                  <th className="px-4 py-2.5 text-start font-semibold">{t("dateMetaLabel")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 dark:divide-white/10">
                {history.map((claim) => (
                  <tr key={claim.id}>
                    <td className="px-4 py-2.5">{claim.businessName}</td>
                    <td className="px-4 py-2.5 text-ink/60 dark:text-sand/60">{claim.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[claim.status]}`}>
                        {claim.status === "approved" ? t("statusApproved") : t("statusRejected")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-ink/60 dark:text-sand/60">{claim.reviewedAt ? formatDate(claim.reviewedAt) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">{t("ownedBusinesses")}</h2>
        {ownedListings.length === 0 ? (
          <p className="mt-3 text-sm text-ink/50 dark:text-sand/50">{t("noClaimsYet")}</p>
        ) : (
          <div className="mt-3 space-y-3">
            {ownedListings.map((listing) => {
              const key = `${listing.listingType}:${listing.listingId}`;
              return (
                <div key={key} className="rounded-xl2 border border-ink/8 p-4 dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{listing.name}</p>
                      <p className="text-xs text-ink/50 dark:text-sand/50">{listing.listingType}</p>
                      <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{listing.ownerName || listing.ownerEmail}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerFor(pickerFor === key ? null : key)}
                      className="shrink-0 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
                    >
                      {t("transferOwnershipAction")}
                    </button>
                  </div>
                  {errorFor?.id === key && <p className="mt-2 text-sm text-red-600">{errorFor.message}</p>}
                  {pickerFor === key && (
                    <UserPicker
                      onCancel={() => setPickerFor(null)}
                      onPick={(userId) =>
                        run(key, () => transferOwnership(locale, listing.listingType as BusinessListingType, listing.listingId, userId))
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
