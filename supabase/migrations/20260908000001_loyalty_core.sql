-- ============================================================================
-- Go Hargeisa — Digital Loyalty / Rewards Engine (reusable, partner-scoped)
--
-- NOT APPLIED ANYWHERE YET. Written for review per the project owner's
-- standing rule ("write migrations but don't apply them"). No isolated
-- local/dev Supabase instance was available in this environment to test
-- against — applying this is the project owner's decision, from their own
-- machine (`supabase db push`) or with explicit sign-off. After applying,
-- regenerate types: `npx supabase gen types typescript --project-id <ref> >
-- types/database.ts`.
--
-- WHY THIS EXISTS
--   A CORE PLATFORM capability: any Go Hargeisa partner can eventually run a
--   digital loyalty program (points, tiers, rewards, a scannable membership
--   card, staff-operated purchase/redemption). This migration builds the
--   full reusable engine. A SECOND migration
--   (20260908000002_loyalty_flormar_activation.sql) is the ONLY place a
--   program is actually turned on, and it turns on exactly one: Flormar.
--
-- PARTNER SCOPING
--   There is no `partners` table on this platform — a "partner" is a listing
--   row in hotels / restaurants / cafes / services / city_services,
--   identified polymorphically as (listing_type, listing_id). Same pattern
--   as product_orders, reviews, business_offers, business_access_grants.
--   `loyalty_programs` carries that pair; every other loyalty table hangs
--   off `program_id`. Flormar Hargeisa is the city_services row with
--   slug 'flormar-hargeisa'.
--
-- SECURITY POSTURE (see RLS + functions below)
--   * Customers can READ their own membership, their own transactions, their
--     own redemptions, and the active rewards/offers/tiers of a program they
--     belong to. Customers have NO write access to any balance-bearing
--     table — not INSERT, not UPDATE, not DELETE.
--   * Every points change goes through a SECURITY DEFINER function that
--     locks the member row (`select ... for update`), writes a
--     loyalty_transactions audit row for the exact delta, refuses to drop a
--     balance below zero, and (for staff actions) verifies the caller is
--     staff/owner for that specific program.
--   * A reward can never be redeemed twice: loyalty_redemptions.status moves
--     issued -> redeemed exactly once, guarded inside loyalty_staff_redeem().
--   * Nothing here alters an existing table, column, policy, or row.
--
-- Idempotent where practical (create table if not exists / drop policy if
-- exists / create or replace function). New tables are NOT auto-exposed to
-- the Data API on this project (config.toml: auto_expose_new_tables unset),
-- so every table and function below carries an explicit GRANT.
-- ============================================================================


-- ###########################################################################
-- 1. TABLES
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- 1.1 loyalty_programs — one per partner listing. `enabled` is the master
--     switch the whole customer/staff experience keys off; a row with
--     enabled = false is invisible to everyone except platform owner + the
--     admin dashboard.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_programs (
  id                    uuid primary key default gen_random_uuid(),
  listing_type          text not null,
  listing_id            uuid not null,

  name                  text not null,
  name_ar               text,
  name_so               text,
  description           text,
  description_ar        text,
  description_so        text,

  enabled               boolean not null default false,

  -- Earning rule. points_earned = floor(spend_in_currency * points_per_currency * tier.multiplier).
  -- NEVER hardcoded as 1:1 anywhere — the RPC reads this column.
  points_per_currency   numeric(12, 4) not null default 1,
  currency              text not null default 'USD',

  -- Optional point expiration. When enabled, points older than
  -- expiration_months with no offsetting activity may be expired by an
  -- EXPIRATION transaction (a scheduled job — not built in this migration,
  -- the columns and transaction type exist so it can be added without a
  -- schema change).
  expiration_enabled    boolean not null default false,
  expiration_months     integer not null default 12,

  -- One-time points granted by loyalty_join() the moment a customer joins.
  welcome_bonus_points  integer not null default 0,

  -- How many days an issued (un-redeemed) reward redemption code stays valid.
  redemption_ttl_days   integer not null default 30,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint loyalty_programs_listing_type_check
    check (listing_type in ('hotel', 'restaurant', 'cafe', 'service', 'city_service')),
  constraint loyalty_programs_listing_unique
    unique (listing_type, listing_id),
  constraint loyalty_programs_points_rate_check
    check (points_per_currency >= 0),
  constraint loyalty_programs_expiration_months_check
    check (expiration_months between 1 and 120),
  constraint loyalty_programs_redemption_ttl_check
    check (redemption_ttl_days between 1 and 365)
);

create index if not exists idx_loyalty_programs_listing
  on loyalty_programs (listing_type, listing_id);
create index if not exists idx_loyalty_programs_enabled
  on loyalty_programs (id) where enabled;


-- ---------------------------------------------------------------------------
-- 1.2 loyalty_tiers — configurable membership tiers per program. Thresholds
--     are DB config, never hardcoded. `multiplier` boosts earning for that
--     tier (1.0 = no boost). max_points null = open-ended top tier.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_tiers (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references loyalty_programs(id) on delete cascade,

  key          text not null,               -- stable machine key, e.g. 'gold'
  name         text not null,
  name_ar      text,
  name_so      text,

  -- Tier is decided by lifetime_points (points ever earned), not the
  -- spendable current_points balance — redeeming rewards must not demote you.
  min_points   integer not null default 0,
  max_points   integer,                     -- null = no upper bound

  benefits     jsonb not null default '[]'::jsonb,   -- [{ "en": "...", "ar": "...", "so": "..." }, ...]
  multiplier   numeric(6, 3) not null default 1,

  -- Optional brand accent for this tier's card treatment (hex). Cosmetic only.
  color        text,

  sort_order   integer not null default 0,
  active       boolean not null default true,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint loyalty_tiers_program_key_unique unique (program_id, key),
  constraint loyalty_tiers_points_range_check
    check (max_points is null or max_points >= min_points),
  constraint loyalty_tiers_multiplier_check
    check (multiplier >= 0 and multiplier <= 100)
);

create index if not exists idx_loyalty_tiers_program
  on loyalty_tiers (program_id, sort_order);


