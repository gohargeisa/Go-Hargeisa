"use client";

import { useState } from "react";
import { Heart, MapIcon, MessageSquare, User, Bell } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SavedTripsPanel } from "@/components/dashboard/saved-trips-panel";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";
import type { SavedTrip } from "@/lib/data/saved-trips";
import type { MyReview } from "@/lib/data/reviews";

type FavoriteEntry = {
  kind: "hotel" | "restaurant" | "cafe" | "attraction";
  item: { id: string; slug: string; name: string; address: string; coverImage: string; rating: number; reviewCount: number };
};

const hrefKind: Record<string, string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
};

const tabs = [
  { key: "favorites", icon: Heart, label: "Favorite Places" },
  { key: "trips", icon: MapIcon, label: "Saved Trips" },
  { key: "reviews", icon: MessageSquare, label: "My Reviews" },
  { key: "profile", icon: User, label: "Profile" },
  { key: "notifications", icon: Bell, label: "Notifications" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function DashboardTabs({
  locale,
  userId,
  email,
  favorites,
  trips,
  reviews,
  userName,
  avatarUrl,
}: {
  locale: Locale;
  userId: string;
  email: string;
  favorites: FavoriteEntry[];
  trips: SavedTrip[];
  reviews: MyReview[];
  userName: string;
  avatarUrl: string;
}) {
  const [active, setActive] = useState<TabKey>("favorites");

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav className="flex lg:flex-col gap-1 overflow-x-auto" aria-label="Dashboard sections">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            aria-current={active === key ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium text-start transition-colors ${
              active === key
                ? "bg-primary/10 text-primary"
                : "text-ink/65 dark:text-sand/65 hover:bg-ink/5 dark:hover:bg-white/5"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </nav>

      <div>
        {active === "favorites" && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">Favorite Places</h2>
            {favorites.length === 0 ? (
              <p className="text-sm text-ink/50 dark:text-sand/50">
                You haven't saved any favorites yet. Tap the heart on a hotel, restaurant, cafe or
                attraction to save it here.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favorites.map(({ kind, item }) => (
                  <ListingCard
                    key={item.id}
                    href={`/${locale}/${hrefKind[kind]}/${item.slug}`}
                    image={item.coverImage}
                    title={item.name}
                    subtitle={item.address}
                    rating={item.rating}
                    reviewCount={item.reviewCount}
                    listingType={kind}
                    listingId={item.id}
                    initiallyFavorited
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {active === "trips" && <SavedTripsPanel locale={locale} trips={trips} />}

        {active === "reviews" && <ReviewsPanel locale={locale} reviews={reviews} />}

        {active === "profile" && (
          <ProfilePanel
            locale={locale}
            userId={userId}
            email={email}
            initialName={userName}
            initialAvatar={avatarUrl}
          />
        )}

        {active === "notifications" && (
          <div>
            <h2 className="font-display text-lg font-semibold mb-4">Notifications</h2>
            <p className="text-sm text-ink/50 dark:text-sand/50">
              You're all caught up — notification preferences are coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
