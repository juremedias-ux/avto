-- Behavioural tests for the migrations. Run via tests/sql/run.sh.
\set QUIET on
set client_min_messages = warning;

\pset tuples_only on
\pset format unaligned
create schema if not exists test_helpers;
grant usage on schema test_helpers to authenticated;
create or replace function test_helpers.expect_error(p_sql text, p_message text) returns text
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected error % but statement succeeded: %', p_message, p_sql;
exception when others then
  if sqlerrm not like '%' || p_message || '%' then
    raise exception 'expected error % but got: %', p_message, sqlerrm;
  end if;
  return 'ok: ' || p_message;
end $$;
grant execute on function test_helpers.expect_error(text, text) to authenticated;

-- 1. Signup bootstrap -------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'ana@example.com', '{"full_name":"Ana Novak","locale":"en"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bor@example.com', '{}'),
  ('00000000-0000-0000-0000-00000000000c', 'admin@example.com', '{}');

do $$
declare
  v_org uuid;
begin
  select active_organization_id into v_org from public.users where id = '00000000-0000-0000-0000-00000000000a';
  assert v_org is not null, 'personal organization assigned';
  assert (select credit_balance from public.organizations where id = v_org) = 10, 'signup bonus 10 credits';
  assert (select count(*) from public.credit_transactions where organization_id = v_org and type = 'signup_bonus') = 1;
  assert (select role from public.organization_members where organization_id = v_org
          and user_id = '00000000-0000-0000-0000-00000000000a') = 'admin';
  assert (select locale from public.users where id = '00000000-0000-0000-0000-00000000000a') = 'en';
  assert (select name from public.organizations where id = v_org) = 'Ana Novak';
end $$;

update auth.users set email = 'ana.novak@example.com' where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select email from public.users where id = '00000000-0000-0000-0000-00000000000a') = 'ana.novak@example.com';
end $$;

update public.users set is_platform_admin = true where id = '00000000-0000-0000-0000-00000000000c';

-- 2. Generation lifecycle: hold -> accept (charge) -> fail (refund) ----------
create temp table t (k text primary key, v jsonb);

do $$
declare
  v_org uuid;
  r jsonb;
begin
  select active_organization_id into v_org from public.users where id = '00000000-0000-0000-0000-00000000000a';
  r := public.begin_generation('00000000-0000-0000-0000-00000000000a', v_org, 'text_to_video', 'kling-2.6',
        '720p', 5::smallint, '16:9', false, 'A product shot', 'blur', 'product-hero', null, 4, 1.5, 2);
  insert into t values ('g1', r);
  assert (select credit_balance from public.organizations where id = v_org) = 10, 'nothing deducted before acceptance';
  assert public.pending_credit_holds(v_org) = 4, 'draft holds 4 credits';
  assert (select status from public.videos where id = (r->>'video_id')::uuid) = 'draft';
  assert (select external_task_id from public.video_jobs where id = (r->>'job_id')::uuid) = r->>'job_id';
end $$;

-- 7 more credits would exceed balance minus holds (10 - 4 < 7)
select test_helpers.expect_error($q$
  select public.begin_generation('00000000-0000-0000-0000-00000000000a',
    (select active_organization_id from public.users where id = '00000000-0000-0000-0000-00000000000a'),
    'text_to_video', 'kling-2.6', '720p', 5::smallint, '16:9', false, 'x', null, null, null, 7, 1, 5)
$q$, 'VF_INSUFFICIENT_CREDITS');

-- concurrency limit 1: one draft already active
select test_helpers.expect_error($q$
  select public.begin_generation('00000000-0000-0000-0000-00000000000a',
    (select active_organization_id from public.users where id = '00000000-0000-0000-0000-00000000000a'),
    'text_to_video', 'kling-2.6', '720p', 5::smallint, '16:9', false, 'x', null, null, null, 1, 1, 1)
$q$, 'VF_CONCURRENCY_LIMIT');

do $$
declare
  r jsonb := (select v from t where k = 'g1');
  v_org uuid := (select organization_id from public.videos where id = (r->>'video_id')::uuid);
begin
  perform public.accept_generation((r->>'job_id')::uuid, 'kling-task-1', 'submitted');
  assert (select credit_balance from public.organizations where id = v_org) = 6, 'charged after acceptance';
  assert (select status from public.videos where id = (r->>'video_id')::uuid) = 'queued';
  assert public.pending_credit_holds(v_org) = 0, 'hold released';
  -- idempotent
  perform public.accept_generation((r->>'job_id')::uuid, 'kling-task-1', 'submitted');
  assert (select credit_balance from public.organizations where id = v_org) = 6, 'no double charge';

  perform public.mark_generation_processing((r->>'job_id')::uuid, 'processing', 7);
  assert (select status from public.videos where id = (r->>'video_id')::uuid) = 'processing';
  assert (select status from public.video_jobs where id = (r->>'job_id')::uuid) = 'processing';
