-- ============================================================================
-- Categories — admin-defined custom fields per category
--
-- Phase 3: categories like Real Estate, Travel Agencies, Flower Shops need
-- extra submission/detail-page fields that don't apply to every category
-- (e.g. "Property Type" for Real Estate, "Destinations Covered" for Travel
-- Agencies). Hardcoding those per business type would reintroduce exactly
-- the hardcoded-category problem Phase 1 removed, and wouldn't work for
-- "any future category" an admin creates later. Instead, each category
-- optionally carries its own field *schema* (defined once, in admin), and
-- every service/business-request row stores its actual field *values* in a
-- matching jsonb map — same "define once in the DB, render everywhere"
-- pattern as the rest of the category system.
-- ============================================================================

-- Array of {key, label, type, required, options?} — see types/index.ts
-- CategoryCustomField for the exact shape. `key` is the stable identifier
-- used in services.custom_fields; `label`/`options` are display text,
-- editable without touching data.
alter table categories add column if not exists custom_fields_schema jsonb not null default '[]';

alter table services add column if not exists custom_fields jsonb not null default '{}';

-- Seed schemas for the 3 categories named in the Phase 3 request. Every
-- other category (including ones an admin creates tomorrow) simply has an
-- empty schema — no Details section, no extra submission fields — until an
-- admin defines one via /admin/categories.
update categories set custom_fields_schema = '[
  {"key": "property_type", "label": "Property Type", "type": "select", "required": true, "options": ["Apartment", "House", "Villa", "Commercial", "Land"]},
  {"key": "listing_type", "label": "For Sale or Rent", "type": "select", "required": true, "options": ["For Sale", "For Rent"]},
  {"key": "bedrooms", "label": "Bedrooms", "type": "number", "required": false},
  {"key": "bathrooms", "label": "Bathrooms", "type": "number", "required": false},
  {"key": "size_sqm", "label": "Size (sqm)", "type": "number", "required": false}
]'::jsonb
where slug = 'real-estate';

update categories set custom_fields_schema = '[
  {"key": "destinations", "label": "Destinations Covered", "type": "text", "required": false},
  {"key": "specialties", "label": "Specialties", "type": "text", "required": false},
  {"key": "license_number", "label": "Tourism License Number", "type": "text", "required": false}
]'::jsonb
where slug = 'tour-companies';

update categories set custom_fields_schema = '[
  {"key": "delivery_available", "label": "Delivery Available", "type": "boolean", "required": false},
  {"key": "specialties", "label": "Specialties", "type": "text", "required": false},
  {"key": "custom_arrangements", "label": "Custom Arrangements", "type": "boolean", "required": false}
]'::jsonb
where slug = 'flower-shops';
