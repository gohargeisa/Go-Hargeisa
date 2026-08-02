-- ============================================================================
-- City Services — full dynamic category system
--
-- Was hardcoded to exactly 4 categories (hospital/bank/supermarket/pharmacy)
-- at every layer, plus a "max 4 featured per category, only featured ones
-- show publicly" rule that's incompatible with "show every published
-- listing, sorted by real count." Expands the category enum to the
-- requested 24 (keeping hospital/bank's existing slugs — they're relabeled
-- "Hospitals & Clinics"/"Banks & ATMs" in the UI, not renamed at the data
-- layer, since Postgres enums can't rename/drop values without recreating
-- the type, and no user-facing behavior needs the slug itself to change).
-- Also adds gallery/whatsapp/email so the admin form can manage more than
-- one photo and richer contact info per listing, matching every other
-- listing type's convention in this app.
-- ============================================================================

alter type city_service_category add value if not exists 'mosque';
alter type city_service_category add value if not exists 'gas_station';
alter type city_service_category add value if not exists 'park_playground';
alter type city_service_category add value if not exists 'kids_family';
alter type city_service_category add value if not exists 'taxi_service';
alter type city_service_category add value if not exists 'police_station';
alter type city_service_category add value if not exists 'fire_station';
alter type city_service_category add value if not exists 'electricity_service';
alter type city_service_category add value if not exists 'water_service';
alter type city_service_category add value if not exists 'post_office';
alter type city_service_category add value if not exists 'school';
alter type city_service_category add value if not exists 'university';
alter type city_service_category add value if not exists 'sports_club';
alter type city_service_category add value if not exists 'gym';
alter type city_service_category add value if not exists 'car_rental';
alter type city_service_category add value if not exists 'car_wash';
alter type city_service_category add value if not exists 'ev_charging';
alter type city_service_category add value if not exists 'government_office';
alter type city_service_category add value if not exists 'visa_immigration';
alter type city_service_category add value if not exists 'internet_telecom';

alter table city_services add column if not exists gallery jsonb not null default '[]';
alter table city_services add column if not exists whatsapp text;
alter table city_services add column if not exists email text;
