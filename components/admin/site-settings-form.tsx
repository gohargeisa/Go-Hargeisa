"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, inputClass } from "@/components/admin/form-shared";
import { updateSiteSettings, type SiteSettingsUpdate } from "@/lib/actions/settings";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";

export interface SiteSettingsFormInput {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  footerText: string;
}

export function SiteSettingsForm({ initial }: { initial: Partial<SiteSettingsFormInput> }) {
  const t = useTranslations("admin");
  const [form, setForm] = useState<SiteSettingsFormInput>({
    siteName: initial.siteName ?? "",
    logoUrl: initial.logoUrl ?? "",
    faviconUrl: initial.faviconUrl ?? "",
    contactEmail: initial.contactEmail ?? "",
    contactPhone: initial.contactPhone ?? "",
    whatsappNumber: initial.whatsappNumber ?? "",
    socialFacebook: initial.socialFacebook ?? "",
    socialInstagram: initial.socialInstagram ?? "",
    socialTwitter: initial.socialTwitter ?? "",
    socialYoutube: initial.socialYoutube ?? "",
    socialTiktok: initial.socialTiktok ?? "",
    footerText: initial.footerText ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof SiteSettingsFormInput>(key: K, value: SiteSettingsFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setSaved(false);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: SiteSettingsUpdate = {
      siteName: form.siteName || undefined,
      logoUrl: form.logoUrl || undefined,
      faviconUrl: form.faviconUrl || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
      whatsappNumber: form.whatsappNumber || undefined,
      socialFacebook: form.socialFacebook || undefined,
      socialInstagram: form.socialInstagram || undefined,
      socialTwitter: form.socialTwitter || undefined,
      socialYoutube: form.socialYoutube || undefined,
      socialTiktok: form.socialTiktok || undefined,
      footerText: form.footerText || undefined,
    };

    startTransition(async () => {
      const result = await updateSiteSettings(payload);
      if (result.ok) {
        setDirty(false);
        setSaved(true);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploader folder="site" value={form.logoUrl} onChange={(url) => update("logoUrl", url)} label={t("logoLabel")} />
        <ImageUploader folder="site" value={form.faviconUrl} onChange={(url) => update("faviconUrl", url)} label={t("faviconLabel")} />
      </div>

      <Field label={t("siteNameLabel")}>
        <input value={form.siteName} onChange={(e) => update("siteName", e.target.value)} className={inputClass} placeholder="Go Hargeisa" />
      </Field>

      <Field label={t("footerTaglineLabel")} hint={t("footerTaglineHint")}>
        <textarea rows={2} value={form.footerText} onChange={(e) => update("footerText", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("emailLabel")}>
          <input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("phoneLabel")}>
          <input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("whatsappLabel")}>
          <input value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("socialFacebookLabel")}>
          <input type="url" value={form.socialFacebook} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("socialInstagramLabel")}>
          <input type="url" value={form.socialInstagram} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("socialTwitterLabel")}>
          <input type="url" value={form.socialTwitter} onChange={(e) => update("socialTwitter", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("socialYoutubeLabel")}>
          <input type="url" value={form.socialYoutube} onChange={(e) => update("socialYoutube", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("socialTiktokLabel")}>
          <input type="url" value={form.socialTiktok} onChange={(e) => update("socialTiktok", e.target.value)} className={inputClass} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-accent-700">{t("settingsSaved")}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        {t("saveChanges")}
      </button>
    </form>
  );
}
