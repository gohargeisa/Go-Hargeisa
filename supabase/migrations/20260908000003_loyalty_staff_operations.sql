-- ============================================================================
-- Go Hargeisa — Loyalty: staff-console operations (Phase 8).
--
-- NOT APPLIED YET (same standing rule; depends on
-- 20260908000001_loyalty_core.sql). Purely additive — one internal helper,
-- one `create or replace` of an existing function to route through it, and
-- two new STAFF-ONLY RPCs. No table/column/policy changes.
--
-- Adds:
--   * loyalty_member_console_doc()      — internal: the counter-view JSON for
--                                         one member (no auth check; callers
--                                         authorise).
--   * loyalty_staff_lookup()            — replaced to call the helper.
--   * loyalty_staff_lookup_by_number()  — STAFF: look a member up by their
--                                         printed membership number (the
--                                         manual-entry fallback when the QR
--                                         camera path isn't available).
--   * loyalty_staff_redeem_reward()     — STAFF: redeem a reward on a
--                                         member's behalf at the counter,
--                                         immediately fulfilled. Same points
--                                         math + every eligibility gate as
--                                         the customer-initiated
--                                         loyalty_redeem_reward().
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. Internal: the counter view for one member. No authorization here — every
--    caller checks loyalty_is_staff() for the member's program first.
-- ---------------------------------------------------------------------------
create or replace function loyalty_member_console_doc(p_member_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_member loyalty_members;
  v_program loyalty_programs;
begin
  select * into v_member from loyalty_members where id = p_member_id;
  if v_member.id is null then
    raise exception 'Member not found';
  end if;
  select * into v_program from loyalty_programs where id = v_member.program_id;

  return jsonb_build_object(
    'member', jsonb_build_object(
      'id', v_member.id,
      'member_uid', v_member.member_uid,
      'membership_number', v_member.membership_number,
      'name', (select full_name from profiles where id = v_member.user_id),
      'current_points', v_member.current_points,
      'lifetime_points', v_member.lifetime_points,
      'status', v_member.status,
      'joined_at', v_member.joined_at,
      'tier', (select jsonb_build_object('key', key, 'name', name, 'name_ar', name_ar, 'name_so', name_so,
                        'multiplier', multiplier, 'color', color)
               from loyalty_tiers where id = v_member.tier_id)
    ),
    'program', jsonb_build_object(
      'id', v_program.id, 'name', v_program.name,
      'currency', v_program.currency, 'points_per_currency', v_program.points_per_currency
    ),
    'recent_transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'type', type, 'points', points, 'balance_after', balance_after,
        'description', description, 'created_at', created_at
      ) order by created_at desc)
      from (select * from loyalty_transactions where member_id = v_member.id
            order by created_at desc limit 10) recent
    ), '[]'::jsonb),
    'open_redemptions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'code', redemption_code, 'status', status, 'snapshot', reward_snapshot,
        'points_spent', points_spent, 'issued_at', issued_at, 'expires_at', expires_at
      ) order by issued_at desc)
      from loyalty_redemptions
      where member_id = v_member.id and status = 'issued'
    ), '[]'::jsonb),
    -- Rewards this member could redeem right now — mirrors every gate
    -- loyalty_redeem_reward() / loyalty_staff_redeem_reward() enforce.
    'available_rewards', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'name_ar', name_ar, 'name_so', name_so,
        'points_required', points_required, 'reward_type', reward_type,
        'discount_value', discount_value, 'free_product_text', free_product_text
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
          r.redemption_limit is null
          or (select count(*) from loyalty_redemptions x where x.reward_id = r.id and x.status <> 'cancelled') < r.redemption_limit
        )
        and (select count(*) from loyalty_redemptions x
             where x.reward_id = r.id and x.member_id = v_member.id and x.status <> 'cancelled') < r.per_member_limit
    ), '[]'::jsonb)
  );
end;
$$;


