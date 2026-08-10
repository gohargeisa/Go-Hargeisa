-- ============================================================================
-- Go Hargeisa — Phase 4B: Medical Appointment Engine
-- (Hospitals, Clinics, Dental Clinics — one shared engine, not three)
--
-- Adds departments/doctors/appointments/appointment_status_history, all
-- referencing city_services.id (directly or via doctors) by FK only. No
-- existing table is altered except categories, which only gains one new
-- nullable-safe boolean column (default false) — no existing row's behavior
-- changes anywhere until explicitly flipped below.
--
-- doctors.working_hours reuses the exact OpeningHoursGroup[] jsonb shape
-- already used by hotels/restaurants/cafes/city_services/events opening
-- hours (see 20260803000016_city_services_upgrade.sql) — no separate
-- schedule table, so the existing OpeningHoursEditor component can be reused
-- as-is. Available appointment slots are computed on read in application
-- code (working_hours groups minus already-booked appointments for that
-- doctor/date), not pre-generated/stored, matching how getOpenStatus already
-- handles opening_hours_structured.
--
-- RLS mirrors hotel_rooms (child-of-a-listing, owner-checked via join to the
-- parent's owner_id) and bookings (anonymous insert + owner-scoped
-- management + "read your own") exactly — no new authorization shape.
--
-- Idempotent (if not exists / drop-if-exists-before-create throughout),
-- safe to re-run.
-- ============================================================================

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  city_service_id uuid not null references city_services(id) on delete cascade,
  name text not null,
  name_ar text,
  name_so text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_departments_city_service_id on departments(city_service_id);

create table if not exists doctors (
  id uuid primary key default gen_random_uuid(),
  city_service_id uuid not null references city_services(id) on delete cascade,
  department_id uuid references departments(id) on delete set null,
  name text not null,
  photo text,
  specialty text,
  specialty_ar text,
  specialty_so text,
  bio text,
  bio_ar text,
  bio_so text,
  languages text[] not null default '{}',
  working_hours jsonb not null default '[]',
  appointment_duration_minutes integer not null default 30,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_doctors_city_service_id on doctors(city_service_id);
create index if not exists idx_doctors_department_id on doctors(department_id);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references doctors(id) on delete cascade,
  patient_name text not null,
  patient_phone text not null,
  patient_email text,
  user_id uuid references profiles(id),
  appointment_date date not null,
  appointment_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_appointments_doctor_id on appointments(doctor_id);
create index if not exists idx_appointments_doctor_date on appointments(doctor_id, appointment_date);
create index if not exists idx_appointments_user_id on appointments(user_id);

create table if not exists appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  old_status text,
  new_status text not null,
  changed_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_appointment_status_history_appointment_id on appointment_status_history(appointment_id);

alter table departments enable row level security;
alter table doctors enable row level security;
alter table appointments enable row level security;
alter table appointment_status_history enable row level security;

-- departments
drop policy if exists "Public can read departments of published listings" on departments;
create policy "Public can read departments of published listings" on departments
  for select
  using (exists (select 1 from city_services cs where cs.id = departments.city_service_id and cs.status = 'published'));

drop policy if exists "Owners manage their own departments" on departments;
create policy "Owners manage their own departments" on departments
  for all
  using (exists (select 1 from city_services cs where cs.id = departments.city_service_id and cs.owner_id = auth.uid()))
  with check (exists (select 1 from city_services cs where cs.id = departments.city_service_id and cs.owner_id = auth.uid()));

drop policy if exists "Platform admin manages all departments" on departments;
create policy "Platform admin manages all departments" on departments
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- doctors
drop policy if exists "Public can read doctors of published listings" on doctors;
create policy "Public can read doctors of published listings" on doctors
  for select
  using (exists (select 1 from city_services cs where cs.id = doctors.city_service_id and cs.status = 'published'));

drop policy if exists "Owners manage their own doctors" on doctors;
create policy "Owners manage their own doctors" on doctors
  for all
  using (exists (select 1 from city_services cs where cs.id = doctors.city_service_id and cs.owner_id = auth.uid()))
  with check (exists (select 1 from city_services cs where cs.id = doctors.city_service_id and cs.owner_id = auth.uid()));

drop policy if exists "Platform admin manages all doctors" on doctors;
create policy "Platform admin manages all doctors" on doctors
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- appointments
drop policy if exists "Anyone can submit an appointment request" on appointments;
create policy "Anyone can submit an appointment request" on appointments
  for insert
  with check (true);

drop policy if exists "Patients read their own appointments" on appointments;
create policy "Patients read their own appointments" on appointments
  for select
  using (user_id is not null and user_id = auth.uid());

drop policy if exists "Owners manage their own doctors' appointments" on appointments;
create policy "Owners manage their own doctors' appointments" on appointments
  for all
  using (
    exists (
      select 1 from doctors d join city_services cs on cs.id = d.city_service_id
      where d.id = appointments.doctor_id and cs.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from doctors d join city_services cs on cs.id = d.city_service_id
      where d.id = appointments.doctor_id and cs.owner_id = auth.uid()
    )
  );

drop policy if exists "Platform admin manages all appointments" on appointments;
create policy "Platform admin manages all appointments" on appointments
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

-- appointment_status_history
drop policy if exists "Owners read their own doctors' appointment history" on appointment_status_history;
create policy "Owners read their own doctors' appointment history" on appointment_status_history
  for select
  using (
    exists (
      select 1 from appointments a
      join doctors d on d.id = a.doctor_id
      join city_services cs on cs.id = d.city_service_id
      where a.id = appointment_status_history.appointment_id and cs.owner_id = auth.uid()
    )
  );

drop policy if exists "Owners insert their own doctors' appointment history" on appointment_status_history;
create policy "Owners insert their own doctors' appointment history" on appointment_status_history
  for insert
  with check (
    exists (
      select 1 from appointments a
      join doctors d on d.id = a.doctor_id
      join city_services cs on cs.id = d.city_service_id
      where a.id = appointment_status_history.appointment_id and cs.owner_id = auth.uid()
    )
  );

drop policy if exists "Platform admin manages all appointment history" on appointment_status_history;
create policy "Platform admin manages all appointment history" on appointment_status_history
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'owner'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'owner'));

alter table categories add column if not exists supports_appointments boolean not null default false;

-- Verified live 2026-08-10: the ACTIVE category rows for these three verticals use
-- singular slugs ('hospital', 'clinic', 'dental-clinic') — the plural variants
-- ('hospitals', 'clinics', 'dental-clinics') are pre-existing deactivated duplicates
-- and are deliberately NOT touched here.
update categories set supports_appointments = true where slug in ('hospital', 'clinic', 'dental-clinic');