-- ---------------------------------------------------------------------------
-- 1.3 loyalty_members — one row per (program, user). Reuses the existing
--     `profiles` / Supabase-auth identity — NO parallel customer table.
--
--     member_uid is the ONLY identifier that ever goes into the customer's
--     QR code: an opaque, random uuid, independent of user_id / auth.uid()
--     / membership_number / phone / email. Scanning it reveals nothing on
--     its own; a scanner still has to be authorized staff for the resolving
--     RPC to return anything.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_members (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid not null references loyalty_programs(id) on delete cascade,
  user_id            uuid not null references profiles(id) on delete cascade,

  membership_number  text not null,          -- human-facing, shown on the card, e.g. 'FLO-000001'
  member_uid         uuid not null default gen_random_uuid(),   -- QR payload

  current_points     integer not null default 0,   -- spendable balance
  lifetime_points    integer not null default 0,   -- ever-earned, drives tier; never decreases except EXPIRATION

  tier_id            uuid references loyalty_tiers(id) on delete set null,

  status             text not null default 'active',   -- active | suspended | closed

  joined_at          timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint loyalty_members_program_user_unique unique (program_id, user_id),
  constraint loyalty_members_membership_number_unique unique (program_id, membership_number),
  constraint loyalty_members_member_uid_unique unique (member_uid),
  constraint loyalty_members_status_check check (status in ('active', 'suspended', 'closed')),
  constraint loyalty_members_points_nonneg check (current_points >= 0 and lifetime_points >= 0)
);

create index if not exists idx_loyalty_members_program on loyalty_members (program_id);
create index if not exists idx_loyalty_members_user on loyalty_members (user_id);


-- ---------------------------------------------------------------------------
-- 1.4 loyalty_transactions — append-only ledger. EXACTLY one row per points
--     movement. `points` is signed (earn positive, spend/expire negative).
--     `balance_after` snapshots current_points immediately after this row.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_transactions (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references loyalty_programs(id) on delete cascade,
  member_id      uuid not null references loyalty_members(id) on delete cascade,

  type           text not null,
  points         integer not null,
  balance_after  integer not null,

  -- Optional link back to whatever caused this (a product_orders row, a
  -- loyalty_redemptions row, a manual note). Free-form, never an FK — the
  -- referenced row may live in any table or none.
  reference_type text,
  reference_id   uuid,

  description    text,
  metadata       jsonb not null default '{}'::jsonb,

  -- Staff/owner who performed a staff action; null for system/self. SET NULL
  -- on profile deletion so account deletion is never blocked by ledger history.
  created_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now(),

  constraint loyalty_transactions_type_check check (type in (
    'PURCHASE_EARN', 'WELCOME_BONUS', 'BONUS', 'REDEMPTION',
    'MANUAL_ADJUSTMENT', 'REFUND', 'EXPIRATION'
  ))
);

create index if not exists idx_loyalty_transactions_member
  on loyalty_transactions (member_id, created_at desc);
create index if not exists idx_loyalty_transactions_program
  on loyalty_transactions (program_id, created_at desc);
-- Supports the idempotency short-circuit in loyalty_record_purchase /
-- loyalty_adjust_points / loyalty_redeem_reward (metadata->>'client_ref').
create index if not exists idx_loyalty_transactions_client_ref
  on loyalty_transactions (member_id, (metadata ->> 'client_ref'))
  where metadata ? 'client_ref';


-- ---------------------------------------------------------------------------
-- 1.5 loyalty_rewards — the reward catalog a customer spends points on.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_rewards (
  id                uuid primary key default gen_random_uuid(),
  program_id        uuid not null references loyalty_programs(id) on delete cascade,

  name              text not null,
  name_ar           text,
  name_so           text,
  description       text,
  description_ar    text,
  description_so    text,
  image_url         text,

  reward_type       text not null,   -- discount_amount | discount_percent | free_product | gift | other
  points_required   integer not null,

  -- discount_amount -> currency value off; discount_percent -> 0-100;
  -- free_product / gift / other -> null (describe in free_product_text).
  discount_value    numeric(12, 2),
  free_product_text text,
  free_product_ar   text,
  free_product_so   text,

  terms             text,
  terms_ar          text,
  terms_so          text,

  active            boolean not null default true,
  start_date        date,
  end_date          date,

  -- null = unlimited. redemption_limit is the total across all members;
  -- per_member_limit caps a single member's redemptions of this reward.
  redemption_limit  integer,
  per_member_limit  integer not null default 1,

  -- Optional minimum tier to see/redeem this reward (customer eligibility).
  min_tier_id       uuid references loyalty_tiers(id) on delete set null,

  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint loyalty_rewards_type_check
    check (reward_type in ('discount_amount', 'discount_percent', 'free_product', 'gift', 'other')),
  constraint loyalty_rewards_points_check check (points_required >= 0),
  constraint loyalty_rewards_percent_check
    check (reward_type <> 'discount_percent' or (discount_value is not null and discount_value between 0 and 100)),
  constraint loyalty_rewards_date_range_check
    check (start_date is null or end_date is null or end_date >= start_date),
  constraint loyalty_rewards_limit_check
    check (redemption_limit is null or redemption_limit >= 0),
  constraint loyalty_rewards_per_member_check check (per_member_limit >= 1)
);

create index if not exists idx_loyalty_rewards_program
  on loyalty_rewards (program_id, sort_order);


-- ---------------------------------------------------------------------------
-- 1.6 loyalty_redemptions — one row per time a customer redeems a reward.
--     Created by loyalty_redeem_reward() (points already deducted). Staff
--     validate + fulfil in person via loyalty_staff_redeem().
--
--     reward_snapshot freezes the reward's name/type/value/points at
--     redemption time so a later admin edit to the reward never rewrites
--     what a customer was actually given.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_redemptions (
  id               uuid primary key default gen_random_uuid(),
  program_id       uuid not null references loyalty_programs(id) on delete cascade,
  reward_id        uuid not null references loyalty_rewards(id) on delete restrict,
  member_id        uuid not null references loyalty_members(id) on delete cascade,

  redemption_code  text not null,        -- short human-typable code, globally unique (see constraint below)
  points_spent     integer not null,
  reward_snapshot  jsonb not null default '{}'::jsonb,

  status           text not null default 'issued',   -- issued | redeemed | expired | cancelled

  issued_at        timestamptz not null default now(),
  expires_at       timestamptz,
  redeemed_at      timestamptz,
  redeemed_by      uuid references profiles(id) on delete set null,   -- staff who fulfilled it

  -- Set when a manager reverses an issued redemption (loyalty_cancel_redemption);
  -- the refunding REFUND transaction references this row.
  cancelled_at     timestamptz,
  cancelled_reason text,

  created_at       timestamptz not null default now(),

  -- Global unique (not per-program): lets loyalty_staff_redeem() /
  -- loyalty_cancel_redemption() resolve a scanned/typed code with no
  -- program_id argument, and the program is derived from the row.
  constraint loyalty_redemptions_code_unique unique (redemption_code),
  constraint loyalty_redemptions_status_check
    check (status in ('issued', 'redeemed', 'expired', 'cancelled')),
  constraint loyalty_redemptions_points_check check (points_spent >= 0)
);

