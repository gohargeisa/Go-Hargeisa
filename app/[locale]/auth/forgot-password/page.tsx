import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/shared/forgot-password-form";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Reset Password — Go Hargeisa" };

export default async function ForgotPasswordPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl3 border border-ink/8 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-center font-display text-3xl font-bold">{t("resetPasswordTitle")}</h1>
        <p className="mt-3 text-center text-sm text-ink/60 dark:text-sand/60">
          {t("resetPasswordSubtitle")}
        </p>
        <div className="mt-8"><ForgotPasswordForm locale={locale} /></div>
      </div>
    </section>
  );
}
