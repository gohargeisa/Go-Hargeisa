"use client";

import { useState } from "react";
import { Bell, Compass, Heart, MapIcon, MessageSquare, Sparkles, User } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SavedTripsPanel } from "@/components/dashboard/saved-trips-panel";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { MyReview } from "@/lib/data/reviews";

type FavoriteEntry = { kind: "hotel" | "restaurant" | "cafe" | "attraction"; item: { id: string; slug: string; name: string; address: string; coverImage: string; rating: number; reviewCount: number } };
const hrefKind: Record<FavoriteEntry["kind"], string> = { hotel: "hotels", restaurant: "restaurants", cafe: "cafes", attraction: "attractions" };
const tabs = [
  { key: "favorites", icon: Heart, label: "Favorite Places" }, { key: "trips", icon: MapIcon, label: "Saved Trips" },
  { key: "reviews", icon: MessageSquare, label: "My Reviews" }, { key: "profile", icon: User, label: "Profile" }, { key: "notifications", icon: Bell, label: "Notifications" },
] as const;
type TabKey = (typeof tabs)[number]["key"];

export function DashboardTabs({ locale, userId, email, favorites, trips, reviews, userName, avatarUrl }: {
  locale: Locale; userId: string; email: string; favorites: FavoriteEntry[]; trips: SavedTrip[];
  reviews: MyReview[]; userName: string; avatarUrl: string;
}) {
  const [active, setActive] = useState<TabKey>("favorites");
  const stats = [
    { label: "Saved places", value: favorites.length, icon: Heart, tone: "text-rose-500 bg-rose-500/10" },
    { label: "Planned trips", value: trips.length, icon: MapIcon, tone: "text-primary bg-primary/10" },
    { label: "Local reviews", value: reviews.length, icon: MessageSquare, tone: "text-secondary-700 bg-secondary/15" },
  ];

  return (
    <div className="mt-6 md:mt-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}><Icon size={17} /></div>
            <p className="mt-4 font-display text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="flex gap-1.5 overflow-x-auto rounded-2xl border border-ink/8 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.03] lg:flex-col lg:self-start" aria-label="Dashboard sections">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} type="button" onClick={() => setActive(key)} aria-current={active === key ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all ${active === key ? "bg-primary text-white shadow-sm" : "text-ink/65 hover:bg-primary/5 hover:text-primary dark:text-sand/65 dark:hover:bg-white/5"}`}>
              <Icon size={17} /> {label}
            </button>
          ))}
        </nav>

        <section className="min-h-[360px] rounded-2xl border border-ink/8 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] md:p-7">
          {active === "favorites" && <div>
            <div className="mb-6 flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your collection</p><h2 className="mt-1 font-display text-2xl font-semibold">Favorite places</h2></div><Heart size={22} className="text-primary" /></div>
            {favorites.length === 0 ? <EmptyState icon={Compass} title="Start your collection" description="Save hotels, restaurants, cafes, and attractions to return to them whenever you are planning." /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{favorites.map(({ kind, item }) => <ListingCard key={item.id} href={`/${locale}/${hrefKind[kind]}/${item.slug}`} image={item.coverImage} title={item.name} subtitle={item.address} rating={item.rating} reviewCount={item.reviewCount} listingType={kind} listingId={item.id} initiallyFavorited locale={locale} />)}</div>}
          </div>}
          {active === "trips" && <SavedTripsPanel locale={locale} trips={trips} />}
          {active === "reviews" && <ReviewsPanel locale={locale} reviews={reviews} />}
          {active === "profile" && <ProfilePanel locale={locale} userId={userId} email={email} initialName={userName} initialAvatar={avatarUrl} />}
          {active === "notifications" && <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Updates</p><h2 className="mt-1 font-display text-2xl font-semibold">Notifications</h2><div className="mt-6"><EmptyState icon={Sparkles} title="You’re all caught up" description="When local recommendations and trip updates are available, they will appear here." /></div></div>}
        </section>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: typeof Compass; title: string; description: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center dark:bg-primary/[0.08]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink"><Icon size={22} /></span><h3 className="mt-4 font-display text-xl font-semibold">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">{description}</p></div>;
}