create index if not exists idx_loyalty_redemptions_member
  on loyalty_redemptions (member_id, created_at desc);
create index if not exists idx_loyalty_redemptions_program_status
  on loyalty_redemptions (program_id, status);


-- ---------------------------------------------------------------------------
-- 1.7 loyalty_offers — non-transactional promotional content (e.g. "Double
--     points this week", "20% off new collection"). Pure display; no points
--     logic attached. Kept separate from rewards deliberately.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_offers (
  id             uuid primary key default gen_random_uuid(),
  program_id     uuid not null references loyalty_programs(id) on delete cascade,

  title          text not null,
  title_ar       text,
  title_so       text,
  description    text,
  description_ar text,
  description_so text,
  image_url      text,
  badge_text     text,
  badge_text_ar  text,
  badge_text_so  text,

  active         boolean not null default true,
  start_date     date,
  end_date       date,
  sort_order     integer not null default 0,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  constraint loyalty_offers_date_range_check
    check (start_date is null or end_date is null or end_date >= start_date)
);

create index if not exists idx_loyalty_offers_program
  on loyalty_offers (program_id, sort_order);


-- ---------------------------------------------------------------------------
-- 1.8 loyalty_staff — who may operate a program's counter (scan, add
--     purchase, add points, redeem). Program-scoped, independent of the
--     site-wide business_access_grants system (a loyalty operator is not
--     necessarily a listing editor, and vice versa). Platform owner and the
--     underlying listing's owner_id always have staff power implicitly (see
--     loyalty_is_staff()).
-- ---------------------------------------------------------------------------
create table if not exists loyalty_staff (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references loyalty_programs(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,

  role         text not null default 'staff',   -- staff | manager (manager may also adjust points / cancel)
  active       boolean not null default true,

  created_by   uuid references profiles(id) on delete set null,
  created_at   timestamptz not null default now(),

  constraint loyalty_staff_program_user_unique unique (program_id, user_id),
  constraint loyalty_staff_role_check check (role in ('staff', 'manager'))
);

create index if not exists idx_loyalty_staff_active
  on loyalty_staff (user_id) where active;
create index if not exists idx_loyalty_staff_program
  on loyalty_staff (program_id) where active;


-- ---------------------------------------------------------------------------
-- 1.9 loyalty_events — lightweight, append-only analytics for the
--     NON-transactional interactions the reward ledger doesn't already
--     capture (a QR view, a reward impression, an offer view). Same
--     "anyone may record, only the business reads" shape as the platform's
--     existing business_metric_events table — NOT a separate analytics
--     platform. Points earn/redeem/join are analysed straight off
--     loyalty_transactions; this only covers views/impressions.
-- ---------------------------------------------------------------------------
create table if not exists loyalty_events (
  id           uuid primary key default gen_random_uuid(),
  program_id   uuid not null references loyalty_programs(id) on delete cascade,
  member_id    uuid references loyalty_members(id) on delete set null,
  event_type   text not null,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),

  constraint loyalty_events_type_check check (event_type in (
    'signup', 'qr_viewed', 'card_viewed', 'reward_viewed', 'reward_redeemed',
    'offer_viewed', 'points_earned', 'staff_scan', 'join_prompt_viewed'
  ))
);

create index if not exists idx_loyalty_events_program
  on loyalty_events (program_id, event_type, created_at desc);


-- ###########################################################################
-- 2. HELPER FUNCTIONS  (SECURITY DEFINER — the authorization lives here)
-- ###########################################################################

