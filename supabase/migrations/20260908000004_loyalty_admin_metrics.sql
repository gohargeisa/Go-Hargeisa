-- ============================================================================
-- Go Hargeisa — Loyalty: admin overview metrics (Phase 8 / groundwork for 9).
--
-- NOT APPLIED YET (depends on 20260908000001_loyalty_core.sql). One
-- read-only, PLATFORM-OWNER-ONLY function. No table/column/policy changes.
-- ============================================================================

create or replace function loyalty_program_metrics(p_program_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if not loyalty_is_platform_owner() and not loyalty_is_listing_owner(p_program_id) then
    raise exception 'Not authorized';
  end if;

  select jsonb_build_object(
    'total_members', (select count(*) from loyalty_members where program_id = p_program_id),
    'active_members', (select count(*) from loyalty_members where program_id = p_program_id and status = 'active'),
    'points_issued', coalesce((
      select sum(points) from loyalty_transactions
      where program_id = p_program_id and points > 0
    ), 0),
    'points_redeemed', coalesce((
      select -sum(points) from loyalty_transactions
      where program_id = p_program_id and type = 'REDEMPTION'
    ), 0),
    'rewards_redeemed', (
      select count(*) from loyalty_redemptions
      where program_id = p_program_id and status in ('issued', 'redeemed')
    ),
    'purchases_recorded', (
      select count(*) from loyalty_transactions
      where program_id = p_program_id and type = 'PURCHASE_EARN'
    ),
    'points_outstanding', coalesce((
      select sum(current_points) from loyalty_members where program_id = p_program_id
    ), 0),
    'top_members', coalesce((
      select jsonb_agg(x) from (
        select m.membership_number,
               (select full_name from profiles where id = m.user_id) as name,
               m.current_points, m.lifetime_points
        from loyalty_members m
        where m.program_id = p_program_id
        order by m.lifetime_points desc
        limit 5
      ) x
    ), '[]'::jsonb),
    'top_rewards', coalesce((
      select jsonb_agg(x) from (
        select coalesce(r.name, red.reward_snapshot ->> 'name') as name, count(*) as redemptions
        from loyalty_redemptions red
        left join loyalty_rewards r on r.id = red.reward_id
        where red.program_id = p_program_id and red.status <> 'cancelled'
        group by 1
        order by 2 desc
        limit 5
      ) x
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function loyalty_program_metrics(uuid) from public;
grant execute on function loyalty_program_metrics(uuid) to authenticated;

-- ============================================================================
-- END 20260908000004_loyalty_admin_metrics.sql
-- ============================================================================
