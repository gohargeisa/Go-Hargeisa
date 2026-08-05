-- Business owners can edit their own hotel/restaurant/cafe listing (RLS on
-- those tables already scopes writes to `owner_id = auth.uid()`), but the
-- `listing-images` storage bucket's insert/update/delete policies only
-- granted role = 'owner' — meaning a business_owner using the exact same
-- admin edit form (HotelForm/RestaurantForm/CafeForm + ImageUploader/
-- GalleryManager) could never actually upload a cover photo, logo, or
-- gallery image for their own listing. This brings storage access in line
-- with the DB-row access they already have. Scope matches the existing
-- owner policies (bucket-wide, not per-listing-folder) — safe because the
-- underlying listing tables' own RLS is what actually prevents a
-- business_owner from attaching an uploaded image to a listing they don't
-- own; this bucket has no per-owner folder structure to scope against.

drop policy if exists "Owners can upload listing images" on storage.objects;
create policy "Owners can upload listing images" on storage.objects
  for insert with check (
    bucket_id = 'listing-images'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'business_owner')
    )
  );

drop policy if exists "Owners can update listing images" on storage.objects;
create policy "Owners can update listing images" on storage.objects
  for update using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'business_owner')
    )
  );

drop policy if exists "Owners can delete listing images" on storage.objects;
create policy "Owners can delete listing images" on storage.objects
  for delete using (
    bucket_id = 'listing-images'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('owner', 'business_owner')
    )
  );