-- 2.1 Is the current auth user the platform owner?
create or replace function loyalty_is_platform_owner()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- 2.2 Is the current auth user the owner_id of the listing behind this program?
create or replace function loyalty_is_listing_owner(p_program_id uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  v_type text;
  v_id   uuid;
  v_owner uuid;
begin
  select listing_type, listing_id into v_type, v_id
  from loyalty_programs where id = p_program_id;
  if v_type is null then return false; end if;

  if v_type = 'hotel' then
    select owner_id into v_owner from hotels where id = v_id;
  elsif v_type = 'restaurant' then
    select owner_id into v_owner from restaurants where id = v_id;
  elsif v_type = 'cafe' then
    select owner_id into v_owner from cafes where id = v_id;
  elsif v_type = 'service' then
    select owner_id into v_owner from services where id = v_id;
  elsif v_type = 'city_service' then
    select owner_id into v_owner from city_services where id = v_id;
  end if;

  return v_owner is not null and v_owner = auth.uid();
end;
$$;

-- 2.3 May the current auth user operate this program's counter?
--     Platform owner OR listing owner OR an active loyalty_staff row.
create or replace function loyalty_is_staff(p_program_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    loyalty_is_platform_owner()
    or loyalty_is_listing_owner(p_program_id)
    or exists (
      select 1 from loyalty_staff
      where program_id = p_program_id and user_id = auth.uid() and active
    );
$$;

-- 2.4 May the current auth user perform elevated staff actions
--     (manual adjustments, cancellations)? Owner/listing-owner OR a
--     loyalty_staff row with role = 'manager'.
create or replace function loyalty_is_manager(p_program_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    loyalty_is_platform_owner()
    or loyalty_is_listing_owner(p_program_id)
    or exists (
      select 1 from loyalty_staff
      where program_id = p_program_id and user_id = auth.uid() and active and role = 'manager'
    );
$$;

-- 2.5 The current auth user's member row for a program (or null).
create or replace function loyalty_current_member(p_program_id uuid)
returns loyalty_members
language sql stable security definer set search_path = public
as $$
  select * from loyalty_members
  where program_id = p_program_id and user_id = auth.uid()
  limit 1;
$$;

-- 2.6 Recompute + persist a member's tier from lifetime_points against the
--     program's configured tiers. Called after every earning event.
create or replace function loyalty_recalc_tier(p_member_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_program uuid;
  v_lifetime integer;
  v_tier uuid;
begin
  select program_id, lifetime_points into v_program, v_lifetime
  from loyalty_members where id = p_member_id;
  if v_program is null then return; end if;

  -- Tier = the highest tier whose min_points the member has reached.
  -- Deliberately does NOT filter on max_points: max_points is display-only
  -- ("progress to next tier"), so a misconfigured gap between one tier's
  -- max_points and the next tier's min_points can never leave a member with
  -- no tier at all.
  select id into v_tier
  from loyalty_tiers
  where program_id = v_program
    and active
    and min_points <= v_lifetime
  order by min_points desc
  limit 1;

  update loyalty_members
  set tier_id = v_tier, updated_at = now()
  where id = p_member_id;
end;
$$;

-- 2.7 Generate a short, human-typable, globally-unique redemption code
--     (e.g. 'FLO-7QX4-2K9'). Collision-retries a bounded number of times.
create or replace function loyalty_gen_redemption_code(p_prefix text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   -- no I/O/0/1
  v_code text;
  v_try int := 0;
  v_body text;
  i int;
begin
  loop
    v_try := v_try + 1;
    v_body := '';
    for i in 1..7 loop
      v_body := v_body || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    v_code := upper(substr(coalesce(nullif(regexp_replace(p_prefix, '[^A-Za-z]', '', 'g'), ''), 'RWD'), 1, 3))
              || '-' || substr(v_body, 1, 4) || '-' || substr(v_body, 5, 3);
    exit when not exists (select 1 from loyalty_redemptions where redemption_code = v_code);
    if v_try >= 20 then
      v_code := v_code || '-' || substr(md5(random()::text), 1, 4);
      exit;
    end if;
  end loop;
  return v_code;
end;
$$;


-- ###########################################################################
-- 3. RPC ENGINE  (the only writers of any balance-bearing table)
-- ###########################################################################

-- ---------------------------------------------------------------------------
-- 3.1 loyalty_join — a signed-in customer joins a program. Idempotent:
--     returns the existing member row if already joined. Applies the
--     program's welcome bonus (if any) as a WELCOME_BONUS transaction.
-- ---------------------------------------------------------------------------
create or replace function loyalty_join(p_listing_type text, p_listing_id uuid)
returns loyalty_members
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_program loyalty_programs;
  v_member loyalty_members;
  v_seq bigint;
  v_number text;
  v_prefix text;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to join';
  end if;

  select * into v_program
  from loyalty_programs
  where listing_type = p_listing_type and listing_id = p_listing_id;

  if v_program.id is null or not v_program.enabled then
    raise exception 'This loyalty program is not available';
  end if;

  select * into v_member
  from loyalty_members
  where program_id = v_program.id and user_id = auth.uid();

  if v_member.id is not null then
    return v_member;
  end if;

  -- Serialize concurrent first-joins for the SAME program so the running
  -- membership-number count below can't hand two racers the same number.
  -- Transaction-scoped, released at commit; keyed on the program id.
  perform pg_advisory_xact_lock(hashtext('loyalty_join:' || v_program.id::text));

  -- Re-check after taking the lock — another racer may have just created it.
  select * into v_member
  from loyalty_members
  where program_id = v_program.id and user_id = auth.uid();
  if v_member.id is not null then
    return v_member;
  end if;

  -- Membership number: program-scoped running count + short prefix from the
  -- program name (letters only, first 3, uppercased).
  select coalesce(count(*), 0) + 1 into v_seq
  from loyalty_members where program_id = v_program.id;
  v_prefix := upper(substr(regexp_replace(v_program.name, '[^A-Za-z]', '', 'g'), 1, 3));
  if v_prefix = '' then v_prefix := 'MEM'; end if;
  v_number := v_prefix || '-' || lpad(v_seq::text, 6, '0');

  begin
    insert into loyalty_members (program_id, user_id, membership_number, current_points, lifetime_points, status)
    values (v_program.id, auth.uid(), v_number, 0, 0, 'active')
    returning * into v_member;
  exception when unique_violation then
    -- Lost a race despite the lock (belt-and-suspenders) — return the row
    -- the winner created rather than erroring.
    select * into v_member
    from loyalty_members
    where program_id = v_program.id and user_id = auth.uid();
    if v_member.id is not null then
      return v_member;
    end if;
    raise;
  end;

  if coalesce(v_program.welcome_bonus_points, 0) > 0 then
    update loyalty_members
    set current_points = current_points + v_program.welcome_bonus_points,
        lifetime_points = lifetime_points + v_program.welcome_bonus_points,
        updated_at = now()
    where id = v_member.id
    returning * into v_member;

    insert into loyalty_transactions (program_id, member_id, type, points, balance_after, description)
    values (v_program.id, v_member.id, 'WELCOME_BONUS', v_program.welcome_bonus_points,
            v_member.current_points, 'Welcome bonus');
  end if;

  perform loyalty_recalc_tier(v_member.id);
  select * into v_member from loyalty_members where id = v_member.id;
  return v_member;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.2 loyalty_record_purchase — STAFF ONLY. Records a purchase against a
--     member (identified by their QR member_uid) and awards points per the
--     program's configured rate and the member's tier multiplier.
--     Idempotent per p_client_ref (a staff-device-generated key) so a
--     double-tap can't double-award.
-- ---------------------------------------------------------------------------
create or replace function loyalty_record_purchase(
  p_member_uid uuid,
  p_amount numeric,
  p_currency text default null,
  p_reference text default null,
  p_note text default null,
  p_client_ref text default null
)
returns loyalty_transactions
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_member loyalty_members;
  v_program loyalty_programs;
  v_multiplier numeric;
  v_points integer;
  v_txn loyalty_transactions;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Purchase amount must be greater than zero';
  end if;
  if p_amount > 1000000 then
    raise exception 'Purchase amount is implausibly large';
  end if;

  -- Lock the member row for the duration of this transaction.
  select * into v_member from loyalty_members
  where member_uid = p_member_uid
  for update;

  if v_member.id is null then
    raise exception 'Member not found';
  end if;
  if v_member.status <> 'active' then
    raise exception 'This membership is not active';
  end if;

  select * into v_program from loyalty_programs where id = v_member.program_id;

  if not v_program.enabled then
    raise exception 'This loyalty program is not currently active';
  end if;
  if not loyalty_is_staff(v_program.id) then
    raise exception 'Not authorized to record purchases for this program';
  end if;

  -- Idempotency: same staff client ref already recorded -> return it.
  if p_client_ref is not null then
    select * into v_txn from loyalty_transactions
    where member_id = v_member.id and type = 'PURCHASE_EARN'
      and metadata ->> 'client_ref' = p_client_ref
    limit 1;
    if v_txn.id is not null then
      return v_txn;
    end if;
  end if;

  v_multiplier := coalesce(
    (select multiplier from loyalty_tiers where id = v_member.tier_id),
    1
  );

  -- Clamp in numeric BEFORE the ::integer cast — a misconfigured
  -- points_per_currency could otherwise push the product past int4's range
  -- and raise "integer out of range" instead of a sensible result.
  v_points := least(1000000000::numeric,
                    greatest(0::numeric, floor(p_amount * v_program.points_per_currency * v_multiplier)))::integer;

  update loyalty_members
  set current_points = current_points + v_points,
      lifetime_points = lifetime_points + v_points,
      updated_at = now()
  where id = v_member.id
  returning * into v_member;

  insert into loyalty_transactions (
    program_id, member_id, type, points, balance_after,
    reference_type, description, metadata, created_by
  ) values (
    v_program.id, v_member.id, 'PURCHASE_EARN', v_points, v_member.current_points,
    'purchase',
    coalesce(nullif(btrim(p_note), ''), 'In-store purchase'),
    jsonb_strip_nulls(jsonb_build_object(
      'amount', p_amount,
      'currency', coalesce(nullif(p_currency, ''), v_program.currency),
      'reference', nullif(btrim(coalesce(p_reference, '')), ''),
      'multiplier', v_multiplier,
      'client_ref', p_client_ref
    )),
    auth.uid()
  )
  returning * into v_txn;

  perform loyalty_recalc_tier(v_member.id);
  return v_txn;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.3 loyalty_adjust_points — MANAGER/OWNER ONLY. Manual adjustment, bonus,
--     or refund. p_points is signed. Never lets current_points go negative.
-- ---------------------------------------------------------------------------
create or replace function loyalty_adjust_points(
  p_member_uid uuid,
  p_points integer,
  p_type text default 'MANUAL_ADJUSTMENT',
  p_description text default null,
  p_client_ref text default null
)
returns loyalty_transactions
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_member loyalty_members;
  v_program loyalty_programs;
  v_txn loyalty_transactions;
  v_new_balance integer;
  v_new_lifetime integer;
begin
  if p_points is null or p_points = 0 then
    raise exception 'Adjustment must be a non-zero amount';
  end if;
  if abs(p_points) > 1000000 then
    raise exception 'Adjustment is implausibly large';
  end if;
  if p_type not in ('MANUAL_ADJUSTMENT', 'BONUS', 'REFUND') then
    raise exception 'Invalid adjustment type';
  end if;

  select * into v_member from loyalty_members
  where member_uid = p_member_uid
  for update;

  if v_member.id is null then
    raise exception 'Member not found';
  end if;

  select * into v_program from loyalty_programs where id = v_member.program_id;

  if not loyalty_is_manager(v_program.id) then
    raise exception 'Not authorized to adjust points for this program';
  end if;

  if p_client_ref is not null then
    select * into v_txn from loyalty_transactions
    where member_id = v_member.id and metadata ->> 'client_ref' = p_client_ref
    limit 1;
    if v_txn.id is not null then
      return v_txn;
    end if;
  end if;

  v_new_balance := v_member.current_points + p_points;
  if v_new_balance < 0 then
    raise exception 'Adjustment would drop the balance below zero (current %, requested %)',
      v_member.current_points, p_points;
  end if;

  -- Positive adjustments/bonuses count toward lifetime (and tier); negative
  -- ones (a correction, a refund reversal) do NOT reduce lifetime_points —
  -- same rule as a reward redemption.
  v_new_lifetime := v_member.lifetime_points + greatest(p_points, 0);

  update loyalty_members
  set current_points = v_new_balance,
      lifetime_points = v_new_lifetime,
      updated_at = now()
  where id = v_member.id
  returning * into v_member;

  insert into loyalty_transactions (
    program_id, member_id, type, points, balance_after, description, metadata, created_by
  ) values (
    v_program.id, v_member.id, p_type, p_points, v_member.current_points,
    coalesce(nullif(btrim(p_description), ''), 'Manual adjustment'),
    jsonb_strip_nulls(jsonb_build_object('client_ref', p_client_ref)),
    auth.uid()
  )
  returning * into v_txn;

  if p_points > 0 then
    perform loyalty_recalc_tier(v_member.id);
  end if;
  return v_txn;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.4 loyalty_redeem_reward — CUSTOMER ONLY (acts on their own membership).
--     Atomically: verify eligibility + points + limits, deduct points, write
--     a REDEMPTION transaction, create a loyalty_redemptions row with a
--     unique code. The points are spent here; staff only validate later.
-- ---------------------------------------------------------------------------
create or replace function loyalty_redeem_reward(p_reward_id uuid, p_client_ref text default null)
returns loyalty_redemptions
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_reward loyalty_rewards;
  v_program loyalty_programs;
  v_member loyalty_members;
  v_total_used integer;
  v_mine_used integer;
  v_code text;
  v_redemption loyalty_redemptions;
  v_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in';
  end if;

  select * into v_reward from loyalty_rewards where id = p_reward_id;
  if v_reward.id is null then
    raise exception 'Reward not found';
  end if;

  select * into v_program from loyalty_programs where id = v_reward.program_id;
  if not v_program.enabled then
    raise exception 'This loyalty program is not available';
  end if;

  -- Lock the member row so a concurrent redemption can't overspend.
  select * into v_member from loyalty_members
  where program_id = v_program.id and user_id = auth.uid()
  for update;

  if v_member.id is null then
    raise exception 'You are not a member of this program';
  end if;
  if v_member.status <> 'active' then
    raise exception 'This membership is not active';
  end if;

  -- Idempotency: a double-tapped "Redeem" with the same client ref returns
  -- the redemption already created rather than spending points twice.
  if p_client_ref is not null then
    select r.* into v_redemption
    from loyalty_redemptions r
    join loyalty_transactions tx
      on tx.reference_id = r.id and tx.type = 'REDEMPTION'
    where r.member_id = v_member.id
      and r.reward_id = v_reward.id
      and tx.metadata ->> 'client_ref' = p_client_ref
    limit 1;
    if v_redemption.id is not null then
      return v_redemption;
    end if;
  end if;

  if not v_reward.active then
    raise exception 'This reward is not currently available';
  end if;
  if v_reward.start_date is not null and current_date < v_reward.start_date then
    raise exception 'This reward is not available yet';
  end if;
  if v_reward.end_date is not null and current_date > v_reward.end_date then
    raise exception 'This reward has expired';
  end if;

  -- Tier eligibility.
  if v_reward.min_tier_id is not null then
    if v_member.tier_id is null
       or (select min_points from loyalty_tiers where id = v_member.tier_id)
          < (select min_points from loyalty_tiers where id = v_reward.min_tier_id) then
      raise exception 'Your membership tier is not eligible for this reward';
    end if;
  end if;

  -- Total redemption cap. The per-member lock above doesn't serialize two
  -- DIFFERENT members racing for the last slot of a globally-capped reward,
  -- so take a reward-scoped advisory lock for the count-then-insert when a
  -- total limit is set (unlimited rewards pay no locking cost).
  if v_reward.redemption_limit is not null then
    perform pg_advisory_xact_lock(hashtext('loyalty_reward:' || v_reward.id::text));
    select count(*) into v_total_used
    from loyalty_redemptions
    where reward_id = v_reward.id and status <> 'cancelled';
    if v_total_used >= v_reward.redemption_limit then
      raise exception 'This reward is fully redeemed';
    end if;
  end if;

  -- Per-member cap.
  select count(*) into v_mine_used
  from loyalty_redemptions
  where reward_id = v_reward.id and member_id = v_member.id and status <> 'cancelled';
  if v_mine_used >= v_reward.per_member_limit then
    raise exception 'You have already redeemed this reward';
  end if;

  if v_member.current_points < v_reward.points_required then
    raise exception 'Not enough points to redeem this reward';
  end if;

  -- Deduct points (lifetime_points is untouched — tier must not drop).
  update loyalty_members
  set current_points = current_points - v_reward.points_required,
      updated_at = now()
  where id = v_member.id
  returning * into v_member;

  v_code := loyalty_gen_redemption_code(v_program.name);

  v_snapshot := jsonb_build_object(
    'name', v_reward.name, 'name_ar', v_reward.name_ar, 'name_so', v_reward.name_so,
    'reward_type', v_reward.reward_type,
    'discount_value', v_reward.discount_value,
    'free_product_text', v_reward.free_product_text,
    'points_required', v_reward.points_required,
    'image_url', v_reward.image_url
  );

  insert into loyalty_redemptions (
    program_id, reward_id, member_id, redemption_code, points_spent,
    reward_snapshot, status, expires_at
  ) values (
    v_program.id, v_reward.id, v_member.id, v_code, v_reward.points_required,
    v_snapshot, 'issued',
    now() + make_interval(days => v_program.redemption_ttl_days)
  )
  returning * into v_redemption;

  insert into loyalty_transactions (
    program_id, member_id, type, points, balance_after, reference_type, reference_id, description, metadata
  ) values (
    v_program.id, v_member.id, 'REDEMPTION', -v_reward.points_required, v_member.current_points,
    'redemption', v_redemption.id, v_reward.name,
    jsonb_strip_nulls(jsonb_build_object('client_ref', p_client_ref))
  );

  return v_redemption;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.5 loyalty_staff_redeem — STAFF ONLY. Validates a redemption code and
--     marks it fulfilled. A code can be fulfilled EXACTLY ONCE: the update
--     is guarded on status = 'issued', and a not-found/wrong-status result
--     raises. Also lazily expires a code past its expires_at.
-- ---------------------------------------------------------------------------
create or replace function loyalty_staff_redeem(p_redemption_code text)
returns loyalty_redemptions
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_redemption loyalty_redemptions;
begin
  -- Codes are globally unique, so the row (and its program) is resolved
  -- from the code alone; authorization is then checked against that program.
  select * into v_redemption from loyalty_redemptions
  where redemption_code = upper(btrim(p_redemption_code))
  for update;

  if v_redemption.id is null then
    raise exception 'Redemption code not found';
  end if;

  if not loyalty_is_staff(v_redemption.program_id) then
    raise exception 'Not authorized to redeem for this program';
  end if;

  if v_redemption.status = 'issued'
     and v_redemption.expires_at is not null
     and v_redemption.expires_at < now() then
    update loyalty_redemptions set status = 'expired' where id = v_redemption.id
    returning * into v_redemption;
  end if;

  if v_redemption.status = 'redeemed' then
    raise exception 'This reward has already been redeemed';
  end if;
  if v_redemption.status = 'expired' then
    raise exception 'This redemption code has expired';
  end if;
  if v_redemption.status = 'cancelled' then
    raise exception 'This redemption was cancelled';
  end if;

  update loyalty_redemptions
  set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid()
  where id = v_redemption.id and status = 'issued'
  returning * into v_redemption;

  if v_redemption.id is null then
    raise exception 'This reward has already been redeemed';
  end if;

  return v_redemption;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.5b loyalty_cancel_redemption — MANAGER/OWNER ONLY. Reverses an issued
--      redemption and refunds the points the customer spent, via a REFUND
--      transaction. A redemption already marked 'redeemed' cannot be
--      cancelled here (the reward was physically given out) — that needs a
--      manual loyalty_adjust_points call with a written reason.
-- ---------------------------------------------------------------------------
create or replace function loyalty_cancel_redemption(p_redemption_code text, p_reason text default null)
returns loyalty_redemptions
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_redemption loyalty_redemptions;
  v_member loyalty_members;
begin
  select * into v_redemption from loyalty_redemptions
  where redemption_code = upper(btrim(p_redemption_code))
  for update;

  if v_redemption.id is null then
    raise exception 'Redemption code not found';
  end if;
  if not loyalty_is_manager(v_redemption.program_id) then
    raise exception 'Not authorized to cancel redemptions for this program';
  end if;
  if v_redemption.status = 'redeemed' then
    raise exception 'This redemption was already fulfilled and cannot be cancelled here';
  end if;
  if v_redemption.status = 'cancelled' then
    raise exception 'This redemption is already cancelled';
  end if;

  select * into v_member from loyalty_members where id = v_redemption.member_id for update;

  update loyalty_redemptions
  set status = 'cancelled', cancelled_at = now(),
      cancelled_reason = nullif(btrim(coalesce(p_reason, '')), '')
  where id = v_redemption.id
  returning * into v_redemption;

  update loyalty_members
  set current_points = current_points + v_redemption.points_spent, updated_at = now()
  where id = v_member.id
  returning * into v_member;

  insert into loyalty_transactions (
    program_id, member_id, type, points, balance_after, reference_type, reference_id, description, created_by
  ) values (
    v_redemption.program_id, v_member.id, 'REFUND', v_redemption.points_spent, v_member.current_points,
    'redemption', v_redemption.id,
    coalesce(nullif(btrim(p_reason), ''), 'Redemption cancelled'),
    auth.uid()
  );

  return v_redemption;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3.6 loyalty_staff_lookup — STAFF ONLY. Resolves a scanned member_uid into
--     the counter view: member basics, tier, recent transactions, available
--     rewards, open redemptions. Returns a single jsonb document so the
--     staff screen is one round-trip. No PII beyond the customer's display
--     name.
-- ---------------------------------------------------------------------------
create or replace function loyalty_staff_lookup(p_member_uid uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_member loyalty_members;
  v_program loyalty_programs;
  v_result jsonb;
begin
  select * into v_member from loyalty_members where member_uid = p_member_uid;
  if v_member.id is null then
    raise exception 'Member not found';
  end if;

  select * into v_program from loyalty_programs where id = v_member.program_id;

  if not loyalty_is_staff(v_program.id) then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'member', jsonb_build_object(
      'id', v_member.id,
      'member_uid', v_member.member_uid,
      'membership_number', v_member.membership_number,
      'name', (select full_name from profiles where id = v_member.user_id),
      'current_points', v_member.current_points,
      'lifetime_points', v_member.lifetime_points,
      'status', v_member.status,
      'joined_at', v_member.joined_at,
      'tier', (select jsonb_build_object('key', key, 'name', name, 'multiplier', multiplier, 'color', color)
               from loyalty_tiers where id = v_member.tier_id)
    ),
    'program', jsonb_build_object(
      'id', v_program.id, 'name', v_program.name,
      'currency', v_program.currency, 'points_per_currency', v_program.points_per_currency
    ),
    'recent_transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'type', type, 'points', points, 'balance_after', balance_after,
        'description', description, 'created_at', created_at
      ) order by created_at desc)
      from (select * from loyalty_transactions where member_id = v_member.id
            order by created_at desc limit 10) recent
    ), '[]'::jsonb),
    'open_redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', redemption_code, 'status', status, 'snapshot', reward_snapshot,
        'issued_at', issued_at, 'expires_at', expires_at
      ) order by issued_at desc)
      from loyalty_redemptions
      where member_id = v_member.id and status = 'issued'
    ), '[]'::jsonb),
    -- Rewards this member could redeem right now: active, in date, affordable,
    -- tier-eligible, and not already at their per-member limit. Mirrors every
    -- gate loyalty_redeem_reward() enforces so staff never offer something
    -- the RPC will then refuse.
    'available_rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'points_required', points_required,
        'reward_type', reward_type, 'discount_value', discount_value
      ) order by points_required asc)
      from loyalty_rewards r
      where r.program_id = v_program.id and r.active
        and (r.start_date is null or current_date >= r.start_date)
        and (r.end_date is null or current_date <= r.end_date)
        and r.points_required <= v_member.current_points
        and (
          r.min_tier_id is null
          or (v_member.tier_id is not null
              and (select min_points from loyalty_tiers where id = v_member.tier_id)
                  >= (select min_points from loyalty_tiers where id = r.min_tier_id))
        )
        and (
          (r.redemption_limit is null or
           (select count(*) from loyalty_redemptions x where x.reward_id = r.id and x.status <> 'cancelled') < r.redemption_limit)
        )
        and (select count(*) from loyalty_redemptions x
             where x.reward_id = r.id and x.member_id = v_member.id and x.status <> 'cancelled') < r.per_member_limit
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;