-- ---------------------------------------------------------------------------
-- 2. loyalty_staff_lookup — now a thin STAFF-authorised wrapper over the
--    helper (behaviour unchanged for existing callers).
-- ---------------------------------------------------------------------------
create or replace function loyalty_staff_lookup(p_member_uid uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
  v_program_id uuid;
begin
  select id, program_id into v_member_id, v_program_id
  from loyalty_members where member_uid = p_member_uid;
  if v_member_id is null then
    raise exception 'Member not found';
  end if;
  if not loyalty_is_staff(v_program_id) then
    raise exception 'Not authorized';
  end if;
  return loyalty_member_console_doc(v_member_id);
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. loyalty_staff_lookup_by_number — STAFF. The manual-entry fallback: the
--    staff device couldn't scan the QR, so the operator types the membership
--    number printed on the customer's card. Program-scoped (a number is only
--    unique within a program).
-- ---------------------------------------------------------------------------
create or replace function loyalty_staff_lookup_by_number(p_program_id uuid, p_number text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_member_id uuid;
begin
  if not loyalty_is_staff(p_program_id) then
    raise exception 'Not authorized';
  end if;
  select id into v_member_id
  from loyalty_members
  where program_id = p_program_id
    and upper(btrim(membership_number)) = upper(btrim(p_number));
  if v_member_id is null then
    raise exception 'Member not found';
  end if;
  return loyalty_member_console_doc(v_member_id);
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. loyalty_staff_redeem_reward — STAFF. Redeem a reward for a member at the
--    counter, fulfilled on the spot (status straight to 'redeemed',
--    redeemed_by = the operator). Same points deduction + REDEMPTION
--    transaction + every eligibility gate as the customer-initiated
--    loyalty_redeem_reward(). Idempotent per p_client_ref.
-- ---------------------------------------------------------------------------
create or replace function loyalty_staff_redeem_reward(
  p_member_uid uuid,
  p_reward_id uuid,
  p_client_ref text default null
)
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
  select * into v_reward from loyalty_rewards where id = p_reward_id;
  if v_reward.id is null then
    raise exception 'Reward not found';
  end if;
  select * into v_program from loyalty_programs where id = v_reward.program_id;

  -- Lock the member row so concurrent staff/customer redemptions can't overspend.
  select * into v_member from loyalty_members
  where member_uid = p_member_uid and program_id = v_program.id
  for update;
  if v_member.id is null then
    raise exception 'Member not found';
  end if;

  if not loyalty_is_staff(v_program.id) then
    raise exception 'Not authorized to redeem for this program';
  end if;
  if not v_program.enabled then
    raise exception 'This loyalty program is not currently active';
  end if;
  if v_member.status <> 'active' then
    raise exception 'This membership is not active';
  end if;

  -- Idempotency.
  if p_client_ref is not null then
    select r.* into v_redemption
    from loyalty_redemptions r
    join loyalty_transactions tx on tx.reference_id = r.id and tx.type = 'REDEMPTION'
    where r.member_id = v_member.id and r.reward_id = v_reward.id
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

  if v_reward.min_tier_id is not null then
    if v_member.tier_id is null
       or (select min_points from loyalty_tiers where id = v_member.tier_id)
          < (select min_points from loyalty_tiers where id = v_reward.min_tier_id) then
      raise exception 'This member''s tier is not eligible for this reward';
    end if;
  end if;

  if v_reward.redemption_limit is not null then
    -- Serialize the global count-then-insert for a total-capped reward (see
    -- the matching note in loyalty_redeem_reward).
    perform pg_advisory_xact_lock(hashtext('loyalty_reward:' || v_reward.id::text));
    select count(*) into v_total_used
    from loyalty_redemptions
    where reward_id = v_reward.id and status <> 'cancelled';
    if v_total_used >= v_reward.redemption_limit then
      raise exception 'This reward is fully redeemed';
    end if;
  end if;

  select count(*) into v_mine_used
  from loyalty_redemptions
  where reward_id = v_reward.id and member_id = v_member.id and status <> 'cancelled';
  if v_mine_used >= v_reward.per_member_limit then
    raise exception 'This member has already redeemed this reward';
  end if;

  if v_member.current_points < v_reward.points_required then
    raise exception 'Not enough points for this reward';
  end if;

  update loyalty_members
  set current_points = current_points - v_reward.points_required, updated_at = now()
  where id = v_member.id
  returning * into v_member;

  v_code := loyalty_gen_redemption_code(v_program.name);
  v_snapshot := jsonb_build_object(
    'name', v_reward.name, 'name_ar', v_reward.name_ar, 'name_so', v_reward.name_so,
    'reward_type', v_reward.reward_type, 'discount_value', v_reward.discount_value,
    'free_product_text', v_reward.free_product_text, 'points_required', v_reward.points_required,
    'image_url', v_reward.image_url
  );

  insert into loyalty_redemptions (
    program_id, reward_id, member_id, redemption_code, points_spent,
    reward_snapshot, status, issued_at, expires_at, redeemed_at, redeemed_by
  ) values (
    v_program.id, v_reward.id, v_member.id, v_code, v_reward.points_required,
    v_snapshot, 'redeemed', now(),
    now() + make_interval(days => v_program.redemption_ttl_days),
    now(), auth.uid()
  )
  returning * into v_redemption;

  insert into loyalty_transactions (
    program_id, member_id, type, points, balance_after, reference_type, reference_id, description, metadata, created_by
  ) values (
    v_program.id, v_member.id, 'REDEMPTION', -v_reward.points_required, v_member.current_points,
    'redemption', v_redemption.id, v_reward.name,
    jsonb_strip_nulls(jsonb_build_object('client_ref', p_client_ref, 'fulfilled_by_staff', true)),
    auth.uid()
  );

  return v_redemption;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. Grants.
-- ---------------------------------------------------------------------------
revoke all on function loyalty_member_console_doc(uuid) from public;
-- internal only — not granted to anon/authenticated; reached solely through
-- the STAFF-authorised wrappers below (all SECURITY DEFINER).

revoke all on function loyalty_staff_lookup(uuid) from public;
grant execute on function loyalty_staff_lookup(uuid) to authenticated;

revoke all on function loyalty_staff_lookup_by_number(uuid, text) from public;
grant execute on function loyalty_staff_lookup_by_number(uuid, text) to authenticated;

revoke all on function loyalty_staff_redeem_reward(uuid, uuid, text) from public;
grant execute on function loyalty_staff_redeem_reward(uuid, uuid, text) to authenticated;

-- ============================================================================
-- END 20260908000003_loyalty_staff_operations.sql
-- ============================================================================
