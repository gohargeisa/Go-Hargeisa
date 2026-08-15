-- Go Hargeisa — Join page primary-category expansion (Education, Health,
-- Car Services, Beauty & Care groups).
--
-- Reuses every existing category row (school, university, institute,
-- hospital, clinic, pharmacy, car-rental, car-wash, auto-repair,
-- taxi-service, beauty-salon, cosmetics-beauty, apartments) unchanged —
-- this migration only touches the two real gaps:
--
-- 1. "Dental Clinics" (slug dental-clinic) already exists as a full real
--    category row (with its own specialized join-request-form fields
--    already built) but was previously deactivated. The Join page's new
--    "Health" group needs it selectable again — reactivating an existing
--    row is not a duplicate, it's the same category becoming reachable.
--
-- 2. "Quran Memorization Centers" has no existing category anywhere in the
--    project (confirmed via a live query — no row with that name, and no
--    slug resembling it). The user explicitly asked for it by name as an
--    Education subcategory, so this adds exactly one new row, following the
--    same shape/pattern as every other city_services category.
update categories set is_active = true where slug = 'dental-clinic' and target_table = 'city_services';

insert into categories (
  slug, name, name_ar, name_so, icon, target_table, is_active, is_pinned, sort_order, search_keywords
)
values (
  'quran-memorization-center',
  'Quran Memorization Centers',
  'مراكز تحفيظ القرآن',
  'Xarumaha Xifidka Qur''aanka',
  'BookOpen',
  'city_services',
  true,
  false,
  134,
  array['quran', 'hifz', 'dugsi', 'madrasa']
)
on conflict (slug) do nothing;