-- ###########################################################################
-- 4. ROW LEVEL SECURITY
-- ###########################################################################

alter table loyalty_programs     enable row level security;
alter table loyalty_tiers        enable row level security;
alter table loyalty_members      enable row level security;
alter table loyalty_transactions enable row level security;
alter table loyalty_rewards      enable row level security;
alter table loyalty_redemptions  enable row level security;
alter table loyalty_offers       enable row level security;
alter table loyalty_staff        enable row level security;
alter table loyalty_events       enable row level security;

-- ---- loyalty_programs ----
drop policy if exists "Public reads enabled programs" on loyalty_programs;
create policy "Public reads enabled programs" on loyalty_programs
  for select using (enabled = true);

drop policy if exists "Staff read their program" on loyalty_programs;
create policy "Staff read their program" on loyalty_programs
  for select using (loyalty_is_staff(id));

drop policy if exists "Platform owner manages programs" on loyalty_programs;
create policy "Platform owner manages programs" on loyalty_programs
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- ---- loyalty_tiers ----
drop policy if exists "Public reads active tiers of enabled programs" on loyalty_tiers;
create policy "Public reads active tiers of enabled programs" on loyalty_tiers
  for select using (
    active = true
    and exists (select 1 from loyalty_programs p where p.id = loyalty_tiers.program_id and p.enabled)
  );

