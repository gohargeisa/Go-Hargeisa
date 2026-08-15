-- ============================================================================
-- Go Hargeisa — Enable the appointment engine for Beauty Salons
--
-- Reuses the exact same doctors/departments/appointments tables, RLS, and
-- submit_appointment_request() RPC already live for Hospital/Clinic — no
-- schema change. A stylist maps onto the existing `doctors` row shape as-is
-- (name, photo, specialty, bio, languages, working_hours, appointment
-- duration) with zero new columns needed.
--
-- The doctor/patient-specific display copy stays exactly as-is for
-- Hospital/Clinic — see lib/utils/appointment-domain.ts, which resolves
-- generic "Staff"/"Customer" copy for every other supports_appointments
-- category (today: beauty-salon) at the display layer only.
--
-- Men's Barbershops intentionally NOT enabled here — not requested this
-- round; flipping its own supports_appointments flag later would enable it
-- with zero additional code, demonstrating the same reusability.
-- ============================================================================

update categories set supports_appointments = true where slug = 'beauty-salon';
