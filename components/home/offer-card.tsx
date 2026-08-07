import Link from "next/link";
import Image from "next/image";
import { Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatOfferDiscount } from "@/lib/utils/offer-status";
import type { OfferWithListing } from "@/lib/data/offers";

const PUBLIC_SEGMENT = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes" } as const;

export function OfferCard({ offer, locale }: { offer: OfferWithListing; locale: string }) {
  const t = useTranslations("home");
  const discountLabel = formatOfferDiscount(offer);
  const href = `/${locale}/${PUBLIC_SEGMENT[offer.listingType]}/${offer.listingSlug}`;

  return (
    <Link
      href={href}
      className="group flex h-full w-full min-w-[260px] flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="relative h-36 shrink-0 overflow-hidden">
        {offer.coverImage ? (
          <Image
            src={offer.coverImage}
            alt={offer.title}
            fill
            sizes="(max-width: 767px) 80vw, 300px"
            className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
            <Tag size={30} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </div>
        )}
        {discountLabel && (
          <span className="absolute start-3 top-3 rounded-full bg-primary-700 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {discountLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 font-display text-base font-bold text-ink transition-colors group-hover:text-primary dark:text-white">
          {offer.title}
        </h3>
        <p className="line-clamp-1 text-xs font-medium text-ink/55 dark:text-sand/55">{offer.listingName}</p>
        {offer.endsAt && (
          <p className="mt-auto text-xs text-ink/45 dark:text-sand/45">{t("offerValidUntil", { date: offer.endsAt })}</p>
        )}
      </div>
    </Link>
  );
}
