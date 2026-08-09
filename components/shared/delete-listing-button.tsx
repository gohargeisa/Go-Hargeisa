"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { deleteListing } from "@/lib/actions/admin";
import { deleteCityService } from "@/lib/actions/city-services";
import { useToast, ToastViewport } from "@/components/shared/toast";

const ALLOWED = ["hotels", "restaurants", "cafes", "attractions", "events", "articles", "city_services"] as const;
type Table = (typeof ALLOWED)[number];

export function DeleteListingButton({
  table,
  id,
  name,
  locale,
}: {
  table: Table;
  id: string;
  name: string;
  /** Required only for table="city_services" — deleteCityService (unlike
   * the generic deleteListing) revalidates locale-specific paths itself,
   * so it needs one. Every other table ignores this. */
  locale?: string;
}) {
  const t = useTranslations("listings");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast, showToast, dismiss } = useToast();

  function onDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      const result =
        table === "city_services"
          ? await deleteCityService(locale ?? "en", id)
          : await deleteListing(table, id, window.location.pathname);
      if (result.ok) {
        showToast("success", t("deleteSuccess", { name }));
        router.refresh();
      } else {
        showToast("error", result.error ?? t("deleteError"));
      }
      setConfirming(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={onDelete}
        onBlur={() => setConfirming(false)}
        disabled={isPending}
        aria-label={confirming ? t("deleteConfirmTooltip", { name }) : t("deleteLabel")}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors ${
          confirming
            ? "border-red-500 bg-red-500 text-white"
            : "border-ink/10 dark:border-white/15 hover:border-red-500 hover:text-red-500"
        }`}
      >
        {isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
        {confirming && (isPending ? t("deletingLabel") : t("confirmLabel"))}
      </button>
      <ToastViewport toast={toast} onDismiss={dismiss} />
    </>
  );
}
