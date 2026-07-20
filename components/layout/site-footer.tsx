import Link from "next/link";
import { useTranslations } from "next-intl";
import { Compass, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

export function SiteFooter({ locale }: { locale: Locale }) {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const exploreLinks = [
    ["hotels", "hotels"],
    ["restaurants", "restaurants"],
    ["cafes", "cafes"],
    ["attractions", "attractions"],
    ["events", "events"],
  ] as const;

  const companyLinks = [
    ["about", "about"],
    ["blog", "blog"],
    ["contact", "contact"],
  ] as const;

  const supportLinks = [
    ["travelGuide", "travel-guide"],
    ["transportation", "transportation"],
  ] as const;

  return (
    <footer className="mt-24 border-t border-ink/10 dark:border-white/10 bg-white dark:bg-ink/60">
      <div className="container-px mx-auto grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <Link href={`/${locale}`} className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
              <Compass size={18} />
            </span>
            Go Hargeisa
          </Link>
          <p className="mt-4 max-w-xs text-sm text-ink/60 dark:text-sand/60">{t("tagline")}</p>
          <div className="mt-5 flex gap-3">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a
                key={i}
                href="#"
                aria-label="Social link"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary transition-colors"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title={t("explore")} links={exploreLinks} locale={locale} nav={nav} />
        <FooterCol title={t("company")} links={companyLinks} locale={locale} nav={nav} />
        <FooterCol title={t("support")} links={supportLinks} locale={locale} nav={nav} />
      </div>

      <div className="border-t border-ink/10 dark:border-white/10">
        <div className="container-px mx-auto flex flex-col md:flex-row items-center justify-between gap-3 py-6 text-xs text-ink/50 dark:text-sand/50">
          <p>&copy; {new Date().getFullYear()} Go Hargeisa. {t("rights")}</p>
          <div className="flex gap-5">
            <Link href={`/${locale}/privacy`}>{t("privacy")}</Link>
            <Link href={`/${locale}/terms`}>{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  locale,
  nav,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
  locale: Locale;
  nav: ReturnType<typeof useTranslations>;
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-ink/80 dark:text-sand/80">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([key, href]) => (
          <li key={key}>
            <Link
              href={`/${locale}/${href}`}
              className="text-sm text-ink/60 dark:text-sand/60 hover:text-primary transition-colors"
            >
              {nav(key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
