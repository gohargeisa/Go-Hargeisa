-- Tracks whether a check-in reminder has already gone out for a booking,
-- so the daily cron job (app/api/cron/booking-reminders) never double-sends
-- one if it runs more than once for the same day.
alter table bookings add column if not exists reminder_sent_at timestamptz;
