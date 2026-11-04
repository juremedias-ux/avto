-- GradimoCamper: funkcija waitlist_subscribe vrne, ali je bila prijava nova.
--
-- true  = naslov je bil na novo shranjen,
-- false = naslov je že obstajal (nič se ne spremeni).
--
-- Aplikacija na podlagi tega pošlje obvestilo lastniku samo ob novi
-- prijavi. Obiskovalcu se odziv ne spremeni (enak za novo in obstoječo
-- prijavo).

begin;

drop function if exists public.waitlist_subscribe(text, boolean, text, text);

create function public.waitlist_subscribe(
  p_email text,
  p_newsletter boolean,
  p_consent_text_version text,
  p_source text
)
returns boolean
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

  -- FOUND je true samo, če je bila vrstica vstavljena.
  return found;
end;
$$;

revoke all on function public.waitlist_subscribe(text, boolean, text, text) from public, anon, authenticated;
grant execute on function public.waitlist_subscribe(text, boolean, text, text) to service_role;

commit;
