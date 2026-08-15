-- ============================================================================
-- Go Hargeisa — Move Flowers & Gifts into City Services
--
-- Flowers & Gifts was previously its own standalone category on the
-- `services` vertical (target_table='services'). Per updated direction, it
-- now belongs inside City Services alongside Hospitals/Clinics/Schools/etc,
-- matching every other everyday-essentials category. The `categories` row
-- itself was moved in place (target_table flipped to 'city_services', same
-- category id/slug — no new category row, no duplicate) via a one-off data
-- update; this migration only adds the missing enum value the city_services
-- table's legacy `category` column needs, following the exact same pattern
-- every prior city_services category addition used (dental_clinic,
-- perfume_shop, auto_repair, clinic, beauty_salon, men_barbershop,
-- cosmetics_beauty were all added to this enum the same way).
-- ============================================================================

alter type city_service_category add value if not exists 'flower_shop';
