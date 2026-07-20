import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
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
    <nav aria-label="Breadcrumb" className="container-px mx-auto pt-5">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink/50 dark:text-sand/50">
        <li className="flex items-center gap-1.5">
          <Link href={items[0]?.href.split("/").slice(0, 2).join("/") || "/"} className="hover:text-primary">
            <Home size={12} />
          </Link>
          <ChevronRight size={12} />
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
                <ChevronRight size={12} />
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
