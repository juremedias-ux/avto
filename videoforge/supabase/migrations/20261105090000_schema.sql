-- VideoForge AI — core schema
-- Tables: users, organizations, organization_members, videos, video_jobs,
--         credit_transactions, subscriptions, api_usage_logs
-- RLS policies are in 20261105090100_rls.sql, business functions in
-- 20261105090200_functions.sql, storage buckets in 20261105090300_storage.sql.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.org_role as enum ('admin', 'member');
create type public.account_status as enum ('active', 'suspended', 'blocked');
create type public.video_status as enum ('draft', 'queued', 'processing', 'succeeded', 'failed');
create type public.generation_mode as enum ('text_to_video', 'image_to_video');
create type public.job_status as enum ('submitting', 'submitted', 'processing', 'succeeded', 'failed', 'timed_out');
create type public.credit_tx_type as enum (
  'signup_bonus',
  'purchase',
  'subscription_grant',
  'generation',
  'refund',
  'admin_adjustment'
);
create type public.subscription_status as enum (
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused'
);

-- ---------------------------------------------------------------------------
-- updated_at trigger function
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users: application profile, 1:1 with auth.users
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text check (full_name is null or char_length(full_name) <= 120),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 1024),
  locale text not null default 'sl' check (locale in ('sl', 'en')),
  status public.account_status not null default 'active',
  status_reason text check (status_reason is null or char_length(status_reason) <= 500),
  is_platform_admin boolean not null default false,
  active_organization_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.users.is_platform_admin is
  'Platform (VideoForge staff) admin. Set manually via SQL; never writable by clients.';
comment on column public.users.status is
  'active = normal; suspended = can sign in, cannot generate or buy; blocked = no access.';

create index users_email_lower_idx on public.users (lower(email));
create index users_status_idx on public.users (status) where status <> 'active';
create index users_created_at_idx on public.users (created_at desc);

-- ---------------------------------------------------------------------------
-- organizations: credit wallet + billing customer; every user gets a personal one
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  owner_id uuid references public.users (id) on delete set null,
  is_personal boolean not null default false,
  credit_balance integer not null default 0 check (credit_balance >= 0),
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_owner_idx on public.organizations (owner_id);
create index organizations_created_at_idx on public.organizations (created_at desc);

alter table public.users
  add constraint users_active_organization_fk
  foreign key (active_organization_id) references public.organizations (id) on delete set null;
create index users_active_organization_idx on public.users (active_organization_id);

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- videos: user-facing generation record (settings + result)
-- ---------------------------------------------------------------------------
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  mode public.generation_mode not null,
  status public.video_status not null default 'draft',
  provider text not null default 'kling' check (provider in ('kling')),
  model text not null check (model ~ '^[a-z0-9][a-z0-9.\-]{0,63}$'),
  resolution text not null check (resolution in ('720p', '1080p', '4k')),
  duration_seconds smallint not null check (duration_seconds in (5, 10)),
  aspect_ratio text not null check (aspect_ratio in ('16:9', '9:16', '1:1')),
  audio boolean not null default false,
  prompt text not null check (char_length(prompt) between 1 and 3072),
  negative_prompt text check (negative_prompt is null or char_length(negative_prompt) <= 1000),
  template_id text check (template_id is null or char_length(template_id) <= 64),
  source_image_path text check (source_image_path is null or char_length(source_image_path) <= 512),
  video_storage_path text check (video_storage_path is null or char_length(video_storage_path) <= 512),
  provider_video_id text,
  provider_video_url text,
  result_duration_seconds numeric(6, 2),
  credits_cost integer not null check (credits_cost > 0),
  credits_charged integer not null default 0 check (credits_charged >= 0),
  credits_refunded integer not null default 0 check (credits_refunded >= 0),
  error_code text check (error_code is null or char_length(error_code) <= 64),
  error_message text check (error_message is null or char_length(error_message) <= 1000),
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_image_mode_requires_source check (
    mode <> 'image_to_video' or source_image_path is not null or deleted_at is not null
  ),
  constraint videos_refund_not_above_charge check (credits_refunded <= credits_charged)
);

comment on column public.videos.deleted_at is
  'Soft delete: keeps cost and ledger history for admins; storage files are removed.';

create index videos_org_created_idx on public.videos (organization_id, created_at desc) where deleted_at is null;
create index videos_user_created_idx on public.videos (user_id, created_at desc);
create index videos_user_active_idx on public.videos (user_id, status)
  where status in ('draft', 'queued', 'processing') and deleted_at is null;
create index videos_org_status_idx on public.videos (organization_id, status) where deleted_at is null;
create index videos_model_idx on public.videos (model);
create index videos_created_at_idx on public.videos (created_at desc);

