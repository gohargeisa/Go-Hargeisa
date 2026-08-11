"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Loader2, Pencil, Plus, Trash2, X, Star, EyeOff } from "lucide-react";
import { createProduct, deleteProduct, updateProduct, type ProductInput } from "@/lib/actions/products";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { Field, inputClass } from "@/components/admin/form-shared";
import { PRODUCT_CATEGORY_ORDER, PRODUCT_CATEGORY_LABELS, PRODUCT_GENDER_ORDER, PRODUCT_GENDER_LABELS } from "@/lib/config/product-categories";
import type { GalleryImage, ProductCategory, ProductGender } from "@/types";

export interface ProductManagerRow extends ProductInput {
  id: string;
}

const BLANK: ProductInput = {
  name: "",
  nameAr: "",
  nameSo: "",
  description: "",
  descriptionAr: "",
  descriptionSo: "",
  brand: "",
  category: undefined,
  gender: undefined,
  price: undefined,
  currency: "USD",
  image: "",
  gallery: [],
  isAvailable: true,
  isFeatured: false,
  isHidden: false,
  size: "",
};

/**
 * Inline CRUD for a Perfume & Cosmetics shop's products — mirrors
 * components/admin/hotel-rooms-manager.tsx's structure (client-mutation +
 * router.refresh() pattern), reused as-is from both /business/products (an
 * owner managing their own shop) and the admin city-services edit page.
 * Products authorize via the parent city_services listing's owner_id — see
 * lib/actions/products.ts's assertCanManageProduct.
 */
