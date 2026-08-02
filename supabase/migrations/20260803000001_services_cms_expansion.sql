-- ============================================================================
-- Go Hargeisa — Phase 9: expand `services` to the same richness as hotels/
-- restaurants/cafes, and widen its category enum for the full CMS category
-- list. This table has had zero admin CRUD (no /admin/services route ever
-- existed) and was missing several columns every other listing type has —
-- confirmed by components/business/my-business-form.tsx's own comment:
-- "services (Phase 2 city services) has none of them" (whatsapp/email/
-- social). is_pinned was also missing even though lib/actions/admin.ts's
-- toggleListingPinned already targets "services" as a FEATURABLE_TABLE —
-- that action has been erroring on any service row until now.
-- Every statement is idempotent — safe to re-run.
-- ============================================================================

alter table services
  add column if not exists logo_url text,
  add column if not exists videos jsonb not null default '[]',
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists social_instagram text,
  add column if not exists social_facebook text,
  add column if not exists opening_hours_structured jsonb not null default '[]',
  add column if not exists google_maps_url text,
  add column if not exists is_pinned boolean not null default false;

create index if not exists idx_services_is_pinned on services(is_pinned);

alter type service_category add value if not exists 'mosque';
alter type service_category add value if not exists 'school';
alter type service_category add value if not exists 'university';
alter type service_category add value if not exists 'gym';
alter type service_category add value if not exists 'tour_company';
alter type service_category add value if not exists 'apartment';