-- ---------------------------------------------------------------------------
-- video_jobs: provider (Kling) task tracking; internal, not visible to customers
-- ---------------------------------------------------------------------------
create table public.video_jobs (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  provider text not null default 'kling' check (provider in ('kling')),
  task_type text not null check (task_type in ('text-to-video', 'image-to-video')),
  model text not null,
  external_task_id text not null unique,
  provider_task_id text unique,
  status public.job_status not null default 'submitting',
  provider_status text,
  provider_status_message text check (provider_status_message is null or char_length(provider_status_message) <= 1000),
  submit_attempts integer not null default 0,
  poll_count integer not null default 0,
  last_polled_at timestamptz,
  next_poll_at timestamptz,
  locked_until timestamptz,
  estimated_provider_units numeric(10, 3),
  provider_units numeric(10, 3),
  provider_cost_usd numeric(12, 4),
  provider_billing jsonb,
  error_code text check (error_code is null or char_length(error_code) <= 64),
  error_message text check (error_message is null or char_length(error_message) <= 1000),
  submitted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index video_jobs_video_idx on public.video_jobs (video_id);
create index video_jobs_org_idx on public.video_jobs (organization_id);
create index video_jobs_user_idx on public.video_jobs (user_id);
create index video_jobs_pending_idx on public.video_jobs (next_poll_at)
  where status in ('submitted', 'processing');
create index video_jobs_submitting_idx on public.video_jobs (created_at) where status = 'submitting';

-- ---------------------------------------------------------------------------
-- credit_transactions: append-only ledger (no updated_at by design)
-- ---------------------------------------------------------------------------
create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid references public.users (id) on delete set null,
  video_id uuid references public.videos (id) on delete set null,
  type public.credit_tx_type not null,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  description text check (description is null or char_length(description) <= 500),
  idempotency_key text unique check (idempotency_key is null or char_length(idempotency_key) <= 200),
  stripe_reference text,
  amount_paid_cents integer check (amount_paid_cents is null or amount_paid_cents >= 0),
  currency text check (currency is null or currency ~ '^[a-z]{3}$'),
  created_by uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index credit_transactions_org_created_idx on public.credit_transactions (organization_id, created_at desc);
create index credit_transactions_user_idx on public.credit_transactions (user_id);
create index credit_transactions_video_idx on public.credit_transactions (video_id);
create index credit_transactions_created_by_idx on public.credit_transactions (created_by);
create index credit_transactions_type_created_idx on public.credit_transactions (type, created_at desc);

-- ---------------------------------------------------------------------------
-- subscriptions: mirror of Stripe subscriptions per organization
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  stripe_price_id text,
  plan_id text not null,
  status public.subscription_status not null,
  monthly_credits integer not null check (monthly_credits >= 0),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_org_idx on public.subscriptions (organization_id);
create index subscriptions_customer_idx on public.subscriptions (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- api_usage_logs: provider call metrics. Never stores prompts, images, URLs or keys.
-- ---------------------------------------------------------------------------
create table public.api_usage_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  video_id uuid references public.videos (id) on delete set null,
  video_job_id uuid references public.video_jobs (id) on delete set null,
  provider text not null default 'kling',
  operation text not null check (operation in (
    'create_text_to_video', 'create_image_to_video', 'get_task', 'get_task_by_external_id', 'download_video'
  )),
  http_status integer,
  provider_code integer,
  provider_request_id text check (provider_request_id is null or char_length(provider_request_id) <= 128),
  success boolean not null,
  error_category text check (error_category is null or char_length(error_category) <= 64),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  attempt integer not null default 1,
  provider_units numeric(10, 3),
  cost_usd numeric(12, 4),
  created_at timestamptz not null default now()
);

create index api_usage_logs_created_idx on public.api_usage_logs (created_at desc);
create index api_usage_logs_org_created_idx on public.api_usage_logs (organization_id, created_at desc);
create index api_usage_logs_user_created_idx on public.api_usage_logs (user_id, created_at desc);
create index api_usage_logs_video_idx on public.api_usage_logs (video_id);
create index api_usage_logs_job_idx on public.api_usage_logs (video_job_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
  for each row execute function public.set_updated_at();
create trigger videos_set_updated_at before update on public.videos
  for each row execute function public.set_updated_at();
create trigger video_jobs_set_updated_at before update on public.video_jobs
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Ledger amounts are immutable. Only the nullable references (user_id, video_id,
-- created_by) may change, which happens through ON DELETE SET NULL. Rows are
-- deleted only by cascade when their organization is deleted.
create or replace function public.prevent_ledger_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'VF_LEDGER_IMMUTABLE' using errcode = 'P0001';
end;
$$;

create trigger credit_transactions_immutable
  before update of organization_id, type, amount, balance_after, idempotency_key,
    stripe_reference, amount_paid_cents, currency, description, metadata, created_at
  on public.credit_transactions
  for each row execute function public.prevent_ledger_mutation();
