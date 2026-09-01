import Image from "next/image";
import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyOffer } from "@/lib/loyalty/types";
import { offerTitle, offerDescription, offerBadge } from "@/lib/loyalty/helpers";

export function OffersRow({
  locale,
  offers,
  accentColor,
}: {
  locale: Locale;
  offers: LoyaltyOffer[];
  accentColor: string | null;
}) {
  const t = useTranslations("loyalty");
  if (offers.length === 0) return null;

  return (
    <section aria-labelledby="loyalty-offers-heading">
      <h2 id="loyalty-offers-heading" className="mb-3 font-display text-lg font-semibold">
        {t("offersHeading")}
      </h2>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {offers.map((offer) => {
          const badge = offerBadge(offer, locale);
          return (
            <article
              key={offer.id}
              className="relative flex w-[76%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:w-[46%] lg:w-[31%]"
            >
              {offer.imageUrl ? (
                <div className="relative aspect-[16/9] w-full">
                  <Image src={offer.imageUrl} alt="" fill sizes="320px" className="object-cover" />
                </div>
              ) : (
                <div
                  className="flex aspect-[16/9] w-full items-center justify-center"
                  style={{ background: (accentColor ?? "#7c3f5d") + "1A" }}
                >
                  <Tag size={22} aria-hidden="true" style={{ color: accentColor ?? undefined }} />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                {badge && (
                  <span
                    className="mb-2 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{
                      backgroundColor: (accentColor ?? "#7c3f5d") + "1F",
                      color: accentColor ?? undefined,
                    }}
                  >
                    {badge}
                  </span>
                )}
                <p className="font-display text-sm font-semibold">{offerTitle(offer, locale)}</p>
                {offerDescription(offer, locale) && (
                  <p className="mt-1 text-xs leading-5 text-ink/55 dark:text-sand/55">
                    {offerDescription(offer, locale)}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
