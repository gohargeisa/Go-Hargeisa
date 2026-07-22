import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/shared/forgot-password-form";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Reset Password — Go Hargeisa" };

export default function ForgotPasswordPage({ params: { locale } }: { params: { locale: Locale } }) {
  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-3xl font-bold">Reset your password</h1>
        <p className="mt-3 text-center text-sm text-ink/60 dark:text-sand/60">
          Enter your email address and we&apos;ll send you a reset link.
        </p>
        <div className="mt-8"><ForgotPasswordForm locale={locale} /></div>
      </div>
    </section>
  );
}
