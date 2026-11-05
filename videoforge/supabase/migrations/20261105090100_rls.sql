-- VideoForge AI — row-level security
--
-- Access model
-- * The browser never talks to the database directly. All reads happen in
--   Next.js server code with the signed-in user's JWT (role "authenticated"),
--   so these policies are the isolation boundary between organizations.
-- * All writes that touch credits, generations, memberships or billing go
--   through SECURITY DEFINER functions that only the service role may execute
--   (see 20261105090200_functions.sql), called from server code after the
--   session has been verified.
-- * Internal tables (video_jobs, api_usage_logs) are not readable by customers.

-- ---------------------------------------------------------------------------
-- Helper functions used inside policies (SECURITY DEFINER avoids policy recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.users u on u.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and u.status <> 'blocked'
  );
$$;

create or replace function public.is_org_admin(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.users u on u.id = m.user_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
      and u.status <> 'blocked'
  );
$$;

create or replace function public.shares_organization(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = p_user_id
  );
$$;

revoke all on function public.is_org_member(uuid) from public, anon;
revoke all on function public.is_org_admin(uuid) from public, anon;
revoke all on function public.shares_organization(uuid) from public, anon;
grant execute on function public.is_org_member(uuid) to authenticated, service_role;
grant execute on function public.is_org_admin(uuid) to authenticated, service_role;
grant execute on function public.shares_organization(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.videos enable row level security;
alter table public.video_jobs enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.api_usage_logs enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges: anon gets nothing; authenticated gets SELECT plus a few
-- column-level UPDATEs. Everything else is service-role only.
-- ---------------------------------------------------------------------------
revoke all on table
  public.users, public.organizations, public.organization_members, public.videos,
  public.video_jobs, public.credit_transactions, public.subscriptions, public.api_usage_logs
from anon, authenticated;

grant select on table
  public.users, public.organizations, public.organization_members, public.videos,
  public.credit_transactions, public.subscriptions
to authenticated;

grant update (full_name, locale, active_organization_id) on table public.users to authenticated;
grant update (name) on table public.organizations to authenticated;

grant all on table
  public.users, public.organizations, public.organization_members, public.videos,
  public.video_jobs, public.credit_transactions, public.subscriptions, public.api_usage_logs
to service_role;
grant usage, select on sequence public.api_usage_logs_id_seq to service_role;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
create policy users_select_self_or_teammates on public.users
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_organization(id));

create policy users_update_self on public.users
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and (active_organization_id is null or public.is_org_member(active_organization_id))
  );

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create policy organizations_select_members on public.organizations
  for select to authenticated
  using (public.is_org_member(id));

create policy organizations_update_admins on public.organizations
  for update to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create policy organization_members_select_members on public.organization_members
  for select to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- videos (soft-deleted rows are hidden)
-- ---------------------------------------------------------------------------
create policy videos_select_members on public.videos
  for select to authenticated
  using (deleted_at is null and public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- credit_transactions
-- ---------------------------------------------------------------------------
create policy credit_transactions_select_members on public.credit_transactions
  for select to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create policy subscriptions_select_members on public.subscriptions
  for select to authenticated
  using (public.is_org_member(organization_id));

-- video_jobs and api_usage_logs: RLS enabled, no policies => no customer access.
