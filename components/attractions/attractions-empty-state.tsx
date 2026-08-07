"use client";

import { useTranslations } from "next-intl";
import { Compass, Hotel, Home } from "lucide-react";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { Reveal } from "@/components/home/reveal";

export function AttractionsEmptyState({ locale }: { locale: string }) {
  const tp = useTranslations("attractionsPage");

  return (
    <Reveal>
      <div className="flex min-h-[26rem] flex-col items-center justify-center rounded-xl3 border border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.04] to-transparent px-6 py-16 text-center dark:bg-primary/[0.06]">
        <div className="relative flex h-32 w-32 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-primary/10" aria-hidden="true" />
          <span className="absolute inset-3 rounded-full bg-primary/10" aria-hidden="true" />
          <span className="absolute inset-7 flex items-center justify-center rounded-full bg-white shadow-soft dark:bg-ink">
            <Compass size={30} className="text-primary" aria-hidden="true" />
          </span>
        </div>

        <h2 className="mt-8 font-display text-2xl font-bold text-ink dark:text-white">{tp("emptyTitle")}</h2>
        <p className="mt-3 max-w-md text-balance text-sm leading-6 text-ink/60 dark:text-sand/60">
          {tp("emptyDescription")}
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <PrimaryButton href={`/${locale}`}>
            <Home size={16} aria-hidden="true" />
            {tp("emptyGoHome")}
          </PrimaryButton>
          <SecondaryButton href={`/${locale}/hotels`}>
            <Hotel size={16} aria-hidden="true" />
            {tp("emptyExploreHotels")}
          </SecondaryButton>
        </div>
      </div>
    </Reveal>
  );
}
