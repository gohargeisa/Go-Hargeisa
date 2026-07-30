import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/components/shared/reset-password-form";
import type { Locale } from "@/lib/i18n/config";

export const metadata: Metadata = { title: "Choose a New Password — Go Hargeisa" };

export default async function ResetPasswordPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <section className="container-px mx-auto flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm rounded-xl3 border border-ink/8 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h1 className="text-center font-display text-3xl font-bold">{t("newPasswordTitle")}</h1>
        <div className="mt-8"><ResetPasswordForm locale={locale} /></div>
      </div>
    </section>
  );
}
