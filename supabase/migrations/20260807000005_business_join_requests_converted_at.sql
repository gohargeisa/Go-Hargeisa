-- ============================================================================
-- Go Hargeisa — Track when a business join request was converted
--
-- convertJoinRequest() already sets converted_listing_type/converted_listing_id
-- on approval, but the only timestamp touched was updated_at — which every
-- other status/edit/note action also bumps, so it can't be trusted as a
-- "converted on" date. converted_at is set exactly once, at conversion time,
-- so the admin requests list can show a real conversion date next to the
-- "Converted" badge. Safe to re-run.
-- ============================================================================

alter table business_join_requests
  add column if not exists converted_at timestamptz;

comment on column business_join_requests.converted_at is
  'Timestamp when convertJoinRequest() successfully created the listing. NULL until converted.';
