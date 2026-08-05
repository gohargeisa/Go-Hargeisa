"use client";

import { useTranslations, useLocale } from "next-intl";
import { Compass } from "lucide-react";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

export default function NotFound() {
  const t = useTranslations("errors");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <AnimatedBackground variant="light" />

      <div className="container-px relative mx-auto flex justify-center">
        <div className="flex flex-col items-center rounded-xl3 border border-ink/8 bg-white/80 px-8 py-10 text-center shadow-premium-lg backdrop-blur-xl dark:border-white/10 dark:bg-ink/70 sm:px-14 sm:py-14">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
            <Compass size={32} aria-hidden="true" />
          </span>

          <h1 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">{t("notFoundTitle")}</h1>
          <p className="mt-3 max-w-sm text-ink/60 dark:text-sand/60">{t("notFoundDescription")}</p>

          <PrimaryButton href={`/${locale}`} size="lg" className="mt-8">
            {t("backToHomepage")}
          </PrimaryButton>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            <SecondaryButton href={`/${locale}/hotels`} size="sm">
              {tNav("hotels")}
            </SecondaryButton>
            <SecondaryButton href={`/${locale}/explore`} size="sm">
              {tNav("explore")}
            </SecondaryButton>
            <SecondaryButton href={`/${locale}/contact`} size="sm">
              {tNav("contact")}
            </SecondaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
