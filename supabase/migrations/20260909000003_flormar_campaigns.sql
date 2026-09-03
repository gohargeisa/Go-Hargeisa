-- ============================================================================
-- Go Hargeisa — Flormar Hargeisa campaign hero (future admin-managed source)
--
-- NOT APPLIED ANYWHERE YET — written for review, matching this project's
-- established pattern for pending migrations (see
-- 20260902000001_featured_partner_content.sql). Do NOT apply without an
-- accompanying admin UI to manage the rows.
--
-- WHAT THIS IS FOR
--   The Flormar storefront's full-bleed campaign carousel
--   (components/flormar/flormar-campaign-hero.tsx) is currently driven by a
--   typed config file, lib/config/flormar-campaigns.ts, which IS the live
--   source of truth today. That file's `FlormarCampaign` interface was
--   deliberately shaped as a 1:1 map of the table below so that moving the
--   data into the database later is a data-layer swap with no component or
--   shape change.
--
--   Each row is ONE campaign slide: a hero image (+ optional dedicated
--   mobile crop), editorial copy in all three site locales, the 8-char
--   parent-SKU prefixes of the Flormar product(s) shown in the photo (the
--   CTA opens the first one that resolves in the live `products` catalogue),
--   a category fallback, an ordering weight, an active flag and an optional
--   date window.
--
-- SAFETY
--   Purely additive. New table only — no existing table, column, RLS policy
--   or function touched. Until an admin UI ships alongside this migration,
--   lib/config/flormar-campaigns.ts remains the single source and this table
--   is unused.
-- ============================================================================

create table flormar_campaigns (
  id uuid primary key default gen_random_uuid(),
  -- Stable slug used as the React key / analytics id (mirrors the config
  -- file's `id`). Unique so a slide can be addressed by name.
  slug text not null unique,

  image_url text not null,
  mobile_image_url text,
  -- CSS object-position for the hero image, e.g. "50% 20%". `focal_point` is
  -- the desktop crop (model in the trailing column), `mobile_focal_point` the
  -- full-bleed mobile crop; the latter falls back to the former.
  focal_point text,
  mobile_focal_point text,

  eyebrow text not null,
  eyebrow_ar text,
  eyebrow_so text,
  title text not null,
  title_ar text,
  title_so text,
  subtitle text not null,
  subtitle_ar text,
  subtitle_so text,
  description text,
  description_ar text,
  description_so text,
  cta_label text not null,
  cta_label_ar text,
  cta_label_so text,

  -- 8-char parent-SKU prefixes of the product(s) in the photo. Empty array
  -- ⇒ category-only slide (CTA scrolls to `category_fallback`).
  product_sku_prefixes text[] not null default '{}',
  -- One of the storefront's category-group keys: face, eyes, lips, nails,
  -- skincare, accessories.
  category_fallback text not null
    check (category_fallback in ('face', 'eyes', 'lips', 'nails', 'skincare', 'accessories')),

  display_order integer not null default 0,
  active boolean not null default true,
  start_date timestamptz,
  end_date timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_flormar_campaigns_active_order
  on flormar_campaigns (active, display_order);

alter table flormar_campaigns enable row level security;

-- Public read — the storefront hero is public, same reasoning as
-- "Public reads featured partner content".
create policy "Public reads flormar campaigns" on flormar_campaigns for select
  using (true);

-- Admin-only writes — campaign content is a Go Hargeisa editorial decision,
-- not partner self-service (mirrors is_partner / featured_partner_content).
create policy "Owners manage flormar campaigns" on flormar_campaigns for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));
