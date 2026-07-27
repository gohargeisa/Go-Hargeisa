"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { RefreshCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    // Log error only in development
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="container-px mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-semibold">{t("title")}</h1>
      <p className="mt-2 max-w-sm text-ink/60 dark:text-sand/60">
        {t("description")}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
      >
        <RefreshCcw size={15} /> {t("tryAgain")}
      </button>
    </div>
  );
}
