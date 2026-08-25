import { getTranslations } from "next-intl/server";
import { Crown } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { CTASection } from "@/components/shared/cta-section";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * Reusable "Interested in becoming a Premium Partner?" CTA — used on both
 * About and Join. Deliberately shows no pricing: the copy stays qualitative
 * and routes every interested business to the real /contact page, the same
 * mechanism the rest of the site already uses (no invented phone/WhatsApp).
 */
export async function PremiumPartnershipCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "premiumPartnership" });

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <CTASection tone="light" eyebrow={t("eyebrow")} icon={Crown} title={t("title")} subtitle={t("subtitle")}>
        <PrimaryButton href={`/${locale}/contact`}>{t("cta")}</PrimaryButton>
      </CTASection>
    </section>
  );
}
