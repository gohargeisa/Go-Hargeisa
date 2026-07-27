import { getTranslations } from "next-intl/server";
import { LifeBuoy } from "lucide-react";
import { ContactSupportButton } from "./contact-support-button";

export async function SupportCard({ ownerName, ownerEmail }: { ownerName: string; ownerEmail: string }) {
  const t = await getTranslations("businessDashboard");

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center dark:bg-primary/10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink">
        <LifeBuoy size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-3 font-display text-base font-bold">{t("needHelp")}</h3>
      <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("supportCardDescription")}</p>
      <ContactSupportButton
        ownerName={ownerName}
        ownerEmail={ownerEmail}
        defaultSubject="Business Dashboard Support"
        label={t("contactSupport")}
        className="mt-4 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
      />
    </div>
  );
}