end $$;

select test_helpers.expect_error($q$
  select public.delete_video('00000000-0000-0000-0000-00000000000a',
    ((select v from t where k = 'g1')->>'video_id')::uuid)
$q$, 'VF_VIDEO_IN_PROGRESS');

do $$
declare
  r jsonb := (select v from t where k = 'g1');
  v_org uuid := (select organization_id from public.videos where id = (r->>'video_id')::uuid);
begin
  perform public.fail_generation((r->>'job_id')::uuid, 'content_moderation', 'blocked', 'failed', true);
  assert (select credit_balance from public.organizations where id = v_org) = 10, 'refunded';
  assert (select credits_refunded from public.videos where id = (r->>'video_id')::uuid) = 4;
  perform public.fail_generation((r->>'job_id')::uuid, 'content_moderation', 'blocked', 'failed', true);
  assert (select credit_balance from public.organizations where id = v_org) = 10, 'refund only once';
  assert (select count(*) from public.credit_transactions where video_id = (r->>'video_id')::uuid) = 2;
end $$;

-- 3. Success path ---------------------------------------------------------
do $$
declare
  v_org uuid;
  r jsonb;
begin
  select active_organization_id into v_org from public.users where id = '00000000-0000-0000-0000-00000000000a';
  r := public.begin_generation('00000000-0000-0000-0000-00000000000a', v_org, 'text_to_video', 'kling-2.6',
        '1080p', 10::smallint, '9:16', false, 'Second', null, null, null, 5, 5, 2);
  insert into t values ('g2', r);
  perform public.accept_generation((r->>'job_id')::uuid, 'kling-task-2', 'submitted');
  assert public.claim_job((r->>'job_id')::uuid, 60), 'first claim succeeds';
  assert not public.claim_job((r->>'job_id')::uuid, 60), 'second claim blocked by lease';
  perform public.complete_generation((r->>'job_id')::uuid, 'vid-1', 'https://example.invalid/v.mp4',
        v_org::text || '/' || (r->>'video_id') || '.mp4', 10.0, 5.0, 0.7, '[{"charge_type":"unit","amount":"5"}]', '{}');
  perform public.release_job((r->>'job_id')::uuid);
  assert (select status from public.videos where id = (r->>'video_id')::uuid) = 'succeeded';
  assert (select credit_balance from public.organizations where id = v_org) = 5;
  -- failing after success must not refund
  perform public.fail_generation((r->>'job_id')::uuid, 'timeout', 'late', null, true);
  assert (select status from public.videos where id = (r->>'video_id')::uuid) = 'succeeded';
  assert (select credit_balance from public.organizations where id = v_org) = 5;
  assert (select provider_cost_usd from public.video_jobs where id = (r->>'job_id')::uuid) = 0.7;
end $$;

-- 4. Ledger immutability --------------------------------------------------
select test_helpers.expect_error($q$ update public.credit_transactions set amount = 999 $q$, 'VF_LEDGER_IMMUTABLE');

-- 5. Admin functions ------------------------------------------------------
select test_helpers.expect_error($q$
  select public.admin_adjust_credits('00000000-0000-0000-0000-00000000000b',
    (select active_organization_id from public.users where id = '00000000-0000-0000-0000-00000000000a'), 50, 'gift')
$q$, 'VF_FORBIDDEN');

do $$
declare
  v_org uuid;
begin
  select active_organization_id into v_org from public.users where id = '00000000-0000-0000-0000-00000000000a';
  perform public.admin_adjust_credits('00000000-0000-0000-0000-00000000000c', v_org, 50, 'Goodwill credit');
  assert (select credit_balance from public.organizations where id = v_org) = 55;
  perform public.admin_set_user_status('00000000-0000-0000-0000-00000000000c',
    '00000000-0000-0000-0000-00000000000b', 'suspended', 'Abuse report');
  assert (select status from public.users where id = '00000000-0000-0000-0000-00000000000b') = 'suspended';
  assert (select video_count from public.admin_user_stats(array['00000000-0000-0000-0000-00000000000a'::uuid])) = 2;
  assert (select (public.admin_totals()->>'users')::int) = 3;
end $$;

select test_helpers.expect_error($q$
  select public.admin_adjust_credits('00000000-0000-0000-0000-00000000000c',
    (select active_organization_id from public.users where id = '00000000-0000-0000-0000-00000000000a'), -1000, 'Too much')
$q$, 'VF_INSUFFICIENT_CREDITS');

select test_helpers.expect_error($q$
  select public.begin_generation('00000000-0000-0000-0000-00000000000b',
    (select active_organization_id from public.users where id = '00000000-0000-0000-0000-00000000000b'),
    'text_to_video', 'kling-2.6', '720p', 5::smallint, '16:9', false, 'x', null, null, null, 1, 1, 2)
$q$, 'VF_ACCOUNT_SUSPENDED');

-- 6. Organizations --------------------------------------------------------
do $$
declare
  v_team uuid;
