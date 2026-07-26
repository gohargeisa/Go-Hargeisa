"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import type { Locale } from "@/lib/i18n/config";

export interface AttractionFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  address: string;
  lat: number;
  lng: number;
  history: string;
  bestTimeToVisit: string;
  entryFee: string;
  visitorTips: string[];
  category: "landmark" | "museum" | "market" | "nature" | "religious";
  featured: boolean;
}

export function AttractionForm({
  locale,
  mode,
  attractionId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  attractionId?: string;
  initial?: Partial<AttractionFormInput>;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState<AttractionFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    history: initial?.history ?? "",
    bestTimeToVisit: initial?.bestTimeToVisit ?? "",
    entryFee: initial?.entryFee ?? "Free",
    visitorTips: initial?.visitorTips ?? [],
    category: initial?.category ?? "landmark",
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof AttractionFormInput>(key: K, value: AttractionFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.coverImage) {
      setError(t("uploadCoverImageError"));
      return;
    }

    const payload = {
      slug: form.slug,
      name: form.name,
      short_description: form.shortDescription,
      description: form.description,
      cover_image: form.coverImage,
      gallery: [],
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      history: form.history || null,
      best_time_to_visit: form.bestTimeToVisit || null,
      entry_fee: form.entryFee,
      visitor_tips: form.visitorTips,
      category: form.category,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/attractions`, `/${locale}/attractions`, `/${locale}`];
    const redirectTo = `/${locale}/admin/attractions`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("attractions", payload, revalidatePaths, redirectTo)
          : await updateRecord("attractions", attractionId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="attractions" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("attractionNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="freedom-park-mig-monument" />
        </Field>
      </div>

      <Field label={t("shortDescriptionLabel")}>
        <input required value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionLabel")}>
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("historyLabel")}>
        <textarea rows={3} value={form.history} onChange={(e) => update("history", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("addressLabel")}>
        <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("latitudeLabel")}>
          <input required type="number" step="0.0001" value={form.lat} onChange={(e) => update("lat", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label={t("longitudeLabel")}>
          <input required type="number" step="0.0001" value={form.lng} onChange={(e) => update("lng", Number(e.target.value))} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("bestTimeToVisitLabel")}>
          <input value={form.bestTimeToVisit} onChange={(e) => update("bestTimeToVisit", e.target.value)} className={inputClass} placeholder="Late afternoon" />
        </Field>
        <Field label={t("entryFeeLabel")}>
          <input value={form.entryFee} onChange={(e) => update("entryFee", e.target.value)} className={inputClass} placeholder="Free" />
        </Field>
        <Field label={t("categoryLabel")}>
          <select value={form.category} onChange={(e) => update("category", e.target.value as AttractionFormInput["category"])} className={inputClass}>
            <option value="landmark">{t("categoryLandmark")}</option>
            <option value="museum">{t("categoryMuseum")}</option>
            <option value="market">{t("categoryMarket")}</option>
            <option value="nature">{t("categoryNature")}</option>
            <option value="religious">{t("categoryReligious")}</option>
          </select>
        </Field>
      </div>

      <TagInput label={t("visitorTipsLabel")} values={form.visitorTips} onChange={(v) => update("visitorTips", v)} placeholder={t("tagInputPlaceholder")} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
        {t("featureOnHomepage")}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("publishAttraction") : t("saveChanges")}
      </button>
    </form>
  );
}
