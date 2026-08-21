-- ============================================================================
-- Access control system: multi-business team member grants, platform-wide
-- team permissions, and honorary (recognition-only) status.
--
-- Purely additive. Does not alter any existing table, column, policy, or
-- row. profiles.role stays exactly "user" | "business_owner" | "owner" —
-- no fourth value is added. Business Partner multi-business access is
-- already fully supported by the existing owner_id columns on
-- hotels/restaurants/cafes/services/city_services (no uniqueness
-- constraint prevents one owner_id from owning many rows across many
-- tables) — nothing here changes that mechanism.
--
-- Design approved in conversation prior to this migration; see that
-- discussion for the full rationale behind each choice below.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. business_access_grants — a team member's per-business permissions.
--    One row per (person, business). Permissions default to {} (no access
--    to anything) and are updated in place, never duplicated.
-- ----------------------------------------------------------------------------
create table business_access_grants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  listing_type  text not null,
  listing_id    uuid not null,

  -- keys: orders_view, orders_manage, bookings_view, bookings_manage,
  --       appointments_view, appointments_manage, businesses_view,
  --       businesses_edit, reviews_view, reviews_moderate
  permissions   jsonb not null default '{}'::jsonb,

  is_active     boolean not null default true,
  granted_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint business_access_grants_listing_type_check
    check (listing_type in ('hotel','restaurant','cafe','service','city_service')),
  constraint business_access_grants_user_listing_unique
    unique (user_id, listing_type, listing_id)
);

create index idx_business_access_grants_listing
  on business_access_grants (listing_type, listing_id);

create index idx_business_access_grants_active_user
  on business_access_grants (user_id) where is_active;

alter table business_access_grants enable row level security;

create policy "Owners manage all access grants"
  on business_access_grants for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "Team members view their own grants"
  on business_access_grants for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. team_platform_permissions — a team member's platform-wide admin
--    permissions (Partners roster, Content, Reports, Analytics, join
--    Requests) — not tied to any one business.
-- ----------------------------------------------------------------------------
create table team_platform_permissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,

  -- keys: partners_view, partners_add, partners_edit, partners_manage_status,
  --       content_view, content_create, content_edit, content_publish,
  --       reports_view, reports_export, analytics_view,
  --       requests_view, requests_manage
  permissions   jsonb not null default '{}'::jsonb,

  is_active     boolean not null default true,
  granted_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint team_platform_permissions_user_unique unique (user_id)
);

create index idx_team_platform_permissions_active_user
  on team_platform_permissions (user_id) where is_active;

alter table team_platform_permissions enable row level security;

create policy "Owners manage all platform permissions"
  on team_platform_permissions for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "Team members view their own platform permissions"
  on team_platform_permissions for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. honorary_members — recognition only. No permissions column exists on
--    this table, and no authorization check anywhere reads from it. The
--    only consumer is a profile-display component.
-- ----------------------------------------------------------------------------
create table honorary_members (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  title_en      text not null,
  title_ar      text,
  title_so      text,
  is_public     boolean not null default true,
  created_by    uuid references profiles(id),
  created_at    timestamptz not null default now(),

  constraint honorary_members_user_unique unique (user_id)
);

alter table honorary_members enable row level security;

create policy "Owners manage honorary members"
  on honorary_members for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

create policy "Public reads public honorary entries"
  on honorary_members for select
  using (is_public = true);

