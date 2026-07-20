-- ============================================================================
-- Go Hargeisa — Supabase / PostgreSQL Schema
-- Run this in the Supabase SQL editor (or `supabase db push`) on a fresh project.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('user', 'business_owner', 'admin');
create type price_range as enum ('$', '$$', '$$$', '$$$$');
create type attraction_category as enum ('landmark', 'museum', 'market', 'nature', 'religious');
create type event_category as enum ('cultural', 'national', 'business', 'sports', 'concert');
create type content_status as enum ('draft', 'published', 'archived');

-- ----------------------------------------------------------------------------
-- PROFILES (extends auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role user_role not null default 'user',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ----------------------------------------------------------------------------
-- SHARED: LOCALIZED TEXT PATTERN
-- Every listing table stores English text in the primary columns and
-- optional Arabic/Somali overrides in `_ar` / `_so` columns so the UI can
-- fall back gracefully when a translation hasn't been added yet.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- HOTELS
-- ----------------------------------------------------------------------------
create table hotels (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_ar text,
  name_so text,
  short_description text not null,
  description text not null,
  description_ar text,
  description_so text,
  cover_image text not null,
  gallery jsonb not null default '[]',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  price_range price_range not null default '$$',
  amenities text[] not null default '{}',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  status content_status not null default 'published',
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RESTAURANTS
-- ----------------------------------------------------------------------------
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_ar text,
  name_so text,
  short_description text not null,
  description text not null,
  cover_image text not null,
  gallery jsonb not null default '[]',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  website text,
  cuisine text[] not null default '{}',
  price_range price_range not null default '$$',
  opening_hours text,
  menu jsonb not null default '[]', -- [{name, price, description}]
  reservable boolean not null default false,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  status content_status not null default 'published',
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- CAFES
-- ----------------------------------------------------------------------------
create table cafes (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_ar text,
  name_so text,
  short_description text not null,
  description text not null,
  cover_image text not null,
  gallery jsonb not null default '[]',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  special_drinks text[] not null default '{}',
  wifi boolean not null default true,
  working_space boolean not null default false,
  opening_hours text,
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  status content_status not null default 'published',
  owner_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ATTRACTIONS
-- ----------------------------------------------------------------------------
create table attractions (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  name_ar text,
  name_so text,
  short_description text not null,
  description text not null,
  cover_image text not null,
  gallery jsonb not null default '[]',
  address text not null,
  lat double precision not null,
  lng double precision not null,
  history text,
  best_time_to_visit text,
  entry_fee text not null default 'Free',
  visitor_tips text[] not null default '{}',
  category attraction_category not null default 'landmark',
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  featured boolean not null default false,
  status content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table attraction_nearby_restaurants (
  attraction_id uuid references attractions(id) on delete cascade,
  restaurant_id uuid references restaurants(id) on delete cascade,
  primary key (attraction_id, restaurant_id)
);

create table attraction_nearby_hotels (
  attraction_id uuid references attractions(id) on delete cascade,
  hotel_id uuid references hotels(id) on delete cascade,
  primary key (attraction_id, hotel_id)
);

-- Junction table for "nearby attractions" shown on a hotel's detail page
-- (defined here, after both hotels and attractions exist)
create table hotel_nearby_attractions (
  hotel_id uuid references hotels(id) on delete cascade,
  attraction_id uuid references attractions(id) on delete cascade,
  primary key (hotel_id, attraction_id)
);

-- ----------------------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------------------
create table events (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  title_ar text,
  title_so text,
  description text not null,
  cover_image text not null,
  category event_category not null,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text not null,
  ticket_info text,
  status content_status not null default 'published',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- ARTICLES / BLOG
-- ----------------------------------------------------------------------------
create table articles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  title_ar text,
  title_so text,
  excerpt text not null,
  body text not null, -- markdown
  cover_image text not null,
  category text not null default 'Guides',
  author_id uuid references profiles(id),
  read_minutes integer not null default 5,
  status content_status not null default 'published',
  published_at timestamptz default now(),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- DESTINATIONS (neighborhoods shown on the Explore page)
-- ----------------------------------------------------------------------------
create table destinations (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text not null,
  image text not null,
  place_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table destinations enable row level security;
create policy "Public can read destinations" on destinations for select using (true);
create policy "Admins manage destinations" on destinations for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ----------------------------------------------------------------------------
-- MAP POINTS (categories with no dedicated listing table: hospitals, banks,
-- ATMs, mosques, shopping, museums — hotels/restaurants/attractions are
-- pulled directly from their own tables and merged with these at query time)
-- ----------------------------------------------------------------------------
create table map_points (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null check (category in
    ('hotel','restaurant','hospital','bank','atm','mosque','shopping','museum','attraction')),
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);

alter table map_points enable row level security;
create policy "Public can read map points" on map_points for select using (true);
create policy "Admins manage map points" on map_points for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ----------------------------------------------------------------------------
-- POLYMORPHIC REVIEWS (works across hotels/restaurants/cafes/attractions)
-- ----------------------------------------------------------------------------
create type listing_type as enum ('hotel', 'restaurant', 'cafe', 'attraction');

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_type listing_type not null,
  listing_id uuid not null,
  user_id uuid references profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index reviews_listing_idx on reviews (listing_type, listing_id);

-- ----------------------------------------------------------------------------
-- FAVORITES / SAVED TRIPS
-- ----------------------------------------------------------------------------
create table favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  listing_type listing_type not null,
  listing_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, listing_type, listing_id)
);

create table saved_trips (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table saved_trip_items (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid references saved_trips(id) on delete cascade,
  listing_type listing_type not null,
  listing_id uuid not null,
  day_number integer,
  sort_order integer default 0
);

-- ----------------------------------------------------------------------------
-- NEWSLETTER + CONTACT
-- ----------------------------------------------------------------------------
create table newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  locale text default 'en',
  subscribed_at timestamptz not null default now()
);

create table contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES for common lookups
-- ----------------------------------------------------------------------------
create index hotels_slug_idx on hotels (slug);
create index restaurants_slug_idx on restaurants (slug);
create index cafes_slug_idx on cafes (slug);
create index attractions_slug_idx on attractions (slug);
create index events_slug_idx on events (slug);
create index articles_slug_idx on articles (slug);
create index hotels_featured_idx on hotels (featured) where featured = true;

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table profiles enable row level security;
alter table hotels enable row level security;
alter table restaurants enable row level security;
alter table cafes enable row level security;
alter table attractions enable row level security;
alter table events enable row level security;
alter table articles enable row level security;
alter table reviews enable row level security;
alter table favorites enable row level security;
alter table saved_trips enable row level security;
alter table saved_trip_items enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

-- Public read access to published content
create policy "Public can read profiles" on profiles for select using (true);
create policy "Public can read published hotels" on hotels for select using (status = 'published');
create policy "Public can read published restaurants" on restaurants for select using (status = 'published');
create policy "Public can read published cafes" on cafes for select using (status = 'published');
create policy "Public can read published attractions" on attractions for select using (status = 'published');
create policy "Public can read published events" on events for select using (status = 'published');
create policy "Public can read published articles" on articles for select using (status = 'published');
create policy "Public can read reviews" on reviews for select using (true);

-- Admin-only writes (checks profiles.role via a helper subquery)
create policy "Admins manage hotels" on hotels for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage restaurants" on restaurants for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage cafes" on cafes for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage attractions" on attractions for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage events" on events for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Admins manage articles" on articles for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Business owners can manage their own listings
create policy "Owners manage their hotels" on hotels for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners manage their restaurants" on restaurants for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners manage their cafes" on cafes for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Signed-in users manage their own reviews / favorites / trips
create policy "Users insert own reviews" on reviews for insert with check (auth.uid() = user_id);
create policy "Users update own reviews" on reviews for update using (auth.uid() = user_id);
create policy "Users delete own reviews" on reviews for delete using (auth.uid() = user_id);

create policy "Users manage own favorites" on favorites for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own trips" on saved_trips for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage own trip items" on saved_trip_items for all
  using (exists (select 1 from saved_trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from saved_trips t where t.id = trip_id and t.user_id = auth.uid()));

-- Anyone can subscribe / send a message; nobody can read others' rows except admins
create policy "Anyone can subscribe to newsletter" on newsletter_subscribers for insert with check (true);
create policy "Admins read newsletter subscribers" on newsletter_subscribers for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "Anyone can send a contact message" on contact_messages for insert with check (true);
create policy "Admins read contact messages" on contact_messages for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ----------------------------------------------------------------------------
-- FUNCTION: keep rating / review_count in sync when a review is added
-- ----------------------------------------------------------------------------
create or replace function refresh_listing_rating() returns trigger as $$
declare
  target_table text;
begin
  target_table := case new.listing_type
    when 'hotel' then 'hotels'
    when 'restaurant' then 'restaurants'
    when 'cafe' then 'cafes'
    when 'attraction' then 'attractions'
  end;

  execute format(
    'update %I set rating = coalesce((select round(avg(rating)::numeric,1) from reviews where listing_type = $1 and listing_id = $2),0),
              review_count = (select count(*) from reviews where listing_type = $1 and listing_id = $2)
     where id = $2', target_table
  ) using new.listing_type, new.listing_id;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update or delete on reviews
  for each row execute procedure refresh_listing_rating();

-- ============================================================================
-- STORAGE — image uploads for listing galleries
-- Run this AFTER creating a bucket named `listing-images` in the Supabase
-- dashboard (Storage tab), or via:
--   insert into storage.buckets (id, name, public) values ('listing-images','listing-images', true);
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;

create policy "Public can view listing images" on storage.objects
  for select using (bucket_id = 'listing-images');

create policy "Admins can upload listing images" on storage.objects
  for insert with check (
    bucket_id = 'listing-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update listing images" on storage.objects
  for update using (
    bucket_id = 'listing-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete listing images" on storage.objects
  for delete using (
    bucket_id = 'listing-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ----------------------------------------------------------------------------
-- STORAGE — profile avatars
-- Any signed-in user may upload/replace/delete files, but ONLY inside a
-- folder matching their own auth.uid() (e.g. `avatars/<uid>/photo.jpg`),
-- enforced by checking the first path segment against auth.uid().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Public can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users upload their own avatar" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
