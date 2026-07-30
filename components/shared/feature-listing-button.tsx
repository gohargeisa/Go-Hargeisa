"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, Loader2 } from "lucide-react";
import { toggleListingFeatured, type FeaturableTable } from "@/lib/actions/admin";

/** Owner-only one-click Feature toggle — mirrors the pattern already used
 * for city services (components/admin/city-services-list.tsx). */
export function FeatureListingButton({ table, id, featured }: { table: FeaturableTable; id: string; featured: boolean }) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      const result = await toggleListingFeatured(table, id, !featured, window.location.pathname);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-label={featured ? t("unfeatureAriaLabel") : t("featureAriaLabel")}
      aria-pressed={featured}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-60 ${
        featured ? "border-amber-400 bg-amber-400/10 text-amber-500" : "border-ink/10 dark:border-white/15 hover:border-amber-400 hover:text-amber-500"
      }`}
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Star size={13} fill={featured ? "currentColor" : "none"} />}
    </button>
  );
}
