"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Pencil, Eye, EyeOff, Pin, PinOff, ChevronUp, ChevronDown, Plus, X } from "lucide-react";
import { createCategory, updateCategory, setCategoryActive, setCategoryPinned, reorderCategories, deleteCategory, type CategoryInput } from "@/lib/actions/categories";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import type { Locale } from "@/lib/i18n/config";
import type { Category, CategoryCustomField, CategoryTargetTable } from "@/types";

const FIELD_TYPES: CategoryCustomField["type"][] = ["text", "number", "select", "boolean", "textarea"];

const TARGET_TABLES: CategoryTargetTable[] = ["hotels", "restaurants", "cafes", "attractions", "events", "services", "city_services"];

const EMPTY_FORM: CategoryInput = {
  slug: "",
  name: "",
  nameAr: "",
  nameSo: "",
  description: "",
  icon: "Building2",
  color: "",
  targetTable: "services",
  isActive: true,
  isPinned: false,
  sortOrder: 0,
  searchKeywords: [],
  customFieldsSchema: [],
};

function slugifyKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function CategoriesManager({ locale, categories }: { locale: Locale; categories: Category[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM);
  const [keywordsText, setKeywordsText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setKeywordsText("");
    setError(null);
    setShowForm(true);
  }

  function openEditForm(category: Category) {
    setEditingId(category.id);
    setForm({
      slug: category.slug,
      name: category.name,
      nameAr: category.nameAr ?? "",
      nameSo: category.nameSo ?? "",
      description: category.description ?? "",
      icon: category.icon,
      color: category.color ?? "",
      targetTable: category.targetTable,
      isActive: category.isActive,
      isPinned: category.isPinned,
      sortOrder: category.sortOrder,
      searchKeywords: category.searchKeywords,
      customFieldsSchema: category.customFieldsSchema,
    });
    setKeywordsText(category.searchKeywords.join(", "));
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CategoryInput = {
      ...form,
      searchKeywords: keywordsText
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };
    startTransition(async () => {
      const result = editingId ? await updateCategory(locale, editingId, input) : await createCategory(locale, input);
      if (result.ok) {
        closeForm();
        router.refresh();
      } else {
        setError(result.error ?? "Something went wrong.");
      }
    });
  }

  function onToggleActive(category: Category) {
    setPendingId(category.id);
    startTransition(async () => {
      const result = await setCategoryActive(locale, category.id, !category.isActive);
      if (!result.ok) alert(result.error ?? "Something went wrong.");
      router.refresh();
      setPendingId(null);
    });
  }

  function onTogglePinned(category: Category) {
    setPendingId(category.id);
    startTransition(async () => {
      const result = await setCategoryPinned(locale, category.id, !category.isPinned);
      if (!result.ok) alert(result.error ?? "Something went wrong.");
      router.refresh();
      setPendingId(null);
    });
  }

  function onMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const reordered = [...categories];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setPendingId(reordered[index].id);
    startTransition(async () => {
      const result = await reorderCategories(locale, reordered.map((c) => c.id));
      if (!result.ok) alert(result.error ?? "Something went wrong.");
      router.refresh();
      setPendingId(null);
    });
  }

  function onDelete(category: Category) {
    if (confirmDeleteId !== category.id) {
      setConfirmDeleteId(category.id);
      return;
    }
    setPendingId(category.id);
    startTransition(async () => {
      const result = await deleteCategory(locale, category.id);
      if (!result.ok) alert(result.error ?? "Something went wrong.");
      router.refresh();
      setPendingId(null);
      setConfirmDeleteId(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {!showForm ? (
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus size={16} /> New Category
        </button>
      ) : (
        <form onSubmit={onSubmit} className="max-w-2xl space-y-4 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">{editingId ? "Edit Category" : "New Category"}</h3>
            <button type="button" onClick={closeForm} className="rounded-lg p-1.5 hover:bg-ink/5 dark:hover:bg-white/10">
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder={form.name ? "auto-generated from name" : ""}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Name (Arabic)</label>
              <input value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className={inputClass} dir="rtl" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Name (Somali)</label>
              <input value={form.nameSo} onChange={(e) => setForm((f) => ({ ...f, nameSo: e.target.value }))} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={inputClass} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Icon</label>
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <DynamicIcon name={form.icon} size={18} />
                </span>
                <input
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="e.g. Hotel"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Color</label>
              <input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="#F59E0B" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Storage Table</label>
            <select
              value={form.targetTable}
              onChange={(e) => setForm((f) => ({ ...f, targetTable: e.target.value as CategoryTargetTable }))}
              className={inputClass}
            >
              {TARGET_TABLES.map((table) => (
                <option key={table} value={table}>
                  {table}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Search Keywords (comma-separated)</label>
            <input value={keywordsText} onChange={(e) => setKeywordsText(e.target.value)} placeholder="hospital, hospitals, clinic" className={inputClass} />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-sm font-semibold">Custom Fields</label>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    customFieldsSchema: [...f.customFieldsSchema, { key: "", label: "", type: "text", required: false }],
                  }))
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Plus size={12} /> Add field
              </button>
            </div>
            <p className="mb-2 text-xs text-ink/45 dark:text-sand/45">
              Extra fields shown on this category&apos;s submission form and listing detail page — e.g. &quot;Property Type&quot; for Real Estate.
            </p>
            {form.customFieldsSchema.length > 0 && (
              <div className="space-y-2">
                {form.customFieldsSchema.map((field, index) => (
                  <div key={index} className="rounded-xl border border-ink/10 p-3 dark:border-white/15">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
                      <input
                        value={field.label}
                        onChange={(e) => {
                          const label = e.target.value;
                          setForm((f) => ({
                            ...f,
                            customFieldsSchema: f.customFieldsSchema.map((cf, i) =>
                              i === index ? { ...cf, label, key: cf.key || slugifyKey(label) } : cf
                            ),
                          }));
                        }}
                        placeholder="Label (e.g. Property Type)"
                        className={inputClass}
                      />
                      <input
                        value={field.key}
                        onChange={(e) => {
                          const key = slugifyKey(e.target.value);
                          setForm((f) => ({
                            ...f,
                            customFieldsSchema: f.customFieldsSchema.map((cf, i) => (i === index ? { ...cf, key } : cf)),
                          }));
                        }}
                        placeholder="key"
                        className={inputClass}
                      />
                      <select
                        value={field.type}
                        onChange={(e) => {
                          const type = e.target.value as CategoryCustomField["type"];
                          setForm((f) => ({
                            ...f,
                            customFieldsSchema: f.customFieldsSchema.map((cf, i) => (i === index ? { ...cf, type } : cf)),
                          }));
                        }}
                        className={inputClass}
                      >
                        {FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 whitespace-nowrap px-1 text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const required = e.target.checked;
                            setForm((f) => ({
                              ...f,
                              customFieldsSchema: f.customFieldsSchema.map((cf, i) => (i === index ? { ...cf, required } : cf)),
                            }));
                          }}
                        />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((f) => ({ ...f, customFieldsSchema: f.customFieldsSchema.filter((_, i) => i !== index) }))
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {field.type === "select" && (
                      <input
                        value={(field.options ?? []).join(", ")}
                        onChange={(e) => {
                          const options = e.target.value.split(",").map((o) => o.trim()).filter(Boolean);
                          setForm((f) => ({
                            ...f,
                            customFieldsSchema: f.customFieldsSchema.map((cf, i) => (i === index ? { ...cf, options } : cf)),
                          }));
                        }}
                        placeholder="Options, comma-separated (e.g. Apartment, House, Villa)"
                        className={`${inputClass} mt-2`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))} />
              Pinned in nav
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />} {editingId ? "Save Changes" : "Create Category"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {categories.length === 0 ? (
          <p className="rounded-xl2 border border-dashed border-ink/15 p-8 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
            No categories yet.
          </p>
        ) : (
          categories.map((category, index) => {
            const busy = isPending && pendingId === category.id;
            return (
              <div
                key={category.id}
                className="flex flex-col gap-3 rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <DynamicIcon name={category.icon} size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{category.name}</p>
                      <span className="shrink-0 rounded-full bg-ink/8 px-2 py-0.5 text-[11px] font-semibold text-ink/60 dark:bg-white/10 dark:text-sand/60">
                        {category.targetTable}
                      </span>
                      {!category.isActive && (
                        <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-600">Hidden</span>
                      )}
                      {category.isPinned && (
                        <span className="shrink-0 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600">Pinned</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-ink/50 dark:text-sand/50">
                      /{category.slug} · {category.businessCount ?? 0} listing{category.businessCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy || index === 0}
                    onClick={() => onMove(index, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 disabled:opacity-30 dark:border-white/15"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={busy || index === categories.length - 1}
                    onClick={() => onMove(index, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 disabled:opacity-30 dark:border-white/15"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onTogglePinned(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-amber-500 hover:text-amber-600 disabled:opacity-60 dark:border-white/15"
                  >
                    {category.isPinned ? <PinOff size={13} /> : <Pin size={13} />}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onToggleActive(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
                  >
                    {category.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openEditForm(category)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(category)}
                    onBlur={() => setConfirmDeleteId(null)}
                    disabled={busy}
                    className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                      confirmDeleteId === category.id
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
                    }`}
                  >
                    {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
