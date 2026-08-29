"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import {
  createAddonGroup,
  updateAddonGroup,
  deleteAddonGroup,
  createGroupAddon,
  updateGroupAddon,
  deleteGroupAddon,
  setGroupAssignedToProduct,
  type AddonGroupInput,
  type ProductAddonInput,
} from "@/lib/actions/product-addons";
import { inputClass } from "@/components/admin/form-shared";
import type { ProductAddon } from "@/types";
import type { ProductListingType } from "@/lib/actions/products";

export interface AddonGroupManagerRow {
  id: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  sortOrder: number;
  addons: ProductAddon[];
  /** Product ids this group is currently assigned to. */
  assignedProductIds: string[];
}

type T = ReturnType<typeof useTranslations>;

const BLANK_GROUP: AddonGroupInput = { name: "", nameAr: "", nameSo: "", sortOrder: 0 };
const BLANK_ADDON: ProductAddonInput = { name: "", nameAr: "", nameSo: "", price: 0, isTaxable: true, isActive: true, sortOrder: 0 };

/**
 * Listing-wide add-on groups (e.g. "Side Dishes") — a reusable set of
 * add-ons an owner can assign to any number of their own products at once,
 * instead of re-creating the same add-ons per product. Sits above
 * ProductsManager on the same page (listing-scoped, not per-product); a
 * single, ungrouped add-on tied to one product only is still supported by
 * the underlying product_addons table (createProductAddon) but has no
 * dedicated UI here yet — every current real use case (Village's Side
 * Dishes) is a shared group. See supabase/migrations/
 * 20260907000017_addon_groups_and_village_side_dishes.sql.
 */
