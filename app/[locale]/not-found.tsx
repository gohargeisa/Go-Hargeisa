"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Compass } from "lucide-react";

export default function NotFound() {
  const t = useTranslations("errors");
  const locale = useLocale();

  return (
    <div className="container-px mx-auto flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Compass size={40} className="text-primary" />
      <h1 className="mt-4 font-display text-3xl font-semibold">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-ink/60 dark:text-sand/60">
        {t("notFoundDescription")}
      </p>
      <Link
        href={`/${locale}`}
        className="mt-6 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
      >
        {t("backToHomepage")}
      </Link>
    </div>
  );
}
