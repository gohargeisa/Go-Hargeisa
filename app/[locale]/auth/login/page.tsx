import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n/config";
import { AuthForm } from "@/components/shared/auth-form";
import { OAuth } from "@/components/shared/oauth";

export const metadata: Metadata = {
  title: "Sign In — Go Hargeisa",
};

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-3xl font-bold">
          Welcome to Go Hargeisa
        </h1>

        <p className="mt-3 text-center text-sm text-ink/60 dark:text-sand/60">
          Sign in with your email address to continue.
        </p>

        <div className="mt-8 space-y-6">
          <Suspense fallback={<div className="h-[240px]" />}>
            <AuthForm mode="login" locale={locale} />
          </Suspense>

          <Suspense fallback={<div className="h-[160px]" />}>
            <OAuth mode="login" locale={locale} />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-sm text-ink/60 dark:text-sand/60">
          <Link href={`/${locale}/auth/forgot-password`} className="font-semibold text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
      </div>
    </section>
  );
}
