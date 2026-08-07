# Supermarket module — architecture plan

Status (2026-08-07): **scaffolding only**. Nav item + placeholder page
exist; no products/cart/orders/checkout/store table has been built. This
doc is the source of truth for how the real build should be structured
when that work starts, so it doesn't need to be re-derived or accidentally
built on top of the generic Business Listings system.

## Why a separate module

Supermarket is a full e-commerce platform (catalog, variants, inventory,
cart, checkout, orders, delivery, coupons, owner dashboard, admin). The
existing Business Listings system (`hotels`/`restaurants`/`cafes`/
`services` + the `categories` table) is built for single-page listings with
a handful of custom fields — it has no concept of multiple SKUs per store,
a cart, or an order. Retrofitting it would mean the two very different
domains (place a directory listing vs. run a store) fight over the same
tables. Supermarket is being kept **fully independent** instead:

- Its own future DB tables, its own future action/data files, its own
  future public/owner/admin routes.
- Never added to `lib/actions/admin.ts`'s shared `ALLOWED_TABLES` CRUD
  switch, and never added to `lib/data/business.ts`'s `_getOwnedListings`
  (the "one owner = one active listing" model every other business type
  shares).
- Never a row in the `categories` table — the nav link and public page are
  hardcoded, not category-driven (see "What exists today" below).

The closest existing precedent is **`city_services`** (own table, own
`lib/actions/city-services.ts` with its own `assertOwner()`, own admin
pages, zero shared-CRUD/owner-dashboard involvement) — see
`supabase/migrations/20260730000003_city_services.sql`'s header comment for
the same reasoning applied to a smaller directory. Supermarket follows the
same isolation, but goes one step further: `city_services` has no
`owner_id` and no owner dashboard at all (admin-authored only), while
Supermarket needs real store ownership and a real owner dashboard from the
start, so its owner-facing routes get their own namespace instead of
reusing `city_services`' owner-less pattern OR `/business/*`'s
single-listing pattern.

## What exists today (this pass)

- `lib/config/features.ts` — `SUPERMARKET_ENABLED` flag (currently `true`;
  only gates the nav link and the placeholder page — there's no listing
  data to filter yet).
- `components/layout/site-header.tsx` — one hardcoded nav link
  (`/${locale}/supermarket`, `ShoppingCart` icon), added directly next to
  the DB-driven `pinnedCategories` output, NOT through `categoryHref`/
  `categoryDisplayName` and NOT as a `categories` row.
- `app/[locale]/supermarket/page.tsx` — placeholder page rendering
  `components/shared/coming-soon-section.tsx`'s new `type="supermarket"`
  variant. No data fetching.
- `supabase/migrations/20260807000006_deactivate_supermarkets_service_category.sql`
  — deactivated the old `categories` row (`slug='supermarkets',
  target_table='services'`) that let a business owner create a supermarket
  as a normal `services` listing. Reversible (`is_active` flip), no schema
  change, zero real listings were affected.

## Pre-existing "supermarket" naming collisions — do not conflate

Three unrelated things already use the word "supermarket." Only the first
was a real conflict (now resolved); the other two are legitimate,
pre-existing, separate features and are **not** part of this module:

1. ~~Generic services category (`categories.slug='supermarkets'` →
   `services` table)~~ — deactivated above.
2. `city_services.category = 'supermarket'` — a category inside the
   lightweight City Services directory (`lib/config/city-service-categories.ts`,
   `EssentialServiceCategory`). Represents a physical corner store listed
   with just name/phone/hours — not an e-commerce store. Leave alone.
3. `CityServiceCategory.supermarket` — the Smart City Map's pin-styling
   taxonomy (`components/city-map/category-config.tsx`). Also unrelated.
   Leave alone.

## Planned routing (not created yet)

```
/supermarket                                    — store directory (currently: placeholder)
/supermarket/[storeSlug]                         — store page
/supermarket/[storeSlug]/[productSlug]           — product page
/supermarket/cart
/supermarket/checkout
/supermarket/dashboard/*                         — owner dashboard (fully separate from /business/*)
/admin/supermarket/*                             — admin moderation (fully separate from /admin/services, /admin/city-services)
```

## Planned DB schema (not created yet)

Every future table prefixed `supermarket_` to guarantee zero name collision
with `services`/`categories`/`reviews`/etc.:

```
supermarkets                  — the store entity (owner_id, slug, name, address, lat/lng, status)
supermarket_categories        — per-store aisles/categories
supermarket_products          — name/slug/description/images/category/sku/barcode/price/
                                 sale_price/stock_quantity/is_available/featured/unit/brand/tags
supermarket_product_variants  — size/weight/pack variants per product
supermarket_carts / supermarket_cart_items
supermarket_orders / supermarket_order_items / supermarket_order_status_history
supermarket_coupons
supermarket_reviews
```

RLS modeled on `services`' `owner_id = auth.uid()` pattern (this module
needs real ownership, unlike `city_services`).

## Planned code layout (not created yet)

- `lib/actions/supermarket-*.ts` / `lib/data/supermarket-*.ts` — own files,
  own auth gate, never added to `lib/actions/admin.ts`'s generic switch.
- `types/supermarket.ts` — first-ever per-domain types file in this
  codebase (every other domain is folded into the `types/index.ts`
  monolith — this one deliberately isn't, to keep the module's surface
  area easy to find and remove if needed).
- `components/supermarket/*`.

## Next priority (separate from this module)

Per the user's own sequencing, the next piece of work is **cleaning up
duplicate service categories and improving City Services** — not part of
this module. Research done alongside this scaffolding pass found:

- **Likely genuine duplication worth reconciling:** `lib/config/city-service-categories.ts`'s
  `EssentialServiceCategory` (24 values, backs `/city-services`) vs.
  `components/city-map/category-config.tsx`'s `CityServiceCategory` (21
  values, backs `/city-map`'s Smart City Map) — two hand-maintained lists
  describing similar "civic/essential services" categories for two
  different features, ~14 overlapping names but different icons/colors,
  and the Smart City Map's data plumbing (`lib/data/map-points.ts`) only
  actually populates 4 of its 21 categories from live data today.
- **Legitimately distinct, not duplication to collapse:** gallery-tag
  vocabularies (`lib/utils/gallery-categories.ts`), the `attractions.category`
  enum, price-range badge labels (`lib/utils/hotel-category.ts`), and the
  `/join` form's own category enum (`JoinRequestCategory`/
  `PartnerRequestCategoryDb`) — different purposes, coincidental name
  overlap only.
- **Deliberate, self-documented scoped subsets, not bugs:**
  `lib/data/owner-dashboard.ts`'s 4-category `CITY_SERVICE_CATEGORIES` KPI
  widget, and the exclusion sets in `lib/config/listing-feature-eligibility.ts`
  / `lib/config/gallery-eligibility.ts`.
