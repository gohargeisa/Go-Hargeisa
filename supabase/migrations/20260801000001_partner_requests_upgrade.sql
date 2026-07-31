-- ============================================================================
-- Go Hargeisa — Partner onboarding upgrade
-- Extends the existing business_join_requests system (Phase 4 Stage 6) into
-- a full partner-onboarding intake rather than building a second, parallel
-- table: same table, same /admin/requests page, same convertJoinRequest
-- action — just a wider category set and the richer fields the new /join
-- form collects.
--
-- Category widens from listing_type_business ('hotel'|'restaurant'|'cafe')
-- to a dedicated partner_request_category (13 values covering every
-- business type the join form now accepts). converted_listing_type stays
-- listing_type_business — only hotel/restaurant/cafe requests ever become a
-- real listing row; the other 10 categories have no matching listing table
-- yet, so "approved" for them just means "verified partner", not converted.
--
-- owner_name relaxes to nullable: the new form's Business Information
-- section deliberately doesn't collect a separate contact-person name.
-- Safe to re-run (checked: 0 existing rows at the time this was written).
-- ============================================================================

do $$ begin
  create type partner_request_category as enum (
    'hotel', 'restaurant', 'cafe', 'tour_company', 'travel_agency', 'car_rental',
    'apartment', 'shopping_mall', 'hospital', 'pharmacy', 'gym', 'beauty_salon', 'other'
  );
exception when duplicate_object then null; end $$;

alter table business_join_requests
  alter column category type partner_request_category using category::text::partner_request_category;

alter table business_join_requests alter column owner_name drop not null;

alter table business_join_requests add column if not exists instagram text;
alter table business_join_requests add column if not exists facebook text;
alter table business_join_requests add column if not exists city text not null default 'Hargeisa';
alter table business_join_requests add column if not exists district text;
alter table business_join_requests add column if not exists lat double precision;
alter table business_join_requests add column if not exists lng double precision;
alter table business_join_requests add column if not exists cover_image text;
alter table business_join_requests add column if not exists opening_hours jsonb not null default '[]';
alter table business_join_requests add column if not exists amenities text[] not null default '{}';
alter table business_join_requests add column if not exists price_range price_range;