export function ProductsManager({
  listingId,
  initialProducts,
  revalidatePaths,
  locale,
}: {
  listingId: string;
  initialProducts: ProductManagerRow[];
  revalidatePaths: string[];
  locale: string;
}) {
  const t = useTranslations("products");
  const [products, setProducts] = useState(initialProducts);
  useEffect(() => setProducts(initialProducts), [initialProducts]);

  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<ProductInput>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function startEdit(product?: ProductManagerRow) {
    setError(null);
    if (product) {
      setEditingId(product.id);
      setDraft({ ...product });
    } else {
      setEditingId("new");
      setDraft(BLANK);
    }
  }

  function save() {
    if (!draft.name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        editingId && editingId !== "new"
          ? await updateProduct(editingId, listingId, draft, revalidatePaths)
          : await createProduct(listingId, draft, revalidatePaths);
      if (result.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDelete"))) return;
    startTransition(async () => {
      const result = await deleteProduct(id, listingId, revalidatePaths);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("deleteFailed"));
    });
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        {editingId === null && (
          <button
            type="button"
            onClick={() => startEdit()}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={13} /> {t("addProduct")}
          </button>
        )}
      </div>

      {products.length === 0 && editingId === null && (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noProductsYet")}</p>
      )}

      <div className="space-y-2">
        {products.map((product) =>
          editingId === product.id ? (
            <ProductForm
              key={product.id}
              draft={draft}
              setDraft={setDraft}
              onSave={save}
              onCancel={() => setEditingId(null)}
              isPending={isPending}
              error={error}
              t={t}
              locale={locale}
            />
          ) : (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-xl2 border border-ink/8 p-3 dark:border-white/10"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/5">
                {product.image && <Image src={product.image} alt={product.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  {product.isFeatured && <Star size={13} className="shrink-0 text-amber-500" aria-label={t("featured")} />}
                  {product.isHidden && <EyeOff size={13} className="shrink-0 text-ink/40" aria-label={t("hidden")} />}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      product.isAvailable
                        ? "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400"
                        : "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                    }`}
                  >
                    {product.isAvailable ? t("available") : t("unavailable")}
                  </span>
                </div>
                <p className="text-xs text-ink/50 dark:text-sand/50">
                  {product.category ? PRODUCT_CATEGORY_LABELS[product.category][locale as "en" | "ar" | "so"] ?? PRODUCT_CATEGORY_LABELS[product.category].en : ""}
                  {product.brand ? ` • ${product.brand}` : ""}
                  {product.size ? ` • ${product.size}` : ""}
                  {product.price != null ? ` • ${product.price} ${product.currency}` : ` • ${t("priceOnRequest")}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startEdit(product)}
                aria-label={`${t("edit")} ${product.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => remove(product.id)}
                disabled={isPending}
                aria-label={`${t("delete")} ${product.name}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 hover:border-red-500 hover:text-red-500 dark:border-white/15"
              >
                <Trash2 size={13} />
              </button>
            </div>
          )
        )}

        {editingId === "new" && (
          <ProductForm
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={() => setEditingId(null)}
            isPending={isPending}
            error={error}
            t={t}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
}

function ProductForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  isPending,
  error,
  t,
  locale,
}: {
  draft: ProductInput;
  setDraft: (d: ProductInput) => void;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
  error: string | null;
  t: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setDraft({ ...draft, [key]: value });
  }

  return (
    <div className="space-y-3 rounded-xl2 border border-primary/30 bg-primary/5 p-4">
      <ImageUploader folder="products" value={draft.image ?? ""} onChange={(url) => update("image", url)} label={t("mainImage")} />

      <div>
        <label className="mb-1.5 block text-xs font-semibold text-ink/60 dark:text-sand/60">{t("additionalPhotos")}</label>
        <GalleryManager
          folder="products/gallery"
          value={draft.gallery}
          onChange={(v: GalleryImage[]) => update("gallery", v)}
          categories={[]}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("nameLabel")}>
          <input value={draft.name} onChange={(e) => update("name", e.target.value)} className={inputClass} placeholder={t("namePlaceholder")} />
        </Field>
        <Field label={t("nameArLabel")}>
          <input dir="rtl" value={draft.nameAr ?? ""} onChange={(e) => update("nameAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("nameSoLabel")}>
          <input value={draft.nameSo ?? ""} onChange={(e) => update("nameSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("descriptionLabel")}>
          <textarea rows={2} value={draft.description ?? ""} onChange={(e) => update("description", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("descriptionArLabel")}>
          <textarea dir="rtl" rows={2} value={draft.descriptionAr ?? ""} onChange={(e) => update("descriptionAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("descriptionSoLabel")}>
          <textarea rows={2} value={draft.descriptionSo ?? ""} onChange={(e) => update("descriptionSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("brandLabel")}>
          <input value={draft.brand ?? ""} onChange={(e) => update("brand", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("categoryLabel")}>
          <select
            value={draft.category ?? ""}
            onChange={(e) => update("category", (e.target.value || undefined) as ProductCategory | undefined)}
            className={inputClass}
          >
            <option value="">{t("selectCategory")}</option>
            {PRODUCT_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {PRODUCT_CATEGORY_LABELS[c][locale as "en" | "ar" | "so"] ?? PRODUCT_CATEGORY_LABELS[c].en}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Field label={t("genderLabel")}>
          <select
            value={draft.gender ?? ""}
            onChange={(e) => update("gender", (e.target.value || undefined) as ProductGender | undefined)}
            className={inputClass}
          >
            <option value="">{t("selectGender")}</option>
            {PRODUCT_GENDER_ORDER.map((g) => (
              <option key={g} value={g}>
                {PRODUCT_GENDER_LABELS[g][locale as "en" | "ar" | "so"] ?? PRODUCT_GENDER_LABELS[g].en}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t("priceLabel")} hint={t("priceOptionalHint")}>
          <input
            type="number"
            value={draft.price ?? ""}
            onChange={(e) => update("price", e.target.value ? Number(e.target.value) : undefined)}
            className={inputClass}
          />
        </Field>
        <Field label={t("currencyLabel")}>
          <input value={draft.currency} onChange={(e) => update("currency", e.target.value || "USD")} className={inputClass} />
        </Field>
        <Field label={t("sizeLabel")} hint={t("sizeOptionalHint")}>
          <input value={draft.size ?? ""} onChange={(e) => update("size", e.target.value)} className={inputClass} placeholder="50ml" />
        </Field>
        <Field label={t("availabilityLabel")}>
          <select
            value={draft.isAvailable ? "available" : "unavailable"}
            onChange={(e) => update("isAvailable", e.target.value === "available")}
            className={inputClass}
          >
            <option value="available">{t("available")}</option>
            <option value="unavailable">{t("unavailable")}</option>
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} />
          {t("featuredCheckbox")}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.isHidden} onChange={(e) => update("isHidden", e.target.checked)} />
          {t("hiddenCheckbox")}
        </label>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={12} className="animate-spin" />}
          {t("saveProduct")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold dark:border-white/20"
        >
          <X size={12} /> {t("cancel")}
        </button>
      </div>
    </div>
  );
}
