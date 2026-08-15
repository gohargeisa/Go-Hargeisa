import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { PrimaryButton } from "@/components/shared/buttons";

const BENEFIT_KEYS = [
  "benefitProfile",
  "benefitProducts",
  "benefitPrices",
  "benefitContact",
  "benefitDiscovery",
  "benefitBooking",
] as const;

/**
 * "Want your business on Go Hargeisa?" section — reuses the existing
 * /join registration flow entirely (components/shared/join-request-form.tsx
 * via app/[locale]/join/page.tsx), no new registration system. Rendered on
 * every restaurant/city-service/service detail page, not just the 4
 * showcase partners, so it's a real platform feature.
 */
export async function PartnerAcquisitionCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "partnerAcquisition" });

  return (
    <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
      <div className="container-px mx-auto max-w-3xl text-center">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("title")}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-sand/65 sm:text-base">
          {t("subtitle")}
        </p>

        <div className="mx-auto mt-8 grid max-w-xl gap-3 text-start sm:grid-cols-2">
          {BENEFIT_KEYS.map((key) => (
            <div key={key} className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span className="text-sm text-ink/75 dark:text-sand/75">{t(key)}</span>
            </div>
          ))}
        </div>

        <div className="mt-9">
          <PrimaryButton href={`/${locale}/join`} size="lg">
            {t("cta")}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
