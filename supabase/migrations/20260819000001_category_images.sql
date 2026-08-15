-- ============================================================================
-- Go Hargeisa — Universal, admin-controlled category images
--
-- Adds one nullable column to the existing `categories` table (the single
-- source of truth already used everywhere a category is displayed) rather
-- than a second table or a per-category-type field — every current and
-- future category (City Services, Hotels, Restaurants, Cafes, Attractions,
-- Events, Services) gets image upload/replace/remove for free, with zero
-- per-category code.
--
-- Storage: a new `category-images` bucket, deliberately separate from the
-- existing `listing-images` bucket. `listing-images`' write policies are
-- bucket-wide (not folder-scoped — see 20260805000001's own comment) and
-- intentionally grant business_owner too, since any business owner may
-- legitimately upload photos for their OWN listing. Categories are a
-- platform-wide construct no individual business owns, so reusing that
-- bucket would either (a) let any business_owner write into a shared
-- category's folder with no per-listing RLS to stop them, or (b) require
-- editing the existing bucket-wide policies that every hotel/restaurant/
-- cafe/city_service image upload already depends on. A new bucket with its
-- own owner-only policies (the same shape schema.sql originally used for
-- listing-images, before it was widened to business_owner) avoids both,
-- with zero risk to any existing upload path.
--
-- Purely additive — no existing column, table, or storage policy is
-- changed. Safe to re-run.
-- ============================================================================

alter table categories add column if not exists image_url text;

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view category images" on storage.objects;
create policy "Public can view category images" on storage.objects
  for select using (bucket_id = 'category-images');

drop policy if exists "Owners can upload category images" on storage.objects;
create policy "Owners can upload category images" on storage.objects
  for insert with check (
    bucket_id = 'category-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );

drop policy if exists "Owners can update category images" on storage.objects;
create policy "Owners can update category images" on storage.objects
  for update using (
    bucket_id = 'category-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );

drop policy if exists "Owners can delete category images" on storage.objects;
create policy "Owners can delete category images" on storage.objects
  for delete using (
    bucket_id = 'category-images'
    and exists (select 1 from profiles where id = auth.uid() and role = 'owner')
  );
