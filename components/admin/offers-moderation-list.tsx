"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, Loader2, Star, Ticket, X } from "lucide-react";
import { moderateOffer, toggleOfferFeatured } from "@/lib/actions/offers";
import { getOfferLifecycleStatus, formatOfferDiscount } from "@/lib/utils/offer-status";
import type { Locale } from "@/lib/i18n/config";
import type { OfferApprovalStatus, OfferLifecycleStatus } from "@/types";
import type { OfferWithListing } from "@/lib/data/offers";

const APPROVAL_BADGE: Record<OfferApprovalStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  approved: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  rejected: "bg-red-500/10 text-red-600",
};
const LIFECYCLE_BADGE: Record<OfferLifecycleStatus, string> = {
  inactive: "bg-ink/10 text-ink/50 dark:bg-white/10 dark:text-sand/50",
  scheduled: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  active: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
  expired: "bg-ink/10 text-ink/40 dark:bg-white/10 dark:text-sand/40",
};
const PUBLIC_SEGMENT = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes", city_service: "city-services" } as const;

export function OffersModerationList({ locale, offers }: { locale: Locale; offers: OfferWithListing[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(id: string, action: () => Promise<{ ok: boolean; error?: string }>) {
    setPendingId(id);
    startTransition(async () => {
      const result = await action();
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  if (offers.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="font-semibold">{t("noOffersYet")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {offers.map((offer) => {
        const busy = isPending && pendingId === offer.id;
        const lifecycle = getOfferLifecycleStatus(offer);
        const discountLabel = formatOfferDiscount(offer);
        const revalidatePaths = [`/${locale}/admin/offers`, `/${locale}`, `/${locale}/${PUBLIC_SEGMENT[offer.listingType]}/${offer.listingSlug}`];

        return (
          <div key={offer.id} className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                {offer.coverImage && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
                    <Image src={offer.coverImage} alt={offer.title} fill sizes="48px" className="object-cover" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{offer.title}</p>
                  <Link
                    href={`/${locale}/${PUBLIC_SEGMENT[offer.listingType]}/${offer.listingSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary underline"
                  >
                    {offer.listingName} <ExternalLink size={10} aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {discountLabel && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary-800">{discountLabel}</span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${APPROVAL_BADGE[offer.approvalStatus]}`}>
                  {t(`offerApproval_${offer.approvalStatus}` as "offerApproval_pending")}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${LIFECYCLE_BADGE[lifecycle]}`}>
                  {t(`offerLifecycle_${lifecycle}` as "offerLifecycle_active")}
                </span>
              </div>
            </div>

            {offer.description && <p className="mt-3 text-sm text-ink/70 dark:text-sand/70">{offer.description}</p>}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/45 dark:text-sand/45">
              {(offer.startsAt || offer.endsAt) && (
                <span>
                  {offer.startsAt ?? "…"} – {offer.endsAt ?? "…"}
                </span>
              )}
              {offer.couponCode && (
                <span className="flex items-center gap-1">
                  <Ticket size={11} aria-hidden="true" /> {offer.couponCode}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {offer.approvalStatus !== "approved" && (
                <button
                  type="button"
                  onClick={() => run(offer.id, () => moderateOffer(offer.id, "approved", revalidatePaths))}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold transition-colors hover:border-secondary-600 hover:text-secondary-700 disabled:opacity-60 dark:border-white/15"
                >
                  {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} {t("approveAction")}
                </button>
              )}
              {offer.approvalStatus !== "rejected" && (
                <button
                  type="button"
                  onClick={() => run(offer.id, () => moderateOffer(offer.id, "rejected", revalidatePaths))}
                  disabled={busy}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-2.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                >
                  <X size={12} /> {t("rejectAction")}
                </button>
              )}
              {offer.approvalStatus === "approved" && (
                <button
                  type="button"
                  onClick={() => run(offer.id, () => toggleOfferFeatured(offer.id, !offer.featured, revalidatePaths))}
                  disabled={busy}
                  aria-label={offer.featured ? t("unfeatureAriaLabel") : t("featureAriaLabel")}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                    offer.featured
                      ? "border-primary/40 bg-primary/5 text-primary-800"
                      : "border-ink/10 hover:border-primary hover:text-primary dark:border-white/15"
                  }`}
                >
                  <Star size={12} fill={offer.featured ? "currentColor" : "none"} /> {t("featuredOfferLabel")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
