import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/lib/i18n/config";
import { AuthForm } from "@/components/shared/auth-form";
import { OAuth } from "@/components/shared/oauth";

export const metadata: Metadata = { title: "Create Account — Go Hargeisa" };

export default function RegisterPage({ params: { locale } }: { params: { locale: Locale } }) {
  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold text-center">Create your account</h1>
        <p className="mt-1 text-center text-sm text-ink/60 dark:text-sand/60">
          Save favorites, write reviews and plan trips.
        </p>
        <div className="mt-8 space-y-6">
          <Suspense fallback={<div className="h-[240px]" />}>
            <AuthForm mode="register" locale={locale} />
          </Suspense>

          <Suspense fallback={<div className="h-[160px]" />}>
            <OAuth mode="register" locale={locale} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-ink/60 dark:text-sand/60">
          Already have an account?{" "}
          <Link href={`/${locale}/auth/login`} className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
