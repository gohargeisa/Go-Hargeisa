import { SectionHeader } from "@/components/shared/section-header";
import { ScrollRow } from "@/components/shared/scroll-row";
import { ListingCard } from "@/components/shared/listing-card";

export interface ListingRowItem {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  tag?: string;
  priceRange?: string;
}

export function ListingRowSection({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  items,
  tone = "sand",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: ListingRowItem[];
  tone?: "sand" | "white";
}) {
  return (
    <section className={`py-16 md:py-20 ${tone === "white" ? "bg-white dark:bg-white/[0.03]" : ""}`}>
      <div className="container-px mx-auto">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
        />
        <ScrollRow>
          {items.map((item) => (
            <ListingCard key={item.href} {...item} />
          ))}
        </ScrollRow>
      </div>
    </section>
  );
}
