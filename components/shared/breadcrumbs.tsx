import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Home } from "lucide-react";
import { safeJsonLd } from "@/lib/utils/json-ld";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href,
    })),
  };

  return (
    <nav aria-label={t("breadcrumbAriaLabel")} className="container-px mx-auto pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink/70 dark:text-sand/70">
        <li className="flex items-center gap-1.5">
          <Link
            href={items[0]?.href.split("/").slice(0, 2).join("/") || "/"}
            aria-label={tNav("home")}
            className="hover:text-primary"
          >
            <Home size={12} aria-hidden="true" />
          </Link>
          <ChevronRight size={12} className="rtl:rotate-180" />
        </li>
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1.5">
            {i === items.length - 1 ? (
              <span className="font-medium text-ink/70 dark:text-sand/70">{item.label}</span>
            ) : (
              <>
                <Link href={item.href} className="hover:text-primary">
                  {item.label}
                </Link>
                <ChevronRight size={12} className="rtl:rotate-180" />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
