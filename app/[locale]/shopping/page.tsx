import type { Metadata } from "next";
import { PageHero } from "@/components/shared/page-hero";
import { ListingCard } from "@/components/shared/listing-card";
import { getAttractions } from "@/lib/data/attractions";
import { placeholderImage } from "@/lib/placeholder-image";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Shopping in Hargeisa — Markets & Malls",
  description: "Where to shop in Hargeisa: Waheen Market, gold souks and modern shopping centers.",
    alternates: { canonical: `/${locale}/shopping` },
  };
}

export default async function ShoppingPage({ params: { locale } }: { params: { locale: string } }) {
  const shoppingSpots = await getAttractions({ category: "market" });

  return (
    <>
      <PageHero
        eyebrow="Shop"
        title="Shopping in Hargeisa"
        subtitle="From the historic Waheen Market to modern shopping centers"
        image={placeholderImage("Shopping in Hargeisa", { tone: "accent" })}
      />
      <section className="container-px mx-auto py-14">
        {shoppingSpots.length === 0 ? (
          <p className="text-center text-ink/50 dark:text-sand/50">No shopping listings yet — check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shoppingSpots.map((s) => (
              <ListingCard
                key={s.id}
                href={`/${locale}/attractions/${s.slug}`}
                image={s.coverImage}
                title={s.name}
                subtitle={s.address}
                rating={s.rating}
                reviewCount={s.reviewCount}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
