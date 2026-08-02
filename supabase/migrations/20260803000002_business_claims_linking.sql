-- ============================================================================
-- Go Hargeisa — Business Claim Management (Partner Linking)
--
-- business_claims previously only recorded a claim; nothing ever resolved it
-- to a real account or mutated the listing's owner_id (submitBusinessClaim's
-- own comment said as much). This adds the missing piece: a user_id the
-- claim resolves to (captured at submission time when the claimant is
-- signed in; otherwise resolved by an admin at approval time), an audit
-- trail, and a notification trigger for the approve/reject decision —
-- mirroring the existing notify_applicant_join_request_decided() pattern.
--
-- Also adds a small, self-guarded RPC (admin_notify_user) so the separate
-- "transfer ownership to another user" admin action — which isn't tied to
-- any business_claims row — can still notify the new owner despite
-- `notifications` having no general INSERT policy (every other notification
-- is written by a SECURITY DEFINER trigger; this is the one case that isn't
-- driven by a row change, so it needs its own SECURITY DEFINER entry point).
-- Safe to re-run.
-- ============================================================================

alter table business_claims add column if not exists user_id uuid references profiles(id) on delete set null;
alter table business_claims add column if not exists reviewed_at timestamptz;
alter table business_claims add column if not exists reviewed_by uuid references profiles(id) on delete set null;

create index if not exists idx_business_claims_user on business_claims(user_id);

create or replace function notify_claimant_business_claim_decided() returns trigger as $$
begin
  if new.status not in ('approved', 'rejected') or old.status is not distinct from new.status then
    return new;
  end if;

  if new.user_id is null then
    return new;
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select new.user_id,
    case when new.status = 'approved' then 'Business claim approved' else 'Business claim rejected' end,
    case when new.status = 'approved'
      then 'Your claim has been approved — you now have dashboard access.'
      else 'Your business claim was not approved.'
    end,
    case when new.status = 'approved' then 'success' else 'error' end,
    '/business',
    case when new.status = 'approved' then 'business_claim_approved' else 'business_claim_rejected' end,
    jsonb_build_object('listingType', new.listing_type, 'listingId', new.listing_id)
  where should_notify_in_app(new.user_id, 'verification');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists trg_notify_business_claim_decided on business_claims;
create trigger trg_notify_business_claim_decided
  after update of status on business_claims
  for each row execute procedure notify_claimant_business_claim_decided();

-- Claims admin queue moved from /admin/partners to its own /admin/claims page.
create or replace function notify_owners_new_business_claim() returns trigger as $$
begin
  insert into notifications (user_id, title, message, type, action_url, category, data)
  select id, 'New business claim', new.full_name || ' wants to claim a listing', 'info',
    '/admin/claims', 'business_claim_new', jsonb_build_object('fullName', new.full_name)
  from profiles where role = 'owner' and should_notify_in_app(id, 'admin');
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Self-guarded: only a caller whose OWN profile is role='owner' can reach
-- the insert (checked against auth.uid() inside the function body, not just
-- by whoever happens to call it), since this RPC is otherwise directly
-- callable by any authenticated session — unlike the trigger-based
-- notifications above, which only ever run as a side effect of a row change
-- an RLS policy already permitted.
create or replace function admin_notify_user(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'info',
  p_action_url text default null,
  p_category text default null,
  p_data jsonb default '{}'::jsonb
) returns void as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'owner') then
    raise exception 'not authorized';
  end if;

  insert into notifications (user_id, title, message, type, action_url, category, data)
  select p_user_id, p_title, p_message, p_type, p_action_url, p_category, p_data
  where should_notify_in_app(p_user_id, coalesce(p_category, 'admin'));
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

grant execute on function admin_notify_user(uuid, text, text, text, text, text, jsonb) to authenticated;