drop policy if exists "Staff read program tiers" on loyalty_tiers;
create policy "Staff read program tiers" on loyalty_tiers
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner manages tiers" on loyalty_tiers;
create policy "Platform owner manages tiers" on loyalty_tiers
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- ---- loyalty_members ----
-- A customer sees ONLY their own row. No customer INSERT/UPDATE/DELETE — the
-- only way in is loyalty_join(); the only way points move is the RPCs.
drop policy if exists "Members read their own membership" on loyalty_members;
create policy "Members read their own membership" on loyalty_members
  for select using (user_id = auth.uid());

drop policy if exists "Staff read program members" on loyalty_members;
create policy "Staff read program members" on loyalty_members
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner manages members" on loyalty_members;
create policy "Platform owner manages members" on loyalty_members
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- ---- loyalty_transactions ----
drop policy if exists "Members read their own transactions" on loyalty_transactions;
create policy "Members read their own transactions" on loyalty_transactions
  for select using (
    exists (select 1 from loyalty_members m where m.id = loyalty_transactions.member_id and m.user_id = auth.uid())
  );

drop policy if exists "Staff read program transactions" on loyalty_transactions;
create policy "Staff read program transactions" on loyalty_transactions
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner reads all transactions" on loyalty_transactions;
create policy "Platform owner reads all transactions" on loyalty_transactions
  for select using (loyalty_is_platform_owner());
