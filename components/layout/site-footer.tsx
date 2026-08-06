import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { WhatsAppIcon, XIcon, TikTokIcon } from "@/components/shared/brand-icons";
import type { Locale } from "@/lib/i18n/config";

export function SiteFooter({
  locale,
  logoUrl,
  footerText,
  contactEmail,
  contactPhone,
  whatsappNumber,
  socialFacebook,
  socialInstagram,
  socialTwitter,
  socialYoutube,
  socialTiktok,
}: {
  locale: Locale;
  /** All of these are admin-editable overrides from site_settings — each falls back to the existing hardcoded default when unset, so an empty settings row changes nothing. */
  logoUrl?: string;
  footerText?: string;
  contactEmail?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialTiktok?: string;
}) {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  const exploreLinks = [
    ["hotels", "hotels"],
    ["restaurants", "restaurants"],
    ["cafes", "cafes"],
    ["attractions", "attractions"],
  ] as const;

  const companyLinks = [
    ["about", "about"],
    ["blog", "blog"],
    ["contact", "contact"],
    ["listYourBusiness", "join"],
  ] as const;

  const supportLinks = [
    ["travelGuide", "travel-guide"],
    ["transportation", "transportation"],
  ] as const;

  const socialLinks = [
    {
      icon: WhatsAppIcon,
      href: whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^\d]/g, "")}` : "https://wa.me/252656156752",
      label: "WhatsApp",
      // Official WhatsApp brand green for the resting icon color only —
      // `:not(:hover)` (rather than a plain `text-[#25D366]`) sidesteps
      // Tailwind's undefined same-specificity cascade order between it and
      // the shared `hover:text-white` below, which otherwise risks the
      // arbitrary-color class silently losing and leaving the icon white
      // on white in the resting state.
      iconClassName: "[&:not(:hover)]:text-[#25D366]",
    },
    { icon: Facebook, href: socialFacebook || "https://facebook.com/Go.Hargeisa", label: "Facebook" },
    { icon: Instagram, href: socialInstagram || "https://instagram.com/go.hargeisa", label: "Instagram" },
    { icon: XIcon, href: socialTwitter || "https://x.com/go_hargeisa", label: "X" },
    { icon: TikTokIcon, href: socialTiktok || "https://www.tiktok.com/@gohargeisa", label: "TikTok" },
    { icon: Youtube, href: socialYoutube || "https://youtube.com/@go.hargeisa", label: "YouTube" },
  ];

  return (
    <footer className="mt-24 border-t border-ink/10 bg-gradient-to-b from-white to-slate-50 pb-[max(6rem,calc(4.5rem+env(safe-area-inset-bottom)))] dark:border-white/10 dark:from-[#071321] dark:to-[#020817] lg:pb-0">
      <div className="container-px mx-auto grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-5 md:gap-x-10 lg:gap-x-12 lg:py-20">
        <div className="col-span-2">
          <Image
            src={logoUrl || "/images/logo.png"}
            alt="Go Hargeisa"
            width={280}
            height={110}
            loading="lazy"
            className="mb-6 h-auto w-auto transition-transform duration-300 ease-premium hover:scale-105"
          />
          <p className="max-w-sm text-sm leading-7 text-ink/60 dark:text-sand/60">{footerText || t("tagline")}</p>
          {(contactEmail || contactPhone) && (
            <p className="mt-3 space-y-0.5 text-sm text-ink/60 dark:text-sand/60">
              {contactEmail && <a href={`mailto:${contactEmail}`} className="block hover:text-primary">{contactEmail}</a>}
              {contactPhone && <a href={`tel:${contactPhone}`} className="block hover:text-primary">{contactPhone}</a>}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2.5">
            {socialLinks.map(({ icon: Icon, href, label, iconClassName }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_10px_20px_rgba(245,158,11,0.3)] active:scale-90 dark:border-white/10 dark:bg-white/5${iconClassName ? ` ${iconClassName}` : ""}`}
              >
                <Icon size={17} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol title={t("explore")} links={exploreLinks} locale={locale} nav={nav} />
        <FooterCol title={t("company")} links={companyLinks} locale={locale} nav={nav} />
        <FooterCol title={t("support")} links={supportLinks} locale={locale} nav={nav} />
      </div>

      <div className="border-t border-ink/10 dark:border-white/10">
        <div className="container-px mx-auto flex flex-col items-center gap-4 py-7 md:flex-row md:justify-between">
          <p className="text-xs text-ink/50 dark:text-sand/50">
            &copy; {new Date().getFullYear()} Go Hargeisa. {t("rights")}
          </p>

          <div className="flex gap-6 text-xs text-ink/50 dark:text-sand/50">
            <Link href={`/${locale}/privacy`} className="transition-colors hover:text-primary">
              {t("privacy")}
            </Link>
            <Link href={`/${locale}/terms`} className="transition-colors hover:text-primary">
              {t("terms")}
            </Link>
          </div>
        </div>

        <div className="border-t border-ink/10 py-6 text-center dark:border-white/10">
          <p className="text-sm text-ink/60 dark:text-sand/60">
            Made with <span className="text-red-500">❤</span> by{" "}
            <span className="font-semibold text-primary hover:underline">Yaseen</span>
          </p>
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
      <h4 className="font-display text-sm font-bold uppercase tracking-[0.1em] text-ink/80 dark:text-sand/80">{title}</h4>
      <ul className="mt-5 space-y-3">
        {links.map(([key, href]) => (
          <li key={key}>
            <Link
              href={`/${locale}/${href}`}
              className="text-sm text-ink/60 transition-all duration-300 ease-premium hover:translate-x-1 hover:text-primary dark:text-sand/60"
            >
              {nav(key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
