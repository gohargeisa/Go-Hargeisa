import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getSiteSettings } from "@/lib/actions/settings";
import { SiteSettingsForm } from "@/components/admin/site-settings-form";

export const metadata: Metadata = { title: "Site Settings — Admin" };

export default async function AdminSettingsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/settings`);
  const t = await getTranslations({ locale, namespace: "admin" });
  const settings = await getSiteSettings();

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-2">{t("siteSettingsTitle")}</h1>
      <p className="mb-8 text-sm text-ink/60 dark:text-sand/60">{t("siteSettingsSubtitle")}</p>
      <SiteSettingsForm
        initial={{
          siteName: settings?.site_name ?? "",
          logoUrl: settings?.logo_url ?? "",
          faviconUrl: settings?.favicon_url ?? "",
          contactEmail: settings?.contact_email ?? "",
          contactPhone: settings?.contact_phone ?? "",
          whatsappNumber: settings?.whatsapp_number ?? "",
          socialFacebook: settings?.social_facebook ?? "",
          socialInstagram: settings?.social_instagram ?? "",
          socialTwitter: settings?.social_twitter ?? "",
          socialYoutube: settings?.social_youtube ?? "",
          socialTiktok: settings?.social_tiktok ?? "",
          footerText: settings?.footer_text ?? "",
        }}
      />
    </section>
  );
}