-- No INSERT/UPDATE/DELETE policy at all: only SECURITY DEFINER functions write here.

-- ---- loyalty_rewards ----
drop policy if exists "Public reads active rewards of enabled programs" on loyalty_rewards;
create policy "Public reads active rewards of enabled programs" on loyalty_rewards
  for select using (
    active = true
    and (start_date is null or current_date >= start_date)
    and (end_date is null or current_date <= end_date)
    and exists (select 1 from loyalty_programs p where p.id = loyalty_rewards.program_id and p.enabled)
  );

drop policy if exists "Staff read program rewards" on loyalty_rewards;
create policy "Staff read program rewards" on loyalty_rewards
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner manages rewards" on loyalty_rewards;
create policy "Platform owner manages rewards" on loyalty_rewards
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- ---- loyalty_redemptions ----
drop policy if exists "Members read their own redemptions" on loyalty_redemptions;
create policy "Members read their own redemptions" on loyalty_redemptions
  for select using (
    exists (select 1 from loyalty_members m where m.id = loyalty_redemptions.member_id and m.user_id = auth.uid())
  );

drop policy if exists "Staff read program redemptions" on loyalty_redemptions;
create policy "Staff read program redemptions" on loyalty_redemptions
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner reads all redemptions" on loyalty_redemptions;
create policy "Platform owner reads all redemptions" on loyalty_redemptions
  for select using (loyalty_is_platform_owner());
