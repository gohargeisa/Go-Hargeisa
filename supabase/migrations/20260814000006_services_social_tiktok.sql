-- ============================================================================
-- Go Hargeisa — Add social_tiktok to `services`
--
-- `services` only ever got social_instagram/social_facebook — restaurants,
-- cafes, hotels, and city_services all also carry social_tiktok/snapchat/x/
-- youtube/telegram (the shared SocialExtra shape), but that was never
-- extended to `services`. Adding only social_tiktok here (the one a real
-- business — Lavender Flowers — actually has) rather than all 5, to avoid
-- adding unused columns speculatively.
-- ============================================================================

alter table services add column if not exists social_tiktok text;