begin
  v_team := public.create_organization('00000000-0000-0000-0000-00000000000a', 'Acme d.o.o.');
  insert into t values ('team', to_jsonb(v_team::text));
  assert (select credit_balance from public.organizations where id = v_team) = 0, 'no free credits for extra orgs';
  perform public.add_organization_member('00000000-0000-0000-0000-00000000000a', v_team, 'BOR@example.com', 'member');
  assert (select role from public.organization_members where organization_id = v_team
          and user_id = '00000000-0000-0000-0000-00000000000b') = 'member';
end $$;

select test_helpers.expect_error($q$
  select public.remove_organization_member('00000000-0000-0000-0000-00000000000a',
    ((select v from t where k = 'team') #>> '{}')::uuid, '00000000-0000-0000-0000-00000000000a')
$q$, 'VF_LAST_ADMIN');

select test_helpers.expect_error($q$
  select public.add_organization_member('00000000-0000-0000-0000-00000000000b',
    ((select v from t where k = 'team') #>> '{}')::uuid, 'admin@example.com', 'admin')
$q$, 'VF_FORBIDDEN');

-- 7. RLS and privileges as an authenticated user --------------------------
grant select on t to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);

do $$ begin
  -- B sees own personal org and the shared team org, not A's personal org.
  assert (select count(*) from public.organizations) = 2, 'B sees 2 orgs';
  assert (select count(*) from public.videos) = 0, 'B sees none of A''s personal videos';
  assert (select count(*) from public.users) = 2, 'B sees self + teammate A';
end $$;

select test_helpers.expect_error($q$ select count(*) from public.video_jobs $q$, 'permission denied');
select test_helpers.expect_error($q$ select count(*) from public.api_usage_logs $q$, 'permission denied');
select test_helpers.expect_error($q$ update public.organizations set credit_balance = 99999 $q$, 'permission denied');
select test_helpers.expect_error($q$ update public.users set is_platform_admin = true $q$, 'permission denied');
select test_helpers.expect_error($q$ update public.users set status = 'active' $q$, 'permission denied');
select test_helpers.expect_error($q$ insert into public.videos (organization_id) values (gen_random_uuid()) $q$, 'permission denied');
select test_helpers.expect_error($q$
  select public.apply_credit_change((select id from public.organizations limit 1), 1000, 'purchase')
$q$, 'permission denied');
select test_helpers.expect_error($q$ select public.admin_totals() $q$, 'permission denied');

-- Allowed: profile fields; switching to an org B belongs to; not to A's personal org.
update public.users set full_name = 'Bor', locale = 'en' where id = '00000000-0000-0000-0000-00000000000b';
update public.users set active_organization_id = ((select v from t where k = 'team') #>> '{}')::uuid
  where id = '00000000-0000-0000-0000-00000000000b';
select test_helpers.expect_error($q$
  update public.users set active_organization_id =
    (select id from public.organizations where owner_id = '00000000-0000-0000-0000-00000000000a' and is_personal)
  where id = '00000000-0000-0000-0000-00000000000b'
$q$, 'row-level security');

-- B is not an admin of the team org: rename affects zero rows.
do $$
declare n int;
begin
  update public.organizations set name = 'Hijacked' where id = ((select v from t where k = 'team') #>> '{}')::uuid;
  get diagnostics n = row_count;
  assert n = 0, 'member cannot rename org';
end $$;

reset role;

-- A (admin of team) as authenticated sees A's 2 personal videos.
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);
do $$ begin
  assert (select count(*) from public.videos) = 2, 'A sees own videos';
end $$;
reset role;

-- 8. Soft delete ----------------------------------------------------------
do $$
declare
  r jsonb := (select v from t where k = 'g2');
  paths jsonb;
begin
  paths := public.delete_video('00000000-0000-0000-0000-00000000000a', (r->>'video_id')::uuid);
  assert paths->>'video_storage_path' like '%.mp4';
  assert (select deleted_at is not null from public.videos where id = (r->>'video_id')::uuid);
end $$;

select test_helpers.expect_error($q$
  select public.delete_video('00000000-0000-0000-0000-00000000000b', ((select v from t where k = 'g1')->>'video_id')::uuid)
$q$, 'VF_VIDEO_NOT_FOUND');

-- 9. Deleting a user keeps the ledger (references become NULL) -------------
delete from auth.users where id = '00000000-0000-0000-0000-00000000000b';
do $$ begin
  assert (select count(*) from public.users where id = '00000000-0000-0000-0000-00000000000b') = 0;
end $$;

delete from auth.users where id = '00000000-0000-0000-0000-00000000000a';
do $$ begin
  assert (select count(*) from public.videos where user_id = '00000000-0000-0000-0000-00000000000a') = 0;
  assert (select count(*) from public.credit_transactions where video_id is null) >= 1, 'ledger rows survive';
end $$;

\echo 'all assertions passed'