-- Writes only via loyalty_redeem_reward() / loyalty_staff_redeem().

-- ---- loyalty_offers ----
drop policy if exists "Public reads active offers of enabled programs" on loyalty_offers;
create policy "Public reads active offers of enabled programs" on loyalty_offers
  for select using (
    active = true
    and (start_date is null or current_date >= start_date)
    and (end_date is null or current_date <= end_date)
    and exists (select 1 from loyalty_programs p where p.id = loyalty_offers.program_id and p.enabled)
  );

drop policy if exists "Staff read program offers" on loyalty_offers;
create policy "Staff read program offers" on loyalty_offers
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner manages offers" on loyalty_offers;
create policy "Platform owner manages offers" on loyalty_offers
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- ---- loyalty_staff ----
drop policy if exists "Staff read their own staff row" on loyalty_staff;
create policy "Staff read their own staff row" on loyalty_staff
  for select using (user_id = auth.uid());

drop policy if exists "Managers read program staff" on loyalty_staff;
create policy "Managers read program staff" on loyalty_staff
  for select using (loyalty_is_manager(program_id));

drop policy if exists "Platform owner manages staff" on loyalty_staff;
create policy "Platform owner manages staff" on loyalty_staff
  for all using (loyalty_is_platform_owner()) with check (loyalty_is_platform_owner());

-- The underlying listing's own owner may manage their program's counter
-- staff (add/remove/deactivate) — but only for their own program, and this
-- says nothing about who can be platform owner.
drop policy if exists "Listing owner manages their program staff" on loyalty_staff;
create policy "Listing owner manages their program staff" on loyalty_staff
  for all using (loyalty_is_listing_owner(program_id))
  with check (loyalty_is_listing_owner(program_id));

-- ---- loyalty_events ----
-- Same posture as the platform's existing business_metric_events: anyone
-- may record an impression event (for an enabled program); only the
-- program's staff / platform owner may read them back.
drop policy if exists "Anyone records a loyalty event" on loyalty_events;
create policy "Anyone records a loyalty event" on loyalty_events
  for insert with check (
    exists (select 1 from loyalty_programs p where p.id = loyalty_events.program_id and p.enabled)
    -- if the event is attributed to a member, it must be the caller's own
    and (
      member_id is null
      or exists (select 1 from loyalty_members m where m.id = loyalty_events.member_id and m.user_id = auth.uid())
    )
  );

drop policy if exists "Staff read program events" on loyalty_events;
create policy "Staff read program events" on loyalty_events
  for select using (loyalty_is_staff(program_id));

drop policy if exists "Platform owner reads all events" on loyalty_events;
create policy "Platform owner reads all events" on loyalty_events
  for select using (loyalty_is_platform_owner());


-- ###########################################################################
-- 5. GRANTS  (new tables are not auto-exposed on this project)
-- ###########################################################################

-- Read paths. anon may browse a program's public marketing surface
-- (program, tiers, rewards, offers); membership/transactions/redemptions are
-- authenticated-only and further narrowed by RLS above.
grant select on loyalty_programs    to anon, authenticated;
grant select on loyalty_tiers       to anon, authenticated;
grant select on loyalty_rewards     to anon, authenticated;
grant select on loyalty_offers      to anon, authenticated;
grant select on loyalty_members      to authenticated;
grant select on loyalty_transactions to authenticated;
grant select on loyalty_redemptions  to authenticated;
grant select on loyalty_staff        to authenticated;
grant select on loyalty_events       to authenticated;
grant insert on loyalty_events       to anon, authenticated;

-- Full DML for the platform owner / listing owner flows through PostgREST as
-- the authenticated role too (RLS restricts it to the right people).
grant insert, update, delete on loyalty_programs, loyalty_tiers, loyalty_rewards,
  loyalty_offers, loyalty_members, loyalty_staff to authenticated;

-- RPCs.
revoke all on function loyalty_join(text, uuid) from public;
grant execute on function loyalty_join(text, uuid) to authenticated;

revoke all on function loyalty_record_purchase(uuid, numeric, text, text, text, text) from public;
grant execute on function loyalty_record_purchase(uuid, numeric, text, text, text, text) to authenticated;

revoke all on function loyalty_adjust_points(uuid, integer, text, text, text) from public;
grant execute on function loyalty_adjust_points(uuid, integer, text, text, text) to authenticated;

revoke all on function loyalty_redeem_reward(uuid, text) from public;
grant execute on function loyalty_redeem_reward(uuid, text) to authenticated;

revoke all on function loyalty_staff_redeem(text) from public;
grant execute on function loyalty_staff_redeem(text) to authenticated;

revoke all on function loyalty_cancel_redemption(text, text) from public;
grant execute on function loyalty_cancel_redemption(text, text) to authenticated;

revoke all on function loyalty_staff_lookup(uuid) from public;
grant execute on function loyalty_staff_lookup(uuid) to authenticated;

revoke all on function loyalty_gen_redemption_code(text) from public;

-- Internal-only: recomputes a member's tier from existing lifetime_points.
-- Only ever called by the earning RPCs above (as their definer owner), never
-- from the app — no grant, and revoked from the implicit PUBLIC default.
revoke all on function loyalty_recalc_tier(uuid) from public;

-- Helper functions are called by the RPCs (definer) but are harmless to
-- expose read-side; keep them callable by authenticated for the app's own
-- lightweight checks.
grant execute on function loyalty_is_platform_owner() to authenticated;
grant execute on function loyalty_is_listing_owner(uuid) to authenticated;
grant execute on function loyalty_is_staff(uuid) to authenticated;
grant execute on function loyalty_is_manager(uuid) to authenticated;
grant execute on function loyalty_current_member(uuid) to authenticated;

-- ###########################################################################
-- 6. updated_at touch triggers (reuse the platform's existing helper if one
--    exists; define a local one guarded so re-run is safe).
-- ###########################################################################
create or replace function loyalty_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['loyalty_programs','loyalty_tiers','loyalty_members','loyalty_rewards','loyalty_offers']
  loop
    execute format('drop trigger if exists trg_%s_touch on %s', t, t);
    execute format('create trigger trg_%s_touch before update on %s for each row execute function loyalty_touch_updated_at()', t, t);
  end loop;
end $$;

-- ============================================================================
-- END 20260908000001_loyalty_core.sql
-- ============================================================================
