import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { FaTiktok, FaWhatsapp } from "react-icons/fa6";
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
  const socialLinks = [
  {
    icon: FaWhatsapp,
    href: "https://wa.me/252656156752",
    label: "WhatsApp",
  },
  {
    icon: Instagram,
    href: "https://instagram.com/go.hargeisa",
    label: "Instagram",
  },
  {
    icon: FaTiktok,
    href: "https://www.tiktok.com/@gohargeisa",
    label: "TikTok",
  },
  {
    icon: Facebook,
    href: "https://facebook.com/Go.Hargeisa",
    label: "Facebook",
  },
  {
    icon: Youtube,
    href: "https://youtube.com/@Go.Hargeisa",
    label: "YouTube",
  },
];
    

  return (
    <footer className="mt-24 border-t border-ink/10 dark:border-white/10 bg-gradient-to-b from-white to-slate-50 dark:from-[#071321] dark:to-[#020817]">
      <div className="container-px mx-auto grid grid-cols-2 gap-10 py-16 md:grid-cols-5">
        <div className="col-span-2">
          <Image
  src="/images/logo.png"
  alt="Go Hargeisa"
  width={280}
  height={110}
  priority
  className="mb-6 h-auto w-auto transition-transform duration-300 hover:scale-105"
/>
          <p className="max-w-sm leading-7 text-sm text-ink/60 dark:text-sand/60">
  {t("tagline")}
</p>
          <div className="mt-5 flex gap-3">
  {socialLinks.map(({ icon: Icon, href, label }, i) => (
  <a
    key={i}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={label}
    className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 dark:border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-white"
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
  <div className="container-px mx-auto flex flex-col items-center gap-4 py-6 md:flex-row md:justify-between">

    <p className="text-xs text-ink/50 dark:text-sand/50">
      &copy; {new Date().getFullYear()} Go Hargeisa. {t("rights")}
    </p>

    <div className="flex gap-5 text-xs text-ink/50 dark:text-sand/50">
      <Link href={`/${locale}/privacy`}>
        {t("privacy")}
      </Link>

      <Link href={`/${locale}/terms`}>
        {t("terms")}
      </Link>
    </div>

  </div>

  <div className="border-t border-ink/10 dark:border-white/10 py-6 text-center">
    <p className="text-sm text-ink/60 dark:text-sand/60">
  Made with <span className="text-red-500">❤</span> by{" "}
  <span className="font-semibold text-primary hover:underline">
    Yaseen
  </span>
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
      <h4 className="font-display text-base font-bold uppercase tracking-wide text-ink/80 dark:text-sand/80">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([key, href]) => (
          <li key={key}>
            <Link
              href={`/${locale}/${href}`}
              className="text-sm text-ink/60 dark:text-sand/60 transition-all duration-300 hover:translate-x-1 hover:text-primary"
            >
              {nav(key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
