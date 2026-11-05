-- VideoForge AI — business functions
--
-- Every function here is SECURITY DEFINER and executable ONLY by service_role.
-- The Next.js server verifies the session (supabase.auth.getUser()) and passes
-- the verified user id explicitly. Errors are raised with stable message codes
-- prefixed "VF_" that lib/db/errors.ts maps to user-facing messages.

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------
-- A draft is a generation that has been validated but not yet accepted by Kling.
-- Its cost is held (not deducted) for this long so parallel requests cannot
-- overspend; stale drafts are reconciled by the poll-jobs cron.
create or replace function public.draft_hold_interval()
returns interval
language sql
immutable
set search_path = ''
as $$ select interval '10 minutes' $$;

create or replace function public.signup_bonus_credits()
returns integer
language sql
immutable
set search_path = ''
as $$ select 10 $$;

-- ---------------------------------------------------------------------------
-- Ledger primitive: the only code path that changes organizations.credit_balance
-- ---------------------------------------------------------------------------
create or replace function public.apply_credit_change(
  p_organization_id uuid,
  p_amount integer,
  p_type public.credit_tx_type,
  p_user_id uuid default null,
  p_video_id uuid default null,
  p_idempotency_key text default null,
  p_description text default null,
  p_created_by uuid default null,
  p_metadata jsonb default '{}'::jsonb,
  p_amount_paid_cents integer default null,
  p_currency text default null,
  p_stripe_reference text default null
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_tx public.credit_transactions;
begin
  if p_amount is null or p_amount = 0 then
    raise exception 'VF_INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  if p_idempotency_key is not null then
    select * into v_tx from public.credit_transactions where idempotency_key = p_idempotency_key;
    if found then
      return v_tx;
    end if;
  end if;

  select credit_balance into v_balance
  from public.organizations
  where id = p_organization_id
  for update;

  if not found then
    raise exception 'VF_ORGANIZATION_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Re-check under the row lock: a concurrent call with the same key has committed by now.
  if p_idempotency_key is not null then
    select * into v_tx from public.credit_transactions where idempotency_key = p_idempotency_key;
    if found then
      return v_tx;
    end if;
  end if;

  if v_balance + p_amount < 0 then
    raise exception 'VF_INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  update public.organizations
  set credit_balance = v_balance + p_amount
  where id = p_organization_id;

  insert into public.credit_transactions (
    organization_id, user_id, video_id, type, amount, balance_after, description,
    idempotency_key, stripe_reference, amount_paid_cents, currency, created_by, metadata
  ) values (
    p_organization_id, p_user_id, p_video_id, p_type, p_amount, v_balance + p_amount,
    left(p_description, 500), p_idempotency_key, p_stripe_reference, p_amount_paid_cents,
    lower(p_currency), p_created_by, coalesce(p_metadata, '{}'::jsonb)
  )
  returning * into v_tx;

  return v_tx;
end;
$$;

-- Sum of credits held by in-flight drafts of an organization.
create or replace function public.pending_credit_holds(p_organization_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum(credits_cost), 0)::integer
  from public.videos
  where organization_id = p_organization_id
    and status = 'draft'
    and credits_charged = 0
    and deleted_at is null
    and created_at > now() - public.draft_hold_interval();
$$;

-- ---------------------------------------------------------------------------
-- New user bootstrap (trigger on auth.users)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_name text;
  v_locale text;
begin
  v_name := left(nullif(btrim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    ''
  )), ''), 120);
  v_locale := case
    when new.raw_user_meta_data ->> 'locale' in ('sl', 'en') then new.raw_user_meta_data ->> 'locale'
    else 'sl'
  end;

  insert into public.users (id, email, full_name, avatar_url, locale)
  values (
    new.id,
    coalesce(new.email, ''),
    v_name,
    left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'), 1024),
    v_locale
  );

  insert into public.organizations (name, owner_id, is_personal)
  values (
    left(coalesce(v_name, nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Workspace'), 100),
    new.id,
    true
  )
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, new.id, 'admin');

  update public.users set active_organization_id = v_org_id where id = new.id;

  perform public.apply_credit_change(
    p_organization_id => v_org_id,
    p_amount => public.signup_bonus_credits(),
    p_type => 'signup_bonus',
    p_user_id => new.id,
    p_idempotency_key => 'signup:' || new.id::text,
    p_description => 'Welcome bonus'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    update public.users set email = coalesce(new.email, '') where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------------
-- Generation lifecycle
-- ---------------------------------------------------------------------------

-- Step 1: validate and create a draft. Nothing is deducted. Raises:
-- VF_USER_NOT_FOUND, VF_ACCOUNT_SUSPENDED, VF_NOT_MEMBER, VF_INSUFFICIENT_CREDITS,
-- VF_CONCURRENCY_LIMIT.
create or replace function public.begin_generation(
  p_user_id uuid,
  p_organization_id uuid,
  p_mode public.generation_mode,
  p_model text,
  p_resolution text,
  p_duration_seconds smallint,
  p_aspect_ratio text,
  p_audio boolean,
  p_prompt text,
  p_negative_prompt text,
  p_template_id text,
  p_source_image_path text,
  p_credits_cost integer,
  p_estimated_provider_units numeric,
  p_max_concurrent integer,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.account_status;
  v_balance integer;
  v_holds integer;
  v_active integer;
  v_video_id uuid;
  v_job_id uuid := gen_random_uuid();
begin
  if p_credits_cost is null or p_credits_cost <= 0 then
    raise exception 'VF_INVALID_AMOUNT' using errcode = 'P0001';
  end if;

  -- Serialize submissions per user so the concurrency check cannot race.
  perform pg_advisory_xact_lock(hashtextextended('vf:generation:' || p_user_id::text, 0));

  select status into v_status from public.users where id = p_user_id;
  if not found then
    raise exception 'VF_USER_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_status <> 'active' then
    raise exception 'VF_ACCOUNT_SUSPENDED' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = p_user_id
  ) then
    raise exception 'VF_NOT_MEMBER' using errcode = 'P0001';
  end if;

  select credit_balance into v_balance
  from public.organizations
  where id = p_organization_id
  for update;

  v_holds := public.pending_credit_holds(p_organization_id);
  if v_balance - v_holds < p_credits_cost then
    raise exception 'VF_INSUFFICIENT_CREDITS' using errcode = 'P0001';
  end if;

  select count(*) into v_active
  from public.videos
  where user_id = p_user_id
    and deleted_at is null
    and (
      status in ('queued', 'processing')
      or (status = 'draft' and created_at > now() - public.draft_hold_interval())
    );
  if v_active >= greatest(p_max_concurrent, 1) then
    raise exception 'VF_CONCURRENCY_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.videos (
    organization_id, user_id, mode, status, model, resolution, duration_seconds, aspect_ratio,
    audio, prompt, negative_prompt, template_id, source_image_path, credits_cost, metadata
  ) values (
    p_organization_id, p_user_id, p_mode, 'draft', p_model, p_resolution, p_duration_seconds,
    p_aspect_ratio, coalesce(p_audio, false), p_prompt, nullif(btrim(p_negative_prompt), ''),
    p_template_id, p_source_image_path, p_credits_cost, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_video_id;

  insert into public.video_jobs (
    id, video_id, organization_id, user_id, task_type, model, external_task_id,
    status, estimated_provider_units
  ) values (
    v_job_id, v_video_id, p_organization_id, p_user_id,
    case when p_mode = 'image_to_video' then 'image-to-video' else 'text-to-video' end,
    p_model, v_job_id::text, 'submitting', p_estimated_provider_units
  );

  return jsonb_build_object('video_id', v_video_id, 'job_id', v_job_id);
end;
$$;

-- Step 2: Kling accepted the task -> deduct credits now. Idempotent.
create or replace function public.accept_generation(
  p_job_id uuid,
  p_provider_task_id text,
  p_provider_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.video_jobs;
  v_video public.videos;
begin
  select * into v_job from public.video_jobs where id = p_job_id for update;
  if not found then
    raise exception 'VF_JOB_NOT_FOUND' using errcode = 'P0001';
  end if;

  select * into v_video from public.videos where id = v_job.video_id for update;

  if v_video.credits_charged > 0 then
    update public.video_jobs
    set provider_task_id = coalesce(provider_task_id, p_provider_task_id)
    where id = p_job_id;
    return;
  end if;

  if not (
    v_video.status = 'draft'
    or (v_video.status = 'failed' and v_video.error_code = 'submission_interrupted')
  ) then
    raise exception 'VF_INVALID_STATE' using errcode = 'P0001';
  end if;

  perform public.apply_credit_change(
    p_organization_id => v_video.organization_id,
    p_amount => -v_video.credits_cost,
    p_type => 'generation',
    p_user_id => v_video.user_id,
    p_video_id => v_video.id,
    p_idempotency_key => 'charge:' || v_video.id::text,
    p_description => 'Video generation',
    p_metadata => jsonb_build_object(
      'model', v_video.model,
      'resolution', v_video.resolution,
      'duration_seconds', v_video.duration_seconds,
      'mode', v_video.mode
    )
  );

  update public.videos
  set status = 'queued',
      credits_charged = credits_cost,
      submitted_at = now(),
      error_code = null,
      error_message = null,
      completed_at = null
  where id = v_video.id;

  update public.video_jobs
  set status = 'submitted',
      provider_task_id = p_provider_task_id,
      provider_status = p_provider_status,
      submitted_at = now(),
      next_poll_at = now() + interval '5 seconds',
      error_code = null,
      error_message = null
  where id = p_job_id;
end;
$$;

-- Provider reports the task as running.
create or replace function public.mark_generation_processing(
  p_job_id uuid,
  p_provider_status text,
  p_next_poll_seconds integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.video_jobs;
begin
  select * into v_job from public.video_jobs where id = p_job_id for update;
  if not found then
    raise exception 'VF_JOB_NOT_FOUND' using errcode = 'P0001';
  end if;

  update public.video_jobs
  set status = case when status in ('submitted', 'processing') and p_provider_status = 'processing'
                    then 'processing'::public.job_status else status end,
      provider_status = p_provider_status,
      last_polled_at = now(),
      poll_count = poll_count + 1,
      next_poll_at = now() + make_interval(secs => greatest(p_next_poll_seconds, 5))
  where id = p_job_id;

  if p_provider_status = 'processing' then
    update public.videos set status = 'processing'
    where id = v_job.video_id and status = 'queued';
  end if;
end;
$$;

-- Step 3a: success. Idempotent; a late success after a timeout refund is delivered free.
create or replace function public.complete_generation(
  p_job_id uuid,
  p_provider_video_id text,
  p_provider_video_url text,
  p_video_storage_path text,
  p_result_duration_seconds numeric,
  p_provider_units numeric,
  p_provider_cost_usd numeric,
  p_provider_billing jsonb,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.video_jobs;
  v_video public.videos;
begin
  select * into v_job from public.video_jobs where id = p_job_id for update;
  if not found then
    raise exception 'VF_JOB_NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_video from public.videos where id = v_job.video_id for update;

  update public.videos
  set status = 'succeeded',
      provider_video_id = coalesce(p_provider_video_id, provider_video_id),
      provider_video_url = coalesce(p_provider_video_url, provider_video_url),
      video_storage_path = coalesce(p_video_storage_path, video_storage_path),
      result_duration_seconds = coalesce(p_result_duration_seconds, result_duration_seconds),
      error_code = null,
      error_message = null,
      completed_at = coalesce(completed_at, now()),
      metadata = metadata || coalesce(p_metadata, '{}'::jsonb)
        || case when v_video.status = 'failed' then jsonb_build_object('late_success', true) else '{}'::jsonb end
  where id = v_video.id;

  update public.video_jobs
  set status = 'succeeded',
      provider_status = 'succeeded',
      provider_units = coalesce(p_provider_units, provider_units),
      provider_cost_usd = coalesce(p_provider_cost_usd, provider_cost_usd),
      provider_billing = coalesce(p_provider_billing, provider_billing),
      completed_at = coalesce(completed_at, now()),
      last_polled_at = now(),
      next_poll_at = null,
      error_code = null,
      error_message = null
  where id = p_job_id;
end;
$$;

-- Step 3b: failure. Refunds charged credits exactly once. Idempotent.
create or replace function public.fail_generation(
  p_job_id uuid,
  p_error_code text,
  p_error_message text,
  p_provider_status text default null,
  p_refund boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.video_jobs;
  v_video public.videos;
begin
  select * into v_job from public.video_jobs where id = p_job_id for update;
  if not found then
    raise exception 'VF_JOB_NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into v_video from public.videos where id = v_job.video_id for update;

  if v_video.status = 'succeeded' then
    return;
  end if;

  update public.video_jobs
  set status = case when p_error_code = 'timeout' then 'timed_out'::public.job_status
                    else 'failed'::public.job_status end,
      provider_status = coalesce(p_provider_status, provider_status),
      error_code = left(p_error_code, 64),
      error_message = left(p_error_message, 1000),
      completed_at = coalesce(completed_at, now()),
      next_poll_at = null
  where id = p_job_id;

  update public.videos
  set status = 'failed',
      error_code = left(p_error_code, 64),
      error_message = left(p_error_message, 1000),
      completed_at = coalesce(completed_at, now())
  where id = v_video.id;

  if p_refund and v_video.credits_charged > 0 and v_video.credits_refunded = 0 then
    perform public.apply_credit_change(
      p_organization_id => v_video.organization_id,
      p_amount => v_video.credits_charged,
      p_type => 'refund',
      p_user_id => v_video.user_id,
      p_video_id => v_video.id,
      p_idempotency_key => 'refund:' || v_video.id::text,
      p_description => 'Refund for failed generation',
      p_metadata => jsonb_build_object('error_code', left(p_error_code, 64))
    );
    update public.videos set credits_refunded = credits_charged where id = v_video.id;
  end if;
end;
$$;

-- Lease a job so concurrent pollers (browser poll, cron, webhook) do not
-- process the same transition twice.
create or replace function public.claim_job(p_job_id uuid, p_lease_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed uuid;
begin
  update public.video_jobs
  set locked_until = now() + make_interval(secs => greatest(p_lease_seconds, 1))
  where id = p_job_id
    and (locked_until is null or locked_until < now())
  returning id into v_claimed;
  return v_claimed is not null;
end;
$$;

create or replace function public.release_job(p_job_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.video_jobs set locked_until = null where id = p_job_id;
$$;

-- Soft-delete a video. Creator or organization admin; not while in progress.
-- Returns the storage paths the caller must remove.
create or replace function public.delete_video(p_actor_id uuid, p_video_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_video public.videos;
  v_role public.org_role;
begin
  select * into v_video from public.videos where id = p_video_id and deleted_at is null for update;
  if not found then
    raise exception 'VF_VIDEO_NOT_FOUND' using errcode = 'P0001';
  end if;

  select role into v_role from public.organization_members
  where organization_id = v_video.organization_id and user_id = p_actor_id;
  if v_role is null then
    raise exception 'VF_VIDEO_NOT_FOUND' using errcode = 'P0001';
  end if;
  if v_video.user_id <> p_actor_id and v_role <> 'admin' then
    raise exception 'VF_FORBIDDEN' using errcode = 'P0001';
  end if;

  if v_video.status in ('queued', 'processing')
     or (v_video.status = 'draft' and v_video.created_at > now() - public.draft_hold_interval()) then
    raise exception 'VF_VIDEO_IN_PROGRESS' using errcode = 'P0001';
  end if;

  update public.videos
  set deleted_at = now(),
      source_image_path = null,
      video_storage_path = null,
      provider_video_url = null
  where id = p_video_id;

  return jsonb_build_object(
    'source_image_path', v_video.source_image_path,
    'video_storage_path', v_video.video_storage_path
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Organizations and members
-- ---------------------------------------------------------------------------
create or replace function public.create_organization(p_user_id uuid, p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id uuid;
  v_count integer;
begin
  if char_length(btrim(coalesce(p_name, ''))) not between 1 and 100 then
    raise exception 'VF_INVALID_NAME' using errcode = 'P0001';
  end if;

  select count(*) into v_count from public.organizations where owner_id = p_user_id;
  if v_count >= 10 then
    raise exception 'VF_ORGANIZATION_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.organizations (name, owner_id, is_personal)
  values (btrim(p_name), p_user_id, false)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, p_user_id, 'admin');

  update public.users set active_organization_id = v_org_id where id = p_user_id;
  return v_org_id;
end;
$$;

create or replace function public.assert_org_admin(p_actor_id uuid, p_organization_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = p_actor_id and role = 'admin'
  ) then
    raise exception 'VF_FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.add_organization_member(
  p_actor_id uuid,
  p_organization_id uuid,
  p_email text,
  p_role public.org_role
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_personal boolean;
begin
  perform public.assert_org_admin(p_actor_id, p_organization_id);

  select is_personal into v_personal from public.organizations where id = p_organization_id;
  if v_personal then
    raise exception 'VF_PERSONAL_ORGANIZATION' using errcode = 'P0001';
  end if;

  select id into v_user_id from public.users where lower(email) = lower(btrim(p_email)) limit 1;
  if v_user_id is null then
    raise exception 'VF_USER_NOT_FOUND' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.organization_members
    where organization_id = p_organization_id and user_id = v_user_id
  ) then
    raise exception 'VF_ALREADY_MEMBER' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (p_organization_id, v_user_id, p_role);
  return v_user_id;
end;
$$;

create or replace function public.update_organization_member_role(
  p_actor_id uuid,
  p_organization_id uuid,
  p_user_id uuid,
  p_role public.org_role
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current public.org_role;
  v_admins integer;
begin
  perform public.assert_org_admin(p_actor_id, p_organization_id);

  -- Lock the organization's memberships to make the last-admin check safe.
  perform 1 from public.organizations where id = p_organization_id for update;

  select role into v_current from public.organization_members
  where organization_id = p_organization_id and user_id = p_user_id;
  if v_current is null then
    raise exception 'VF_NOT_MEMBER' using errcode = 'P0001';
  end if;

  if v_current = 'admin' and p_role <> 'admin' then
    select count(*) into v_admins from public.organization_members
    where organization_id = p_organization_id and role = 'admin';
    if v_admins <= 1 then
      raise exception 'VF_LAST_ADMIN' using errcode = 'P0001';
    end if;
  end if;

  update public.organization_members set role = p_role
  where organization_id = p_organization_id and user_id = p_user_id;
end;
$$;

create or replace function public.remove_organization_member(
  p_actor_id uuid,
  p_organization_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role public.org_role;
  v_admins integer;
  v_personal boolean;
  v_owner uuid;
begin
  if p_actor_id <> p_user_id then
    perform public.assert_org_admin(p_actor_id, p_organization_id);
  end if;

  select is_personal, owner_id into v_personal, v_owner
  from public.organizations where id = p_organization_id for update;
  if v_personal and v_owner = p_user_id then
    raise exception 'VF_PERSONAL_ORGANIZATION' using errcode = 'P0001';
  end if;

  select role into v_role from public.organization_members
  where organization_id = p_organization_id and user_id = p_user_id;
  if v_role is null then
    raise exception 'VF_NOT_MEMBER' using errcode = 'P0001';
  end if;

  if v_role = 'admin' then
    select count(*) into v_admins from public.organization_members
    where organization_id = p_organization_id and role = 'admin';
    if v_admins <= 1 then
      raise exception 'VF_LAST_ADMIN' using errcode = 'P0001';
    end if;
  end if;

  delete from public.organization_members
  where organization_id = p_organization_id and user_id = p_user_id;

  update public.users u
  set active_organization_id = (
    select m.organization_id from public.organization_members m
    where m.user_id = p_user_id
    order by m.created_at
    limit 1
  )
  where u.id = p_user_id and u.active_organization_id = p_organization_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Platform admin
-- ---------------------------------------------------------------------------
create or replace function public.assert_platform_admin(p_admin_id uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.users
    where id = p_admin_id and is_platform_admin and status = 'active'
  ) then
    raise exception 'VF_FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.admin_adjust_credits(
  p_admin_id uuid,
  p_organization_id uuid,
  p_amount integer,
  p_reason text
)
returns public.credit_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  perform public.assert_platform_admin(p_admin_id);

  if char_length(btrim(coalesce(p_reason, ''))) not between 3 and 500 then
    raise exception 'VF_REASON_REQUIRED' using errcode = 'P0001';
  end if;

  if p_amount < 0 then
    select credit_balance into v_balance from public.organizations where id = p_organization_id for update;
    if v_balance + p_amount < public.pending_credit_holds(p_organization_id) then
      raise exception 'VF_INSUFFICIENT_CREDITS' using errcode = 'P0001';
    end if;
  end if;

  return public.apply_credit_change(
    p_organization_id => p_organization_id,
    p_amount => p_amount,
    p_type => 'admin_adjustment',
    p_description => btrim(p_reason),
    p_created_by => p_admin_id
  );
end;
$$;

create or replace function public.admin_set_user_status(
  p_admin_id uuid,
  p_user_id uuid,
  p_status public.account_status,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_platform_admin(p_admin_id);
  if p_admin_id = p_user_id then
    raise exception 'VF_CANNOT_CHANGE_SELF' using errcode = 'P0001';
  end if;

  update public.users
  set status = p_status,
      status_reason = case when p_status = 'active' then null else left(nullif(btrim(p_reason), ''), 500) end
  where id = p_user_id;

  if not found then
    raise exception 'VF_USER_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

-- Aggregates for the admin panel (credits spent and Kling cost).
create or replace function public.admin_user_stats(p_user_ids uuid[])
returns table (
  user_id uuid,
  video_count bigint,
  succeeded_count bigint,
  failed_count bigint,
  credits_spent bigint,
  provider_units numeric,
  provider_cost_usd numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id as user_id,
    (select count(*) from public.videos v where v.user_id = u.id) as video_count,
    (select count(*) from public.videos v where v.user_id = u.id and v.status = 'succeeded') as succeeded_count,
    (select count(*) from public.videos v where v.user_id = u.id and v.status = 'failed') as failed_count,
    (select coalesce(sum(v.credits_charged - v.credits_refunded), 0)
       from public.videos v where v.user_id = u.id)::bigint as credits_spent,
    (select coalesce(sum(j.provider_units), 0) from public.video_jobs j where j.user_id = u.id) as provider_units,
    (select coalesce(sum(j.provider_cost_usd), 0) from public.video_jobs j where j.user_id = u.id) as provider_cost_usd
  from unnest(p_user_ids) as u(id);
$$;

create or replace function public.admin_organization_stats(p_organization_ids uuid[])
returns table (
  organization_id uuid,
  member_count bigint,
  video_count bigint,
  credits_spent bigint,
  provider_cost_usd numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id as organization_id,
    (select count(*) from public.organization_members m where m.organization_id = o.id) as member_count,
    (select count(*) from public.videos v where v.organization_id = o.id) as video_count,
    (select coalesce(sum(v.credits_charged - v.credits_refunded), 0)
       from public.videos v where v.organization_id = o.id)::bigint as credits_spent,
    (select coalesce(sum(j.provider_cost_usd), 0)
       from public.video_jobs j where j.organization_id = o.id) as provider_cost_usd
  from unnest(p_organization_ids) as o(id);
$$;

create or replace function public.admin_totals()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'users', (select count(*) from public.users),
    'organizations', (select count(*) from public.organizations),
    'videos', (select count(*) from public.videos),
    'videos_succeeded', (select count(*) from public.videos where status = 'succeeded'),
    'videos_failed', (select count(*) from public.videos where status = 'failed'),
    'videos_active', (select count(*) from public.videos where status in ('draft', 'queued', 'processing')),
    'credits_outstanding', (select coalesce(sum(credit_balance), 0) from public.organizations),
    'credits_spent', (select coalesce(sum(credits_charged - credits_refunded), 0) from public.videos),
    'provider_cost_usd', (select coalesce(sum(provider_cost_usd), 0) from public.video_jobs),
    'revenue_cents', (select coalesce(sum(amount_paid_cents), 0) from public.credit_transactions)
  );
$$;

-- ---------------------------------------------------------------------------
-- Execute privileges: service_role only (trigger functions need no grant)
-- ---------------------------------------------------------------------------
do $$
declare
  fn text;
begin
  foreach fn in array array[
    'public.draft_hold_interval()',
    'public.signup_bonus_credits()',
    'public.apply_credit_change(uuid, integer, public.credit_tx_type, uuid, uuid, text, text, uuid, jsonb, integer, text, text)',
    'public.pending_credit_holds(uuid)',
    'public.handle_new_user()',
    'public.handle_user_email_change()',
    'public.begin_generation(uuid, uuid, public.generation_mode, text, text, smallint, text, boolean, text, text, text, text, integer, numeric, integer, jsonb)',
    'public.accept_generation(uuid, text, text)',
    'public.mark_generation_processing(uuid, text, integer)',
    'public.complete_generation(uuid, text, text, text, numeric, numeric, numeric, jsonb, jsonb)',
    'public.fail_generation(uuid, text, text, text, boolean)',
    'public.claim_job(uuid, integer)',
    'public.release_job(uuid)',
    'public.delete_video(uuid, uuid)',
    'public.create_organization(uuid, text)',
    'public.assert_org_admin(uuid, uuid)',
    'public.add_organization_member(uuid, uuid, text, public.org_role)',
    'public.update_organization_member_role(uuid, uuid, uuid, public.org_role)',
    'public.remove_organization_member(uuid, uuid, uuid)',
    'public.assert_platform_admin(uuid)',
    'public.admin_adjust_credits(uuid, uuid, integer, text)',
    'public.admin_set_user_status(uuid, uuid, public.account_status, text)',
    'public.admin_user_stats(uuid[])',
    'public.admin_organization_stats(uuid[])',
    'public.admin_totals()',
    'public.set_updated_at()',
    'public.prevent_ledger_mutation()'
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$$;