export function AddonGroupsManager({
  listingType,
  listingId,
  initialGroups,
  products,
  revalidatePaths,
  t,
}: {
  listingType: ProductListingType;
  listingId: string;
  initialGroups: AddonGroupManagerRow[];
  /** Every product on this listing, for the per-group assignment checklist. */
  products: { id: string; name: string }[];
  revalidatePaths: string[];
  t: T;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | "new" | null>(null);
  const [groupDraft, setGroupDraft] = useState<AddonGroupInput>(BLANK_GROUP);
  const [editingAddon, setEditingAddon] = useState<{ groupId: string; addonId: string | "new" } | null>(null);
  const [addonDraft, setAddonDraft] = useState<ProductAddonInput>(BLANK_ADDON);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEditGroup(group?: AddonGroupManagerRow) {
    setError(null);
    if (group) {
      setEditingGroupId(group.id);
      setGroupDraft({ name: group.name, nameAr: group.nameAr ?? "", nameSo: group.nameSo ?? "", sortOrder: group.sortOrder });
    } else {
      setEditingGroupId("new");
      setGroupDraft({ ...BLANK_GROUP, sortOrder: groups.length });
    }
  }

  function saveGroup() {
    if (!groupDraft.name.trim()) {
      setError(t("addonGroupNameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingGroupId && editingGroupId !== "new"
          ? await updateAddonGroup(editingGroupId, listingType, listingId, groupDraft, revalidatePaths)
          : await createAddonGroup(listingType, listingId, groupDraft, revalidatePaths);
      if (result.ok) {
        setEditingGroupId(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function removeGroup(groupId: string, name: string) {
    if (!confirm(t("confirmDeleteAddonGroup", { name }))) return;
    startTransition(async () => {
      const result = await deleteAddonGroup(groupId, listingType, listingId, revalidatePaths);
      if (result.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        router.refresh();
      } else {
        alert(result.error ?? t("deleteFailed"));
      }
    });
  }

  function startEditAddon(groupId: string, addon?: ProductAddon) {
    setError(null);
    if (addon) {
      setEditingAddon({ groupId, addonId: addon.id });
      setAddonDraft({
        name: addon.name,
        nameAr: addon.nameAr ?? "",
        nameSo: addon.nameSo ?? "",
        price: addon.price,
        isTaxable: addon.isTaxable ?? true,
        isActive: true,
        sortOrder: 0,
      });
    } else {
      const group = groups.find((g) => g.id === groupId);
      setEditingAddon({ groupId, addonId: "new" });
      setAddonDraft({ ...BLANK_ADDON, sortOrder: group?.addons.length ?? 0 });
    }
  }

  function saveAddon() {
    if (!editingAddon) return;
    if (!addonDraft.name.trim()) {
      setError(t("addonNameRequired"));
      return;
    }
    setError(null);
    const { groupId, addonId } = editingAddon;
    startTransition(async () => {
      const result =
        addonId !== "new"
          ? await updateGroupAddon(addonId, listingType, listingId, addonDraft, revalidatePaths)
          : await createGroupAddon(groupId, listingType, listingId, addonDraft, revalidatePaths);
      if (result.ok) {
        setEditingAddon(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function removeAddon(addonId: string, name: string) {
    if (!confirm(t("confirmDeleteAddon", { name }))) return;
    startTransition(async () => {
      const result = await deleteGroupAddon(addonId, listingType, listingId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("deleteFailed"));
    });
  }

  function toggleAssignment(groupId: string, productId: string, currentlyAssigned: boolean) {
    startTransition(async () => {
      const result = await setGroupAssignedToProduct(productId, groupId, !currentlyAssigned, revalidatePaths);
      if (result.ok) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id !== groupId
              ? g
              : {
                  ...g,
                  assignedProductIds: currentlyAssigned
                    ? g.assignedProductIds.filter((id) => id !== productId)
                    : [...g.assignedProductIds, productId],
                }
          )
        );
        router.refresh();
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-ink/10 p-4 dark:border-white/15">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-base font-bold">{t("addonGroupsLabel")}</h2>
          <p className="mt-0.5 text-xs text-ink/50 dark:text-sand/50">{t("addonGroupsHint")}</p>
        </div>
        {editingGroupId === null && (
          <button
            type="button"
            onClick={() => startEditGroup()}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={11} /> {t("addAddonGroup")}
          </button>
        )}
      </div>

      {groups.length === 0 && editingGroupId === null && <p className="text-xs text-ink/40 dark:text-sand/40">{t("noAddonGroupsYet")}</p>}

      {editingGroupId === "new" && (
        <GroupForm draft={groupDraft} setDraft={setGroupDraft} onSave={saveGroup} onCancel={() => setEditingGroupId(null)} isPending={isPending} error={error} t={t} />
      )}

      {groups.map((group) =>
        editingGroupId === group.id ? (
          <GroupForm
            key={group.id}
            draft={groupDraft}
            setDraft={setGroupDraft}
            onSave={saveGroup}
            onCancel={() => setEditingGroupId(null)}
            isPending={isPending}
            error={error}
            t={t}
          />
        ) : (
          <div key={group.id} className="rounded-lg border border-ink/10 dark:border-white/15">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={() => setExpandedId((prev) => (prev === group.id ? null : group.id))}
                className="flex flex-1 items-center gap-1.5 text-start text-sm font-semibold"
              >
                {expandedId === group.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                {group.name}
                <span className="font-normal text-ink/40 dark:text-sand/40">
                  ({t("addonCount", { count: group.addons.length })})
                </span>
              </button>
              <button
                type="button"
                onClick={() => startEditGroup(group)}
                aria-label={`${t("edit")} ${group.name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
              >
                <Pencil size={11} />
              </button>
              <button
                type="button"
                onClick={() => removeGroup(group.id, group.name)}
                disabled={isPending}
                aria-label={`${t("delete")} ${group.name}`}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <Trash2 size={11} />
              </button>
            </div>

            {expandedId === group.id && (
              <div className="space-y-3 border-t border-ink/8 p-3 dark:border-white/10">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink/60 dark:text-sand/60">{t("addonsInGroupLabel")}</p>
                    {(!editingAddon || editingAddon.groupId !== group.id) && (
                      <button
                        type="button"
                        onClick={() => startEditAddon(group.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2 py-0.5 text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
                      >
                        <Plus size={10} /> {t("addAddon")}
                      </button>
                    )}
                  </div>

                  {group.addons.map((addon) =>
                    editingAddon?.groupId === group.id && editingAddon.addonId === addon.id ? (
                      <AddonForm key={addon.id} draft={addonDraft} setDraft={setAddonDraft} onSave={saveAddon} onCancel={() => setEditingAddon(null)} isPending={isPending} error={error} t={t} />
                    ) : (
                      <div key={addon.id} className="flex items-center gap-2 rounded-lg border border-ink/10 px-2.5 py-1.5 text-xs dark:border-white/15">
                        <div className="min-w-0 flex-1 truncate font-semibold">
                          {addon.name} <span className="font-normal text-ink/40 dark:text-sand/40">+${addon.price.toFixed(2)}</span>
                        </div>
                        <button type="button" onClick={() => startEditAddon(group.id, addon)} aria-label={`${t("edit")} ${addon.name}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15">
                          <Pencil size={10} />
                        </button>
                        <button type="button" onClick={() => removeAddon(addon.id, addon.name)} disabled={isPending} aria-label={`${t("delete")} ${addon.name}`} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15">
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )
                  )}

                  {editingAddon?.groupId === group.id && editingAddon.addonId === "new" && (
                    <AddonForm draft={addonDraft} setDraft={setAddonDraft} onSave={saveAddon} onCancel={() => setEditingAddon(null)} isPending={isPending} error={error} t={t} />
                  )}
                </div>

                <div className="space-y-1.5 border-t border-ink/8 pt-3 dark:border-white/10">
                  <p className="text-xs font-semibold text-ink/60 dark:text-sand/60">{t("assignToProductsLabel")}</p>
                  {products.length === 0 ? (
                    <p className="text-xs text-ink/40 dark:text-sand/40">{t("noProductsYet")}</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                      {products.map((product) => {
                        const assigned = group.assignedProductIds.includes(product.id);
                        return (
                          <label key={product.id} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-ink/[0.03] dark:hover:bg-white/[0.05]">
                            <input
                              type="checkbox"
                              checked={assigned}
                              disabled={isPending}
                              onChange={() => toggleAssignment(group.id, product.id, assigned)}
                              className="h-3.5 w-3.5 rounded border-ink/25 text-primary focus:ring-primary"
                            />
                            <span className="truncate">{product.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

function GroupForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
  t,
}: {
  draft: AddonGroupInput;
  setDraft: (d: AddonGroupInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: T;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/[0.03] p-3">
      <input className={inputClass} placeholder={t("addonGroupNamePlaceholder")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder={t("nameArPlaceholder")} value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} dir="rtl" />
        <input className={inputClass} placeholder={t("nameSoPlaceholder")} value={draft.nameSo} onChange={(e) => setDraft({ ...draft, nameSo: e.target.value })} />
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold dark:border-white/20">
          {t("cancel")}
        </button>
        <button type="button" onClick={onSave} disabled={isPending} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {isPending && <Loader2 size={11} className="animate-spin" />} {t("saveAddonGroup")}
        </button>
      </div>
    </div>
  );
}

function AddonForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
  t,
}: {
  draft: ProductAddonInput;
  setDraft: (d: ProductAddonInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: T;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/[0.03] p-3">
      <input className={inputClass} placeholder={t("addonNamePlaceholder")} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inputClass} placeholder={t("nameArPlaceholder")} value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} dir="rtl" />
        <input className={inputClass} placeholder={t("nameSoPlaceholder")} value={draft.nameSo} onChange={(e) => setDraft({ ...draft, nameSo: e.target.value })} />
      </div>
      <div className="flex items-center gap-3">
        <input
          type="number"
          step="0.01"
          min="0"
          className={`${inputClass} max-w-[100px]`}
          placeholder={t("priceLabel")}
          value={draft.price}
          onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
        />
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} className="h-3.5 w-3.5 rounded border-ink/25 text-primary focus:ring-primary" />
          {t("activeLabel")}
        </label>
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold dark:border-white/20">
          {t("cancel")}
        </button>
        <button type="button" onClick={onSave} disabled={isPending} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
          {isPending && <Loader2 size={11} className="animate-spin" />} {t("saveAddon")}
        </button>
      </div>
    </div>
  );
}
