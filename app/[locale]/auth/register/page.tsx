import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { OAuth } from "@/components/shared/oauth";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = {
  title: "Create an Account — Go Hargeisa",
};

export default async function RegisterPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl3 border border-ink/8 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-center font-display text-3xl font-bold">
          {t("registerTitle")}
        </h1>

        <p className="mt-3 text-center text-sm text-ink/60 dark:text-sand/60">
          {t("registerSubtitle")}
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-[380px]" />}>
            <AuthForm mode="register" locale={locale} />
          </Suspense>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink/70 dark:text-sand/70">
          <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          {t("or")}
          <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
        </div>

        <Suspense fallback={<div className="h-[52px]" />}>
          <OAuth mode="register" locale={locale} />
        </Suspense>

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-sand/60">
          {t("alreadyHaveAccount")}{" "}
          <Link href={`/${locale}/auth/login`} className="font-semibold text-primary-700 hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </div>
    </section>
  );
}
