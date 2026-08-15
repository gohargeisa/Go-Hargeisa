-- Go Hargeisa — manual, owner-controlled "GO HARGEISA PARTNER" status.
--
-- The Partner badge previously had no real backing data: hotels/restaurants/
-- cafes/services detail pages hardcoded `isPartner={true}` unconditionally,
-- and city_services approximated it as `status === 'published'`. Neither
-- reflects a deliberate decision by the platform owner about which
-- businesses are actual showcase partners.
--
-- `is_partner` is a plain boolean, independent of subscription tier,
-- pricing, category, listing status, creation date, featured status, or
-- reviews/ratings — only an authorized admin can flip it, via each listing
-- type's existing admin edit form. Defaults to false everywhere, so no
-- existing business automatically becomes a Partner when this migration
-- runs.
alter table hotels add column if not exists is_partner boolean not null default false;
alter table restaurants add column if not exists is_partner boolean not null default false;
alter table cafes add column if not exists is_partner boolean not null default false;
alter table city_services add column if not exists is_partner boolean not null default false;
alter table services add column if not exists is_partner boolean not null default false;
