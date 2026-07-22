import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/shared/reset-password-form";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Choose a New Password — Go Hargeisa" };

export default function ResetPasswordPage({ params: { locale } }: { params: { locale: Locale } }) {
  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-center font-display text-3xl font-bold">Choose a new password</h1>
        <div className="mt-8"><ResetPasswordForm locale={locale} /></div>
      </div>
    </section>
  );
}
