"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Field, inputClass } from "@/components/admin/form-shared";
import {
  getFeaturedPartnerContent,
  saveFeaturedPartnerContent,
  type FeaturedPartnerContentInput,
} from "@/lib/actions/featured-partner-content";
import type { PolymorphicListingType } from "@/types";

const EMPTY: FeaturedPartnerContentInput = {
  promoText: "",
  promoTextAr: "",
  promoTextSo: "",
  ctaLabel: "",
  ctaLabelAr: "",
  ctaLabelSo: "",
  ctaHref: "",
};

/**
 * Optional custom promo override for one Featured Partner's homepage card
 * — self-contained (fetches and saves independently of the surrounding
 * form's own Save button, same reasoning AssignedOwnerField already uses:
 * this is its own decision, not part of editing the listing's regular
 * content). Only ever rendered when the listing is already saved (real
 * listingId) and marked is_partner — an override with nothing to attach
 * to doesn't make sense. Leaving every field blank and saving is exactly
 * "no override" — the homepage falls back to the automatic
 * category-based template (see lib/data/featured-partner-showcase.ts).
 */
export function FeaturedPartnerPromoEditor({
  listingType,
  listingId,
}: {
  listingType: PolymorphicListingType;
  listingId: string;
}) {
  const t = useTranslations("admin");
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FeaturedPartnerContentInput>(EMPTY);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getFeaturedPartnerContent(listingType, listingId).then((content) => {
      if (!cancelled) {
        setForm(content);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [listingType, listingId]);

  function update<K extends keyof FeaturedPartnerContentInput>(key: K, value: FeaturedPartnerContentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveFeaturedPartnerContent(listingType, listingId, form, window.location.pathname);
      if (result.ok) setSaved(true);
      else setError(result.error ?? t("somethingWentWrong"));
    });
  }

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 rounded-xl2 border border-dashed border-ink/15 p-4 text-sm text-ink/45 dark:border-white/15 dark:text-sand/45">
        <Loader2 size={14} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl2 border border-primary/20 bg-primary/[0.03] p-4 dark:bg-primary/[0.06]">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-primary" aria-hidden="true" />
        <p className="text-sm font-semibold">{t("featuredPartnerPromoTitle")}</p>
      </div>
      <p className="text-xs text-ink/50 dark:text-sand/50">{t("featuredPartnerPromoHint")}</p>

      <Field label={t("featuredPartnerPromoTextLabel")}>
        <textarea
          value={form.promoText}
          onChange={(e) => update("promoText", e.target.value)}
          rows={2}
          className={inputClass}
          placeholder={t("featuredPartnerPromoTextPlaceholder")}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("featuredPartnerPromoTextArLabel")}>
          <textarea value={form.promoTextAr} onChange={(e) => update("promoTextAr", e.target.value)} rows={2} dir="rtl" className={inputClass} />
        </Field>
        <Field label={t("featuredPartnerPromoTextSoLabel")}>
          <textarea value={form.promoTextSo} onChange={(e) => update("promoTextSo", e.target.value)} rows={2} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t("featuredPartnerCtaLabelLabel")}>
          <input value={form.ctaLabel} onChange={(e) => update("ctaLabel", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("featuredPartnerCtaLabelArLabel")}>
          <input value={form.ctaLabelAr} onChange={(e) => update("ctaLabelAr", e.target.value)} dir="rtl" className={inputClass} />
        </Field>
        <Field label={t("featuredPartnerCtaLabelSoLabel")}>
          <input value={form.ctaLabelSo} onChange={(e) => update("ctaLabelSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label={t("featuredPartnerCtaHrefLabel")} hint={t("featuredPartnerCtaHrefHint")}>
        <input value={form.ctaHref} onChange={(e) => update("ctaHref", e.target.value)} className={inputClass} placeholder="https://…" />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onSave}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
      >
        {isPending && <Loader2 size={13} className="animate-spin" />}
        {saved ? t("featuredPartnerPromoSaved") : t("featuredPartnerPromoSaveAction")}
      </button>
    </div>
  );
}
