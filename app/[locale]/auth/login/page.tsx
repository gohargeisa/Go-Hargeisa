import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { OAuth } from "@/components/shared/oauth";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = {
  title: "Sign In — Go Hargeisa",
};

export default async function LoginPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { error?: string; next?: string };
}) {
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl3 border border-ink/8 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-center font-display text-3xl font-bold">
          {t("welcomeTitle")}
        </h1>

        <p className="mt-3 text-center text-sm text-ink/60 dark:text-sand/60">
          {t("welcomeSubtitle")}
        </p>

        {searchParams.error === "auth_failed" && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {t("invalidLink")}
          </div>
        )}

        <div className="mt-8">
          <Suspense fallback={<div className="h-[300px]" />}>
            <AuthForm mode="login" locale={locale} />
          </Suspense>
        </div>

        <p className="mt-3 text-end text-sm">
          <Link href={`/${locale}/auth/forgot-password`} className="text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </p>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink/40 dark:text-sand/40">
          <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          {t("or")}
          <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
        </div>

        <Suspense fallback={<div className="h-[52px]" />}>
          <OAuth mode="login" locale={locale} />
        </Suspense>

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-sand/60">
          {t("dontHaveAccount")}{" "}
          <Link href={`/${locale}/auth/register`} className="font-semibold text-primary hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </div>
    </section>
  );
}
