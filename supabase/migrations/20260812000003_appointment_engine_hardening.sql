-- ============================================================================
-- Go Hargeisa — Phase 7c: Appointment engine hardening
--
-- Three gaps found in the existing Medical Appointment Engine
-- (20260810000002_medical_appointment_engine.sql) versus the current
-- Hospitals/Clinics appointment-booking requirements:
--
-- 1. doctors had no consultation_fee column.
-- 2. appointments.status only allowed pending/confirmed/cancelled/completed
--    — missing rejected/no_show.
-- 3. Nothing prevented double-booking the same doctor/date/time: no unique
--    constraint at the DB level, and submitAppointmentRequest() did a raw
--    insert with no server-side re-check. Fixed the same way hotel bookings
--    already solve this class of problem (see
--    20260729000007_add_submit_booking_request_rpc.sql /
--    20260802000006_booking_system_upgrade.sql room_capacity_available): a
--    SECURITY DEFINER RPC that re-checks availability and inserts atomically,
--    backstopped by a partial unique index against concurrent races. The
--    plain INSERT policy ("Anyone can submit an appointment request") is left
--    in place, matching how the hotel booking INSERT policy was kept
--    alongside its RPC — this migration adds an additional, safer path
--    rather than replacing the existing one.
--
-- Also adds the missing "patient cancels their own appointment" RLS policy
-- — the engine shipped with insert/read-own/owner-manage/admin-manage
-- policies but no patient-initiated update path at all, so a signed-in
-- patient could see their appointment but never cancel it. Mirrors
-- bookings' "Users cancel their own booking" policy
-- (20260802000007_user_booking_cancel.sql): patients may only move their
-- own pending/confirmed appointment to 'cancelled', nothing else.
--
-- Idempotent, safe to re-run. No existing data is touched.
-- ============================================================================

alter table doctors add column if not exists consultation_fee numeric;

drop policy if exists "Patients cancel their own appointments" on appointments;
create policy "Patients cancel their own appointments" on appointments
  for update
  using (user_id is not null and user_id = auth.uid() and status in ('pending', 'confirmed'))
  with check (user_id is not null and user_id = auth.uid() and status = 'cancelled');

alter table appointments drop constraint if exists appointments_status_check;
alter table appointments add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'no_show'));

-- Partial unique index: only one pending/confirmed appointment may occupy a
-- given doctor/date/time slot. Cancelled/rejected/completed appointments
-- don't block the slot from being rebooked.
create unique index if not exists appointments_no_double_booking
  on appointments(doctor_id, appointment_date, appointment_time)
  where status in ('pending', 'confirmed');

create or replace function public.submit_appointment_request(
  p_doctor_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_patient_email text,
  p_appointment_date date,
  p_appointment_time time,
  p_notes text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_appointment_id uuid;
begin
  if p_patient_name is null or btrim(p_patient_name) = '' then
    raise exception 'Patient name is required';
  end if;
  if p_patient_phone is null or btrim(p_patient_phone) = '' then
    raise exception 'Phone number is required';
  end if;
  if p_appointment_date is null or p_appointment_date < current_date then
    raise exception 'Appointment date must be today or later';
  end if;
  if p_appointment_time is null then
    raise exception 'Appointment time is required';
  end if;
  if not exists (
    select 1 from doctors d
    join city_services cs on cs.id = d.city_service_id
    where d.id = p_doctor_id and d.is_active = true and cs.status = 'published'
  ) then
    raise exception 'Doctor not found';
  end if;
  if exists (
    select 1 from appointments
    where doctor_id = p_doctor_id
      and appointment_date = p_appointment_date
      and appointment_time = p_appointment_time
      and status in ('pending', 'confirmed')
  ) then
    raise exception 'This time slot is no longer available';
  end if;

  insert into appointments (
    doctor_id, patient_name, patient_phone, patient_email,
    appointment_date, appointment_time, status, notes, user_id
  ) values (
    p_doctor_id, btrim(p_patient_name), btrim(p_patient_phone),
    nullif(btrim(coalesce(p_patient_email, '')), ''),
    p_appointment_date, p_appointment_time, 'pending',
    nullif(btrim(coalesce(p_notes, '')), ''), auth.uid()
  )
  returning id into v_appointment_id;

  return v_appointment_id;
exception
  when unique_violation then
    raise exception 'This time slot is no longer available';
end;
$$;

revoke all on function public.submit_appointment_request(uuid, text, text, text, date, time, text) from public;
grant execute on function public.submit_appointment_request(uuid, text, text, text, date, time, text) to anon, authenticated;
