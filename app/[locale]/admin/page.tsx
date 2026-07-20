import type { Metadata } from "next";
import Link from "next/link";
import {
  Hotel, UtensilsCrossed, Coffee, Landmark, CalendarDays, Newspaper,
  Users, BarChart3, ImageIcon,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getEvents } from "@/lib/data/events";
import { getArticles } from "@/lib/data/articles";

export const metadata: Metadata = { title: "Admin Dashboard — Go Hargeisa" };

export default async function AdminDashboardPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin`);

  const [hotels, restaurants, cafes, attractions, events, articles] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getCafes(),
    getAttractions(),
    getEvents(),
    getArticles(),
  ]);

  const stats = [
    { label: "Hotels", value: hotels.length, icon: Hotel, href: "hotels" },
    { label: "Restaurants", value: restaurants.length, icon: UtensilsCrossed, href: "restaurants" },
    { label: "Cafes", value: cafes.length, icon: Coffee, href: "cafes" },
    { label: "Attractions", value: attractions.length, icon: Landmark, href: "attractions" },
    { label: "Events", value: events.length, icon: CalendarDays, href: "events" },
    { label: "Articles", value: articles.length, icon: Newspaper, href: "articles" },
  ];

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-ink/60 dark:text-sand/60">Manage all Go Hargeisa content.</p>
        </div>
        <Link
          href={`/${locale}/admin/users`}
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-ink/15 dark:border-white/20 px-4 py-2 text-sm font-semibold"
        >
          <Users size={15} /> Manage Users
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={`/${locale}/admin/${href}`}
            className="flex items-center justify-between rounded-xl2 border border-ink/8 dark:border-white/10 p-6 hover:border-primary/40 transition-colors"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {label}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <BarChart3 size={18} className="text-primary" /> Analytics
          </h2>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            Connect an analytics table (e.g. page views, listing clicks) to populate real charts here. For
            now this is a placeholder panel.
          </p>
        </div>
        <div className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ImageIcon size={18} className="text-primary" /> Image Uploads
          </h2>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            Uploads go to the <code>listing-images</code> Supabase Storage bucket (created by{" "}
            <code>supabase/schema.sql</code>). See <code>/admin/hotels/new</code> for a working example.
          </p>
        </div>
      </div>
    </section>
  );
}
