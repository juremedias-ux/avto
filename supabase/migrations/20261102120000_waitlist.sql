-- GradimoCamper: seznam prijav na obvestilo ob zagonu
--
-- Vsebina:
--   1. tabela public.waitlist (prijave in ločeni privolitvi),
--   2. zasebna shema private z začasnimi števci za omejevanje zahtev,
--   3. funkciji public.waitlist_subscribe in public.check_rate_limit,
--   4. RLS in najmanjše potrebne pravice.
--
-- Javni vlogi anon in authenticated nimata nobenega dostopa do tabel in
-- funkcij. Dostop ima samo service_role (strežnik aplikacije).

begin;

-- 1. Prijave -----------------------------------------------------------------

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),

  -- Normaliziran naslov: brez robnih presledkov, z malimi črkami.
  -- Pik in dodatkov za znakom "+" ne odstranjujemo.
  email text not null,

  created_at timestamptz not null default now(),

  -- Obvestilo ob zagonu (obvezna privolitev ob prijavi).
  launch_consent_at timestamptz not null default now(),
  launch_revoked_at timestamptz,
  launch_consent boolean generated always as (launch_revoked_at is null) stored,

  -- Nasveti, novice in občasne ponudbe (neobvezna privolitev).
  newsletter_consent_at timestamptz,
  newsletter_revoked_at timestamptz,
  newsletter_consent boolean generated always as (
    newsletter_consent_at is not null and newsletter_revoked_at is null
  ) stored,

  -- Različica besedila privolitev, prikazanega ob prijavi.
  consent_text_version text not null,

  -- Obrazec, prek katerega je prišla prijava.
  source text not null,

  constraint waitlist_email_key unique (email),
  constraint waitlist_email_format check (
    char_length(email) between 6 and 254
    and email = btrim(email)
    and email !~ '[A-Z[:space:]]'
    and email ~ '^[^@]+@[^@]+\.[^@]+$'
  ),
  constraint waitlist_source_check check (source in ('prvi_zaslon', 'zakljucek')),
  constraint waitlist_version_check check (char_length(consent_text_version) between 1 and 64),
  constraint waitlist_launch_revocation_check check (
    launch_revoked_at is null or launch_revoked_at >= launch_consent_at
  ),
  constraint waitlist_newsletter_revocation_check check (
    newsletter_revoked_at is null
    or (newsletter_consent_at is not null and newsletter_revoked_at >= newsletter_consent_at)
  )
);

comment on table public.waitlist is
  'Prijave na obvestilo ob zagonu GradimoCamper. Lastništvo naslovov ni preverjeno (ni double opt-in).';
comment on column public.waitlist.launch_consent is 'Aktivna privolitev za obvestilo ob zagonu (izračunano).';
comment on column public.waitlist.newsletter_consent is 'Aktivna privolitev za nasvete, novice in ponudbe (izračunano).';

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc, id);

alter table public.waitlist enable row level security;
-- Namerno brez politik: anon in authenticated ne vidita ničesar.

revoke all on table public.waitlist from public, anon, authenticated;
grant select, insert, update, delete on table public.waitlist to service_role;

-- 2. Števci za omejevanje zahtev ------------------------------------------------

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  expires_at timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

comment on table private.rate_limits is
  'Kratkotrajni števci zahtev. Ključ je HMAC-povzetek IP-naslova (brez izvirnega naslova). Zapisi se brišejo ob poteku okna.';

create index if not exists rate_limits_expires_at_idx on private.rate_limits (expires_at);

alter table private.rate_limits enable row level security;
revoke all on table private.rate_limits from public, anon, authenticated;

-- 3. Funkcije -------------------------------------------------------------------

-- Shrani prijavo. Obstoječega naslova ne spremeni (tudi ne preklicanih
-- privolitev) in ne razkrije, ali je naslov že prijavljen.
create or replace function public.waitlist_subscribe(
  p_email text,
  p_newsletter boolean,
  p_consent_text_version text,
  p_source text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.waitlist (
    email,
    launch_consent_at,
    newsletter_consent_at,
    consent_text_version,
    source
  )
  values (
    p_email,
    now(),
    case when coalesce(p_newsletter, false) then now() else null end,
    p_consent_text_version,
    p_source
  )
  on conflict (email) do nothing;
end;
$$;

-- Atomarni števec v fiksnem časovnem oknu. Vrne true, če je zahteva
-- dovoljena. Ob vsakem klicu izbriše potekle zapise.
create or replace function public.check_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_hits integer;
begin
  if p_key is null
     or char_length(p_key) not between 1 and 128
     or p_limit is null or p_limit < 1
     or p_window_seconds is null or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into private.rate_limits as r (key, window_start, expires_at, hits)
  values (
    p_key,
    v_window_start,
    v_window_start + make_interval(secs => p_window_seconds),
    1
  )
  on conflict (key, window_start)
  do update set hits = r.hits + 1
  returning r.hits into v_hits;

  delete from private.rate_limits where expires_at < now();

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.waitlist_subscribe(text, boolean, text, text) from public, anon, authenticated;
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.waitlist_subscribe(text, boolean, text, text) to service_role;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

commit;
