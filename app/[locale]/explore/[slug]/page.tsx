import { notFound } from "next/navigation";
import Image from "next/image";
import { getDestinationBySlug, getDestinations } from "@/lib/data/destinations";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getAttractions } from "@/lib/data/attractions";
import { ListingCard } from "@/components/shared/listing-card";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ slug: d.slug }));
}

export default async function DestinationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const [hotels, restaurants, attractions] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getAttractions(),
  ]);

  return (
    <>
      <section className="relative h-72 md:h-96 w-full overflow-hidden">
        <Image src={destination.image} alt={destination.name} fill priority className="object-cover" />
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center container-px text-center text-white">
          <h1 className="font-display text-3xl md:text-4xl font-semibold">{destination.name}</h1>
          <p className="mt-2 max-w-xl text-white/85">{destination.description}</p>
        </div>
      </section>

      <section className="container-px mx-auto py-14 space-y-14">
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Hotels nearby</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.slice(0, 3).map((h) => (
              <ListingCard key={h.id} href={`/${locale}/hotels/${h.slug}`} image={h.coverImage} title={h.name} subtitle={h.address} rating={h.rating} reviewCount={h.reviewCount} priceRange={h.priceRange} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Places to eat</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.slice(0, 3).map((r) => (
              <ListingCard key={r.id} href={`/${locale}/restaurants/${r.slug}`} image={r.coverImage} title={r.name} subtitle={r.cuisine.join(" · ")} rating={r.rating} reviewCount={r.reviewCount} priceRange={r.priceRange} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Things to see</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.slice(0, 3).map((a) => (
              <ListingCard key={a.id} href={`/${locale}/attractions/${a.slug}`} image={a.coverImage} title={a.name} subtitle={a.address} rating={a.rating} reviewCount={a.reviewCount} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
