-- ============================================================================
-- Business join requests — add video + verification documents upload
--
-- Phase 3: the /join submission form already collected logo/cover/gallery
-- photos; this adds a video showcase (matching every listing table's own
-- `videos` column) and a general documents upload (business license,
-- registration, etc.) for admins to verify before approving a request.
-- Documents are review-only — never copied onto the public listing when a
-- request is converted (see convertJoinRequest in lib/actions/business-
-- requests.ts), unlike gallery/videos which do carry over.
-- ============================================================================

alter table business_join_requests add column if not exists videos jsonb not null default '[]';
alter table business_join_requests add column if not exists documents jsonb not null default '[]';
