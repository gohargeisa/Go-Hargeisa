-- Nudges PostgREST to pick up the admin_notify_user RPC added in the
-- previous migration — its schema cache didn't refresh automatically after
-- that CLI-applied migration.
notify pgrst, 'reload schema';
