import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n/config";
import { AuthForm } from "@/components/shared/auth-form";

export const metadata: Metadata = { title: "Sign In — Go Hargeisa" };

export default function LoginPage({ params: { locale } }: { params: { locale: Locale } }) {
  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-center">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-ink/60 dark:text-sand/60">
          Sign in to save favorites and manage your trips.
        </p>
        <div className="mt-8">
          <Suspense fallback={<div className="h-[196px]" />}>
            <AuthForm mode="login" locale={locale} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-ink/60 dark:text-sand/60">
          No account yet?{" "}
          <Link href={`/${locale}/auth/register`} className="font-semibold text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </section>
  );
}
