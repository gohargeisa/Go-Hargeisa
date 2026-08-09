"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { UserPicker } from "@/components/admin/owner-picker";
import { Field } from "@/components/admin/form-shared";
import { transferOwnership, removeOwnership, type UserSearchResult } from "@/lib/actions/claims";
import type { Locale } from "@/lib/i18n/config";
import type { OwnableListingType } from "@/types";

export interface AssignedOwner {
  id: string;
  name: string | null;
  email: string;
}

/**
 * Admin-only "Assigned Owner" control for a listing's create/edit form.
 * Edit mode persists immediately via transferOwnership/removeOwnership
 * (same actions the /admin/claims "Owned Businesses" section uses) — it
 * does NOT go through the surrounding form's own Save button, since
 * ownership is a separate authorization decision from editing the
 * listing's content. Create mode has no listingId yet, so it just stages
 * the pick in `value`/`onChange` for the parent form to include in its own
 * create payload. Only ever rendered for role='owner' — a business_owner
 * never sees this field at all, so they have no way to reassign
 * themselves or anyone else.
 */
export function AssignedOwnerField({
  locale,
  mode,
  listingType,
  listingId,
  value,
  onChange,
}: {
  locale: Locale;
  mode: "create" | "edit";
  listingType: OwnableListingType;
  listingId?: string;
  value: AssignedOwner | null;
  onChange: (owner: AssignedOwner | null) => void;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePick(userId: string, user: UserSearchResult) {
    setShowPicker(false);
    setError(null);
    const picked: AssignedOwner = { id: user.id, name: user.fullName, email: user.email };

    if (mode === "create") {
      onChange(picked);
      return;
    }
    startTransition(async () => {
      const result = await transferOwnership(locale, listingType, listingId!, userId);
      if (result.ok) {
        onChange(picked);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function handleRemove() {
    setError(null);
    if (mode === "create") {
      onChange(null);
      return;
    }
    startTransition(async () => {
      const result = await removeOwnership(locale, listingType, listingId!);
      if (result.ok) {
        onChange(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <Field label={t("assignedOwnerLabel")} hint={t("assignedOwnerHint")}>
      {value ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-ink/12 p-3 dark:border-white/15">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{value.name || value.email}</p>
            {value.name && <p className="truncate text-xs text-ink/50 dark:text-sand/50">{value.email}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setShowPicker((s) => !s)}
              disabled={isPending}
              className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/20"
            >
              {t("changeOwnerAction")}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-60 dark:border-white/20"
            >
              {t("removeOwnerAction")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-dashed border-ink/15 p-3 dark:border-white/15">
          <p className="text-sm text-ink/50 dark:text-sand/50">{t("noOwnerAssignedLabel")}</p>
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            disabled={isPending}
            className="rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
          >
            {t("assignOwnerAction")}
          </button>
        </div>
      )}
      {isPending && <Loader2 size={14} className="mt-2 animate-spin text-ink/40" />}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {showPicker && <UserPicker onCancel={() => setShowPicker(false)} onPick={handlePick} />}
    </Field>
  );
}
