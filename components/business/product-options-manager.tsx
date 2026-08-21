"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { useTranslations } from "next-intl";
import { Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { createProductOption, updateProductOption, deleteProductOption, type ProductOptionInput } from "@/lib/actions/product-options";
import { getOptionPresets, type OptionPreset } from "@/lib/config/product-option-presets";
import { inputClass } from "@/components/admin/form-shared";
import type { ProductOption, ProductOptionChoice, ProductCategory } from "@/types";
import type { ProductListingType } from "@/lib/actions/products";

const OPTION_TYPES: ProductOption["type"][] = ["select", "multiselect", "boolean", "text", "number"];

const BLANK_OPTION: ProductOptionInput = {
  key: "",
  label: "",
  labelAr: "",
  labelSo: "",
  type: "select",
  required: false,
  priceDelta: 0,
  choices: [],
  placeholder: "",
  sortOrder: 0,
};

type T = ReturnType<typeof useTranslations>;

/**
 * Inline CRUD for one product's own configurable options (gift wrap, cake
 * writing, milk type, toppings...) — same nested-card pattern as
 * ProductsManager/ProductForm itself. Only rendered once a product has been
 * saved at least once (needs a real `productId` to attach rows to). See
 * lib/actions/product-options.ts and supabase/migrations/
 * 20260829000001_product_options.sql.
 */
export function ProductOptionsManager({
  productId,
  initialOptions,
  revalidatePaths,
  category,
  listingType,
  locale,
  t,
}: {
  productId: string;
  initialOptions: ProductOption[];
  revalidatePaths: string[];
  /** Drives the "suggested options" chips below — see
   * lib/config/product-option-presets.ts. Purely a one-click prefill, never
   * auto-applied; omit either to just hide the suggestions. */
  category?: ProductCategory;
  listingType?: ProductListingType;
  locale?: string;
  t: T;
}) {
  const [options, setOptions] = useState(initialOptions);
  useEffect(() => setOptions(initialOptions), [initialOptions]);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ProductOptionInput>(BLANK_OPTION);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(opt?: ProductOption) {
    setError(null);
    if (opt) {
      setEditingId(opt.id);
      setDraft({
        key: opt.key,
        label: opt.label,
        labelAr: opt.labelAr ?? "",
        labelSo: opt.labelSo ?? "",
        type: opt.type,
        required: opt.required,
        priceDelta: opt.priceDelta,
        choices: opt.choices,
        placeholder: opt.placeholder ?? "",
        maxLength: opt.maxLength,
        sortOrder: opt.sortOrder,
      });
    } else {
      setEditingId("new");
      setDraft({ ...BLANK_OPTION, sortOrder: options.length });
    }
  }

  function startEditFromPreset(preset: OptionPreset) {
    setError(null);
    setEditingId("new");
    const { presetLabel: _presetLabel, presetLabelAr: _presetLabelAr, presetLabelSo: _presetLabelSo, ...optionInput } = preset;
    setDraft({ ...optionInput, sortOrder: options.length });
  }

  // Only suggest presets for a key this product doesn't already have —
  // re-clicking after applying one wouldn't offer a duplicate.
  const existingKeys = new Set(options.map((o) => o.key));
  const presets = getOptionPresets(category, listingType ?? "city_service").filter((p) => !existingKeys.has(p.key));
  const presetChipLabel = (p: OptionPreset) => (locale === "ar" && p.presetLabelAr) || (locale === "so" && p.presetLabelSo) || p.presetLabel;

  function save() {
    if (!draft.key.trim() || !draft.label.trim()) {
      setError(t("optionKeyLabelRequired"));
      return;
    }
    if ((draft.type === "select" || draft.type === "multiselect") && draft.choices.length === 0) {
      setError(t("optionChoicesRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingId && editingId !== "new"
          ? await updateProductOption(editingId, productId, draft, revalidatePaths)
          : await createProductOption(productId, draft, revalidatePaths);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDeleteOption"))) return;
    startTransition(async () => {
      const result = await deleteProductOption(id, productId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("deleteFailed"));
    });
  }

  function addChoice() {
    setDraft((d) => ({ ...d, choices: [...d.choices, { value: "", label: "", priceDelta: 0 }] }));
  }
  function updateChoice(i: number, patch: Partial<ProductOptionChoice>) {
    setDraft((d) => ({ ...d, choices: d.choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));
  }
  function removeChoice(i: number) {
    setDraft((d) => ({ ...d, choices: d.choices.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="space-y-2 border-t border-ink/8 pt-3.5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink/60 dark:text-sand/60">{t("productOptionsLabel")}</label>
        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={11} /> {t("addOption")}
          </button>
        )}
      </div>

      {options.length === 0 && editingId === null && <p className="text-xs text-ink/40 dark:text-sand/40">{t("noOptionsYet")}</p>}

      {editingId === null && presets.length > 0 && (
        <div className="space-y-1.5 rounded-lg bg-ink/[0.02] p-2.5 dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold text-ink/50 dark:text-sand/50">{t("suggestedOptionsLabel")}</p>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => startEditFromPreset(preset)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-ink/20 px-2.5 py-1 text-[11px] font-semibold text-ink/60 transition-colors hover:border-primary hover:text-primary dark:border-white/25 dark:text-sand/60"
              >
                <Plus size={10} /> {presetChipLabel(preset)}
              </button>
            ))}
          </div>
        </div>
      )}

      {options.map((opt) =>
        editingId === opt.id ? (
          <OptionForm
            key={opt.id}
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={() => setEditingId(null)}
            isPending={isPending}
            error={error}
            t={t}
            addChoice={addChoice}
            updateChoice={updateChoice}
            removeChoice={removeChoice}
          />
        ) : (
          <div key={opt.id} className="flex items-center gap-2 rounded-lg border border-ink/10 px-2.5 py-2 text-xs dark:border-white/15">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {opt.label}{" "}
                <span className="font-normal text-ink/40 dark:text-sand/40">
                  ({t(`optionType_${opt.type}`)}{opt.required ? `, ${t("requiredLabel")}` : ""})
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => startEdit(opt)}
              aria-label={`${t("edit")} ${opt.label}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              onClick={() => remove(opt.id)}
              disabled={isPending}
              aria-label={`${t("delete")} ${opt.label}`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
            >
              <Trash2 size={11} />
            </button>
          </div>
        )
      )}

      {editingId === "new" && (
        <OptionForm
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          onCancel={() => setEditingId(null)}
          isPending={isPending}
          error={error}
          t={t}
          addChoice={addChoice}
          updateChoice={updateChoice}
          removeChoice={removeChoice}
        />
      )}
    </div>
  );
}

function OptionForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
  t,
  addChoice,
  updateChoice,
  removeChoice,
}: {
  draft: ProductOptionInput;
  setDraft: (updater: (d: ProductOptionInput) => ProductOptionInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: T;
  addChoice: () => void;
  updateChoice: (i: number, patch: Partial<ProductOptionChoice>) => void;
  removeChoice: (i: number) => void;
}) {
  function update<K extends keyof ProductOptionInput>(key: K, value: ProductOptionInput[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  const showChoices = draft.type === "select" || draft.type === "multiselect";
  const showPriceDelta = draft.type === "boolean" || draft.type === "number";

  return (
    <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={draft.key}
          onChange={(e) => update("key", e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
          placeholder={t("optionKeyPlaceholder")}
          className={inputClass}
        />
        <select value={draft.type} onChange={(e) => update("type", e.target.value as ProductOption["type"])} className={inputClass}>
          {OPTION_TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(`optionType_${ty}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <input value={draft.label} onChange={(e) => update("label", e.target.value)} placeholder={t("optionLabelPlaceholder")} className={inputClass} />
        <input dir="rtl" value={draft.labelAr ?? ""} onChange={(e) => update("labelAr", e.target.value)} placeholder={t("optionLabelArPlaceholder")} className={inputClass} />
        <input value={draft.labelSo ?? ""} onChange={(e) => update("labelSo", e.target.value)} placeholder={t("optionLabelSoPlaceholder")} className={inputClass} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs">
          <input type="checkbox" checked={draft.required} onChange={(e) => update("required", e.target.checked)} /> {t("requiredLabel")}
        </label>
        {showPriceDelta && (
          <label className="flex items-center gap-1.5 text-xs">
            {t(draft.type === "number" ? "pricePerUnitLabel" : "priceIfSelectedLabel")}
            <input
              type="number"
              step="0.01"
              value={draft.priceDelta}
              onChange={(e) => update("priceDelta", Number(e.target.value) || 0)}
              className={`${inputClass} w-24`}
            />
          </label>
        )}
        {draft.type === "text" && (
          <label className="flex items-center gap-1.5 text-xs">
            {t("maxLengthLabel")}
            <input
              type="number"
              value={draft.maxLength ?? ""}
              onChange={(e) => update("maxLength", e.target.value ? Number(e.target.value) : undefined)}
              className={`${inputClass} w-20`}
            />
          </label>
        )}
      </div>

      {showChoices && (
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-ink/60 dark:text-sand/60">{t("choicesLabel")}</label>
          {draft.choices.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input value={c.value} onChange={(e) => updateChoice(i, { value: e.target.value })} placeholder={t("choiceValuePlaceholder")} className={`${inputClass} flex-1`} />
              <input value={c.label} onChange={(e) => updateChoice(i, { label: e.target.value })} placeholder={t("choiceLabelPlaceholder")} className={`${inputClass} flex-1`} />
              <input
                type="number"
                step="0.01"
                value={c.priceDelta ?? 0}
                onChange={(e) => updateChoice(i, { priceDelta: Number(e.target.value) || 0 })}
                className={`${inputClass} w-20`}
              />
              <button
                type="button"
                onClick={() => removeChoice(i)}
                aria-label={t("delete")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChoice}
            className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={10} /> {t("addChoice")}
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={11} className="animate-spin" />}
          {t("saveOption")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-3 py-1.5 text-[11px] font-semibold dark:border-white/20"
        >
          <X size={11} /> {t("cancel")}
        </button>
      </div>
    </div>
  );
}
