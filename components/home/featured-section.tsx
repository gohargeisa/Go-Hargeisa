import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BadgeCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { RatingBadge } from "@/components/shared/rating-badge";

interface FeaturedItem {
  href: string;
  image: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
}

export function FeaturedSection({ items, locale }: { items: FeaturedItem[]; locale: Locale }) {
  const t = useTranslations("home");

  return (
    <section className="container-px mx-auto py-16 md:py-20">
      <div className="mb-8">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          Verified
        </span>
        <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold">{t("featuredTitle")}</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center gap-4 overflow-hidden rounded-xl2 border border-ink/8 dark:border-white/10 bg-gradient-to-br from-primary/5 to-secondary/5 p-4"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2 ring-white dark:ring-ink">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <h3 className="font-display text-sm font-semibold truncate">{item.name}</h3>
                <BadgeCheck size={14} className="text-primary shrink-0" />
              </div>
              <p className="text-xs text-ink/55 dark:text-sand/55">{item.category}</p>
              <div className="mt-1.5">
                <RatingBadge rating={item.rating} reviewCount={item.reviewCount} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
