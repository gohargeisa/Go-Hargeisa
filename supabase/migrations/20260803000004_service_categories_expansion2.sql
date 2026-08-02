-- Adds the 3 categories from the "City Services CMS" request not already
-- covered by the existing 14: Supermarkets, (general) Clinics, and
-- Government Offices. "Dentists" already maps to the existing
-- dental_clinic value, so it isn't repeated here.
alter type service_category add value if not exists 'supermarket';
alter type service_category add value if not exists 'clinic';
alter type service_category add value if not exists 'government_office';