create policy "Honorary members read their own private entry"
  on honorary_members for select
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. has_business_permission() — the one function every new team-grant RLS
--    policy below calls, so the jsonb-key check lives in exactly one place.
-- ----------------------------------------------------------------------------
create or replace function has_business_permission(p_listing_type text, p_listing_id uuid, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from business_access_grants
    where user_id = auth.uid()
      and listing_type = p_listing_type
      and listing_id = p_listing_id
      and is_active
      and coalesce((permissions ->> p_permission)::boolean, false)
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. New, additive policies on existing tables. Every existing policy on
--    these tables (verified against the live migrations before writing
--    this) is left completely untouched — Postgres combines multiple
--    permissive policies for the same command with OR, so these are pure
--    additions, not replacements.
-- ----------------------------------------------------------------------------

-- bookings — existing: "Owners manage all bookings", "Business owners
-- manage their hotel bookings" (both untouched)
create policy "Team members access bookings per grant" on bookings for all
  using (has_business_permission('hotel', hotel_id, 'bookings_manage'))
  with check (has_business_permission('hotel', hotel_id, 'bookings_manage'));
create policy "Team members view bookings per grant" on bookings for select
  using (has_business_permission('hotel', hotel_id, 'bookings_view'));

-- table_reservations — existing: "Owners manage all table reservations",
-- "Business owners manage their listing reservations" (both untouched)
create policy "Team members access reservations per grant" on table_reservations for all
  using (has_business_permission(listing_type::text, listing_id, 'bookings_manage'))
  with check (has_business_permission(listing_type::text, listing_id, 'bookings_manage'));
create policy "Team members view reservations per grant" on table_reservations for select
  using (has_business_permission(listing_type::text, listing_id, 'bookings_view'));

-- product_orders — existing: "Owners manage all product orders",
-- "Business owners manage their listing product orders" (both untouched)
create policy "Team members access orders per grant" on product_orders for all
  using (has_business_permission(listing_type::text, listing_id, 'orders_manage'))
  with check (has_business_permission(listing_type::text, listing_id, 'orders_manage'));
create policy "Team members view orders per grant" on product_orders for select
  using (has_business_permission(listing_type::text, listing_id, 'orders_view'));

-- order_items — existing: "Order items follow parent order visibility" (untouched)
create policy "Team members view order items per grant" on order_items for select
  using (exists (
    select 1 from product_orders po where po.id = order_items.order_id
      and has_business_permission(po.listing_type::text, po.listing_id, 'orders_view')
  ));

-- appointments — existing: "Patients read their own appointments",
-- "Owners manage their own doctors' appointments", "Platform admin manages
-- all appointments" (all untouched). Appointments belong to a doctor,
-- which belongs to a city_service — no polymorphic listing_type column
-- here, so the check goes through that join.
create policy "Team members access appointments per grant" on appointments for all
  using (exists (
    select 1 from doctors d where d.id = appointments.doctor_id
      and has_business_permission('city_service', d.city_service_id, 'appointments_manage')
  ))
  with check (exists (
    select 1 from doctors d where d.id = appointments.doctor_id
      and has_business_permission('city_service', d.city_service_id, 'appointments_manage')
  ));
create policy "Team members view appointments per grant" on appointments for select
  using (exists (
    select 1 from doctors d where d.id = appointments.doctor_id
      and has_business_permission('city_service', d.city_service_id, 'appointments_view')
  ));

-- reviews — existing: "Public can read reviews", "Business owners and
-- admins manage listing reviews", "Admins delete any review" (all untouched)
create policy "Team members moderate reviews per grant" on reviews for update
  using (has_business_permission(listing_type::text, listing_id, 'reviews_moderate'))
  with check (has_business_permission(listing_type::text, listing_id, 'reviews_moderate'));

-- ----------------------------------------------------------------------------
-- 6. businesses_view / businesses_edit — the listing's own record, its
--    offers, its product catalog, its inbound messages, and its analytics
--    events. Every policy below is additive, same discipline as section 5:
--    existing policies (named in each comment, verified against the live
--    migrations before writing this) are left completely untouched.
-- ----------------------------------------------------------------------------

-- hotels — existing: "Owners manage hotels" (for all, role='owner'),
-- "Owners manage their hotels" (for update, owner_id), "Public can read
-- published hotels", "hotels_owner_select" (all untouched)
create policy "Team members edit hotels per grant" on hotels for update
  using (has_business_permission('hotel', id, 'businesses_edit'))
  with check (has_business_permission('hotel', id, 'businesses_edit'));
create policy "Team members view hotels per grant" on hotels for select
  using (has_business_permission('hotel', id, 'businesses_view'));

-- restaurants — existing: "Owners manage restaurants", "Owners manage
-- their restaurants", "Public can read published restaurants",
-- "restaurants_owner_select" (all untouched)
create policy "Team members edit restaurants per grant" on restaurants for update
  using (has_business_permission('restaurant', id, 'businesses_edit'))
  with check (has_business_permission('restaurant', id, 'businesses_edit'));
create policy "Team members view restaurants per grant" on restaurants for select
  using (has_business_permission('restaurant', id, 'businesses_view'));

-- cafes — existing: "Owners manage cafes", "Owners manage their cafes",
-- "Public can read published cafes", "cafes_owner_select" (all untouched)
create policy "Team members edit cafes per grant" on cafes for update
  using (has_business_permission('cafe', id, 'businesses_edit'))
  with check (has_business_permission('cafe', id, 'businesses_edit'));
create policy "Team members view cafes per grant" on cafes for select
  using (has_business_permission('cafe', id, 'businesses_view'));

-- services — existing: "Owners manage services", "Owners manage their
-- services", "Public can read published services", "services_owner_select"
-- (all untouched)
create policy "Team members edit services per grant" on services for update
  using (has_business_permission('service', id, 'businesses_edit'))
  with check (has_business_permission('service', id, 'businesses_edit'));
create policy "Team members view services per grant" on services for select
  using (has_business_permission('service', id, 'businesses_view'));

-- city_services — existing: "Owners manage city services", "Owners manage
-- their city services", "Public can read published city services",
-- "city_services_owner_select" (all untouched)
create policy "Team members edit city services per grant" on city_services for update
  using (has_business_permission('city_service', id, 'businesses_edit'))
  with check (has_business_permission('city_service', id, 'businesses_edit'));
create policy "Team members view city services per grant" on city_services for select
  using (has_business_permission('city_service', id, 'businesses_view'));

-- business_offers — existing: "Owners manage all offers", "Business owners
-- manage their own offers", "Public reads approved offers for published
-- listings" (all untouched)
create policy "Team members manage offers per grant" on business_offers for all
  using (has_business_permission(listing_type::text, listing_id, 'businesses_edit'))
  with check (has_business_permission(listing_type::text, listing_id, 'businesses_edit'));

-- products — existing per-type "Business owners manage their own products"
-- style policies (untouched)
create policy "Team members manage products per grant" on products for all
  using (has_business_permission(listing_type::text, listing_id, 'businesses_edit'))
  with check (has_business_permission(listing_type::text, listing_id, 'businesses_edit'));

-- business_messages — existing: "Owners manage all messages", "Business
-- owners manage their own messages" (untouched). Team members get view +
-- mark-as-read (update), never delete — matches what the Messages page
-- actually does.
create policy "Team members view messages per grant" on business_messages for select
  using (has_business_permission(listing_type::text, listing_id, 'businesses_view'));
create policy "Team members mark messages read per grant" on business_messages for update
  using (has_business_permission(listing_type::text, listing_id, 'businesses_view'))
  with check (has_business_permission(listing_type::text, listing_id, 'businesses_view'));

-- business_metric_events — existing: "Anyone can record a metric event"
-- (insert, untouched), "Owners read their own metric events" (untouched)
create policy "Team members view metric events per grant" on business_metric_events for select
  using (has_business_permission(listing_type::text, listing_id, 'businesses_view'));
