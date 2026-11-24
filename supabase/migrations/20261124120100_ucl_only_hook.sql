-- Sign-up is limited to verified @ucl.ac.uk addresses, enforced in Supabase
-- Auth itself (not just the UI):
--   1. hook_ucl_only is the "before user created" Auth hook: GoTrue calls it for
--      every sign-up (magic link, code or password) and
--      refuses to create the account if it returns an error. Enabled in
--      supabase/config.jsonc locally; on the hosted project, enable it under
--      Authentication → Hooks (see README "Supabase setup").
--   2. ucl_only_users, a trigger on auth.users, refuses any other address at
--      insert (this covers the admin API too, which skips the hook) and stops
--      an existing account changing its email to a non-UCL address.
--   3. Email confirmation is on, so an address gets a session only after the
--      link or code sent to it has been used.

create function public.is_ucl_email(p_email text) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(lower(trim(p_email)) ~ '^[a-z0-9._%+''-]+@ucl\.ac\.uk$', false);
$$;

create function public.hook_ucl_only(event jsonb) returns jsonb
language plpgsql set search_path = '' as $$
begin
  if public.is_ucl_email(event -> 'user' ->> 'email') then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'Sign-up is limited to @ucl.ac.uk email addresses.'
  ));
end $$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.is_ucl_email(text) to supabase_auth_admin;
grant execute on function public.hook_ucl_only(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_ucl_only(jsonb) from public, anon, authenticated;

create function public.ucl_only_users() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_ucl_email(new.email) then
      raise exception 'Sign-up is limited to @ucl.ac.uk email addresses.' using errcode = '22023';
    end if;
    return new;
  end if;
  if new.email is distinct from old.email and new.email is not null and not public.is_ucl_email(new.email) then
    raise exception 'Only @ucl.ac.uk email addresses can be used.' using errcode = '22023';
  end if;
  if new.email_change is distinct from old.email_change and coalesce(new.email_change, '') <> '' and not public.is_ucl_email(new.email_change) then
    raise exception 'Only @ucl.ac.uk email addresses can be used.' using errcode = '22023';
  end if;
  return new;
end $$;
revoke execute on function public.ucl_only_users() from public, anon, authenticated;

create trigger ucl_only_users
  before insert or update of email, email_change on auth.users
  for each row execute function public.ucl_only_users();
