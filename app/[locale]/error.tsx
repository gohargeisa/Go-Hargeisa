"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RefreshCcw, TriangleAlert } from "lucide-react";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PrimaryButton } from "@/components/shared/buttons";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  const locale = useLocale();

  useEffect(() => {
    // Log error only in development
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <AnimatedBackground variant="light" />

      <div className="container-px relative mx-auto flex justify-center">
        <div className="flex flex-col items-center rounded-xl3 border border-ink/8 bg-white/80 px-8 py-10 text-center shadow-premium-lg backdrop-blur-xl dark:border-white/10 dark:bg-ink/70 sm:px-14 sm:py-14">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-soft">
            <TriangleAlert size={32} aria-hidden="true" />
          </span>

          <h1 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">{t("title")}</h1>
          <p className="mt-3 max-w-sm text-ink/60 dark:text-sand/60">{t("description")}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            <PrimaryButton onClick={reset} size="lg">
              <RefreshCcw size={15} aria-hidden="true" /> {t("tryAgain")}
            </PrimaryButton>
          </div>

          <a
            href={`/${locale}`}
            className="mt-4 text-sm font-semibold text-ink/60 underline-offset-4 hover:text-primary hover:underline dark:text-sand/60"
          >
            {t("backToHomepage")}
          </a>
        </div>
      </div>
    </div>
  );
}
