import type { Metadata } from "next";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n/config";
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
          Continue with your Google account to access Go Hargeisa.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="h-[160px]" />}>
            <OAuth mode="login" locale={locale} />
          </Suspense>
        </div>
      </div>
    </section>
  );
}