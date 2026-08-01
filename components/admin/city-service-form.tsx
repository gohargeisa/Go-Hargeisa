"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, inputClass } from "@/components/admin/form-shared";
import { createCityService, updateCityService } from "@/lib/actions/city-services";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import type { Locale } from "@/lib/i18n/config";
import type { EssentialServiceCategory } from "@/types";

export interface CityServiceFormInput {
  category: EssentialServiceCategory;
  name: string;
  nameAr: string;
  nameSo: string;
  description: string;
  descriptionAr: string;
  descriptionSo: string;
  phone: string;
  openingHours: string;
  mapsUrl: string;
  website: string;
  image: string;
  featured: boolean;
}

export function CityServiceForm({
  locale,
  mode,
  serviceId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  serviceId?: string;
  initial?: Partial<CityServiceFormInput>;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [form, setForm] = useState<CityServiceFormInput>({
    category: initial?.category ?? "hospital",
    name: initial?.name ?? "",
    nameAr: initial?.nameAr ?? "",
    nameSo: initial?.nameSo ?? "",
    description: initial?.description ?? "",
    descriptionAr: initial?.descriptionAr ?? "",
    descriptionSo: initial?.descriptionSo ?? "",
    phone: initial?.phone ?? "",
    openingHours: initial?.openingHours ?? "",
    mapsUrl: initial?.mapsUrl ?? "",
    website: initial?.website ?? "",
    image: initial?.image ?? "",
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof CityServiceFormInput>(key: K, value: CityServiceFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      category: form.category,
      name: form.name,
      nameAr: form.nameAr || undefined,
      nameSo: form.nameSo || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      descriptionSo: form.descriptionSo || undefined,
      phone: form.phone || undefined,
      openingHours: form.openingHours || undefined,
      mapsUrl: form.mapsUrl || undefined,
      website: form.website || undefined,
      image: form.image || undefined,
      featured: form.featured,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCityService(locale, payload)
          : await updateCityService(locale, serviceId!, payload);

      if (result.ok) {
        setDirty(false);
        router.push(`/${locale}/admin/city-services`);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="city-services" value={form.image} onChange={(url) => update("image", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cityServiceNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("cityServiceCategoryLabel")}>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value as EssentialServiceCategory)}
            className={inputClass}
          >
            <option value="hospital">{t("categoryHospital")}</option>
            <option value="bank">{t("categoryBank")}</option>
            <option value="supermarket">{t("categorySupermarket")}</option>
            <option value="pharmacy">{t("categoryPharmacy")}</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cityServiceNameArLabel")}>
          <input dir="rtl" value={form.nameAr} onChange={(e) => update("nameAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("cityServiceNameSoLabel")}>
          <input value={form.nameSo} onChange={(e) => update("nameSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label={t("phoneLabel")}>
        <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
      </Field>

      <Field label={t("websiteLabel")}>
        <input
          type="url"
          value={form.website}
          onChange={(e) => update("website", e.target.value)}
          className={inputClass}
          placeholder="https://…"
        />
      </Field>

      <Field label={t("openingHoursShortLabel")}>
        <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="Sat–Thu, 8:00 AM – 6:00 PM" />
      </Field>

      <Field label={t("mapsUrlLabel")}>
        <input
          type="url"
          value={form.mapsUrl}
          onChange={(e) => update("mapsUrl", e.target.value)}
          className={inputClass}
          placeholder="https://maps.google.com/…"
        />
      </Field>

      <Field label={t("cityServiceDescriptionLabel")}>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t("fullDescriptionArLabel")}>
        <textarea dir="rtl" rows={3} value={form.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionSoLabel")}>
        <textarea rows={3} value={form.descriptionSo} onChange={(e) => update("descriptionSo", e.target.value)} className={inputClass} />
      </Field>

      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => update("featured", e.target.checked)}
          className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary dark:border-white/25"
        />
        {t("cityServiceFeaturedLabel")}
      </label>
      <p className="-mt-4 text-xs text-ink/45 dark:text-sand/45">{t("cityServiceFeaturedHint")}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("saveCityService") : t("saveChanges")}
      </button>
    </form>
  );
}
