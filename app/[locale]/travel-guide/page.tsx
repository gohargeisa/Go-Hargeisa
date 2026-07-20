import type { Metadata } from "next";
import {
  Stamp, Plane, Bus, Coins, ShieldAlert, PhoneCall, Wifi,
  Users, Sun, Backpack, HelpCircle,
} from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { placeholderImage } from "@/lib/placeholder-image";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Hargeisa Travel Guide — Visa, Safety, Transport & More",
  description: "Everything you need to know before visiting Hargeisa: visa requirements, airport guide, currency, safety tips and more.",
    alternates: { canonical: `/${locale}/travel-guide` },
  };
}

const sections = [
  {
    icon: Stamp,
    title: "Visa Information",
    body: "Most nationalities can obtain a Somaliland visa on arrival at Egal International Airport (HGA), or in advance from a Somaliland representative office abroad. Bring two passport photos and pay the fee in USD.",
  },
  {
    icon: Plane,
    title: "Airport Guide",
    body: "Egal International Airport (HGA) sits about 5 km from the city center. Taxis and hotel shuttles are available outside arrivals; agree on a fare before departing.",
  },
  {
    icon: Bus,
    title: "Transportation",
    body: "Shared and private taxis are the main way to get around the city. Ride-hailing apps are limited, so hotels can arrange trusted drivers for day trips and airport transfers.",
  },
  {
    icon: Coins,
    title: "Currency",
    body: "The Somaliland shilling (SLSH) is the local currency, though US dollars are widely accepted for hotels, larger purchases and taxis. Mobile money (Zaad, eDahab) is used everywhere, even in small shops.",
  },
  {
    icon: ShieldAlert,
    title: "Safety Tips",
    body: "Hargeisa is generally safe for visitors who take normal precautions. Dress modestly, avoid photographing government or military buildings, and check locally for the latest security guidance before travel.",
  },
  {
    icon: PhoneCall,
    title: "Emergency Numbers",
    body: "Police: 999 · Hargeisa Group Hospital: available via hotel front desk · Always keep your hotel's address and phone number with you.",
  },
  {
    icon: Wifi,
    title: "Internet & SIM Cards",
    body: "Local SIM cards (Telesom, Somtel) are inexpensive and easy to buy with a passport. Data coverage is solid in the city center; most hotels and cafes also offer WiFi.",
  },
  {
    icon: Users,
    title: "Local Customs",
    body: "Somaliland is a conservative Muslim society. Dress modestly, greet with your right hand, and expect Friday to be a rest day for many businesses.",
  },
  {
    icon: Sun,
    title: "Best Time to Visit",
    body: "November to February offers the coolest, most comfortable weather. The rainy season (April–May) can make travel outside the city harder.",
  },
  {
    icon: Backpack,
    title: "Packing Guide",
    body: "Light, modest clothing (long sleeves and trousers/long skirts recommended), a scarf for women, comfortable walking shoes, sun protection, and a universal power adapter.",
  },
];

const faqs = [
  {
    q: "Do I need a visa to visit Hargeisa?",
    a: "Most travelers can get a Somaliland visa on arrival at the airport, though it's worth checking current requirements for your nationality before you fly.",
  },
  {
    q: "Is Hargeisa safe for tourists?",
    a: "Hargeisa is considered one of the more stable and welcoming cities in the region, but as with any destination, it's wise to stay informed and use common-sense precautions.",
  },
  {
    q: "What language is spoken in Hargeisa?",
    a: "Somali is the primary language, with Arabic and English also widely understood, especially in hotels and among younger residents.",
  },
];

export default function TravelGuidePage() {
  return (
    <>
      <PageHero
        eyebrow="Plan Ahead"
        title="Hargeisa Travel Guide"
        subtitle="Practical information to help you plan a smooth trip"
        image={placeholderImage("Hargeisa Travel Guide", { tone: "secondary" })}
      />
      <section className="container-px mx-auto py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <h2 className="mt-4 font-display text-base font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm text-ink/65 dark:text-sand/65 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold mb-6">
            <HelpCircle size={22} className="text-secondary" /> Frequently Asked Questions
          </h2>
          <div className="divide-y divide-ink/8 dark:divide-white/10 rounded-xl2 border border-ink/8 dark:border-white/10">
            {faqs.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="cursor-pointer list-none font-semibold text-sm marker:content-none">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm text-ink/65 dark:text-sand/65">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
