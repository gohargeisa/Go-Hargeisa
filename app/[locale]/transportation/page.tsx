import type { Metadata } from "next";
import { Plane, Car, Bus, ParkingCircle } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Getting Around Hargeisa — Transportation Guide",
  description: "How to get to and around Hargeisa: airport transfers, taxis, car rental and shared transport.",
    alternates: { canonical: `/${locale}/transportation` },
  };
}

const options = [
  { icon: Plane, title: "Airport Transfers", body: "Egal International Airport (HGA) is roughly 5 km from downtown. Most hotels can arrange a pickup; airport taxis are also readily available." },
  { icon: Car, title: "Private Taxis", body: "The most common way to get around. Agree on the fare before you get in, or ask your hotel to book a trusted driver." },
  { icon: Bus, title: "Shared Minibuses", title2: "", body: "Shared minibuses run fixed routes across the city and are the cheapest option, though schedules are informal." },
  { icon: ParkingCircle, title: "Car Rental & Drivers", body: "Self-drive rentals are uncommon; most visitors hire a car with a driver for day trips outside the city, arranged through hotels or tour operators." },
];

export default function TransportationPage() {
  return (
    <>
      <PageHero
        eyebrow="Getting Around"
        title="Transportation"
        subtitle="How to move around Hargeisa comfortably and safely"
        image={placeholderImage("Transportation in Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto py-14 grid gap-5 sm:grid-cols-2">
        {options.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 text-sm text-ink/65 dark:text-sand/65 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>
    </>
  );
}
