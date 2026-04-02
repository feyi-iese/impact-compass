-- Run this in Supabase → SQL Editor if you see:
--   401 + "new row violates row-level security policy for table waitlist"
-- or organizer / onboarding inserts fail with 42501.
--
-- Safe to run multiple times.

-- --- Waitlist (anonymous email signup) ---
create extension if not exists "uuid-ossp";

create table if not exists public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.waitlist enable row level security;
alter table public.waitlist no force row level security;

-- Drop every existing waitlist policy (including legacy restrictive ones)
-- so we cannot be blocked by old policy names / modes.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist'
  loop
    execute format('drop policy if exists %I on public.waitlist', pol.policyname);
  end loop;
end $$;

create policy "Anyone can sign up for waitlist" on public.waitlist
  for insert to anon, authenticated
  with check (true);

create policy "Only admin can view waitlist" on public.waitlist
  for select to anon, authenticated
  using (false);

grant usage on schema public to anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

-- --- Organizer form (home page) ---
create table if not exists public.org_interests (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  email text not null,
  cause text not null,
  phone text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.org_interests enable row level security;

drop policy if exists "Anyone can submit org interest" on public.org_interests;
drop policy if exists "Org interests not publicly readable" on public.org_interests;

create policy "Anyone can submit org interest" on public.org_interests
  for insert to anon, authenticated
  with check (true);

create policy "Org interests not publicly readable" on public.org_interests
  for select to anon, authenticated
  using (false);

grant insert on public.org_interests to anon, authenticated;

alter table public.org_interests
  add column if not exists phone text;

alter table public.org_interests
  add column if not exists description text;

-- --- Next-phase MVP tables (safe to re-run) ---
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists role text not null default 'volunteer';

alter table public.profiles
  add column if not exists organization_id uuid;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  focus_areas text[],
  phone text,
  description text,
  contact_email text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.organizations enable row level security;

drop policy if exists "Organizer owners can read own organizations" on public.organizations;
drop policy if exists "Organizer owners can create organizations" on public.organizations;
drop policy if exists "Organizer owners can update organizations" on public.organizations;
drop policy if exists "Organizer owners can delete organizations" on public.organizations;

create policy "Organizer owners can read own organizations" on public.organizations
  for select to authenticated
  using (owner_user_id = auth.uid());

create policy "Organizer owners can create organizations" on public.organizations
  for insert to authenticated
  with check (owner_user_id = auth.uid());

create policy "Organizer owners can update organizations" on public.organizations
  for update to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "Organizer owners can delete organizations" on public.organizations
  for delete to authenticated
  using (owner_user_id = auth.uid());

grant select, insert, update, delete on public.organizations to authenticated;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  organizer_user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text not null,
  cause_domain text not null,
  location_address text not null,
  date_time timestamptz not null,
  end_time timestamptz,
  duration_minutes integer not null default 60,
  capacity integer not null check (capacity > 0),
  status text not null default 'active',
  frequency text,
  requirements text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.events enable row level security;

drop policy if exists "Public can read active events" on public.events;
drop policy if exists "Organizers can read own events" on public.events;
drop policy if exists "Organizers can insert own events" on public.events;
drop policy if exists "Organizers can update own events" on public.events;
drop policy if exists "Organizers can delete own events" on public.events;

create policy "Public can read active events" on public.events
  for select to anon, authenticated
  using (status = 'active' or organizer_user_id = auth.uid());

create policy "Organizers can read own events" on public.events
  for select to authenticated
  using (organizer_user_id = auth.uid());

create policy "Organizers can insert own events" on public.events
  for insert to authenticated
  with check (organizer_user_id = auth.uid());

create policy "Organizers can update own events" on public.events
  for update to authenticated
  using (organizer_user_id = auth.uid())
  with check (organizer_user_id = auth.uid());

create policy "Organizers can delete own events" on public.events
  for delete to authenticated
  using (organizer_user_id = auth.uid());

grant select on public.events to anon, authenticated;
grant insert, update, delete on public.events to authenticated;

create table if not exists public.event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  volunteer_user_id uuid references auth.users(id) on delete cascade not null,
  status text not null default 'registered',
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (event_id, volunteer_user_id)
);

alter table public.event_signups enable row level security;

drop policy if exists "Volunteers can read own signups" on public.event_signups;
drop policy if exists "Volunteers can create own signups" on public.event_signups;
drop policy if exists "Volunteers can update own signups" on public.event_signups;
drop policy if exists "Organizers can read signups for own events" on public.event_signups;

create policy "Volunteers can read own signups" on public.event_signups
  for select to authenticated
  using (volunteer_user_id = auth.uid());

create policy "Volunteers can create own signups" on public.event_signups
  for insert to authenticated
  with check (volunteer_user_id = auth.uid());

create policy "Volunteers can update own signups" on public.event_signups
  for update to authenticated
  using (volunteer_user_id = auth.uid())
  with check (volunteer_user_id = auth.uid());

create policy "Organizers can read signups for own events" on public.event_signups
  for select to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.organizer_user_id = auth.uid()
    )
  );

grant select, insert, update on public.event_signups to authenticated;

create table if not exists public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade not null,
  signup_id uuid references public.event_signups(id) on delete cascade not null,
  reminder_type text not null,
  send_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'queued',
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (signup_id, reminder_type)
);

alter table public.reminder_jobs enable row level security;

drop policy if exists "Users can read own reminder jobs" on public.reminder_jobs;
drop policy if exists "Organizers can read reminder jobs for own events" on public.reminder_jobs;

create policy "Users can read own reminder jobs" on public.reminder_jobs
  for select to authenticated
  using (
    exists (
      select 1
      from public.event_signups s
      where s.id = signup_id
        and s.volunteer_user_id = auth.uid()
    )
  );

create policy "Organizers can read reminder jobs for own events" on public.reminder_jobs
  for select to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_id
        and e.organizer_user_id = auth.uid()
    )
  );

grant select on public.reminder_jobs to authenticated;

create or replace function public.register_for_event(target_event_id uuid)
returns public.event_signups
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_event public.events%rowtype;
  existing_signup public.event_signups%rowtype;
  has_existing_signup boolean := false;
  registered_count integer;
  result_signup public.event_signups%rowtype;
  reminder_24h timestamptz;
  reminder_1h timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_event
  from public.events
  where id = target_event_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Event not found or inactive';
  end if;

  select *
  into existing_signup
  from public.event_signups
  where event_id = target_event_id
    and volunteer_user_id = current_user_id
  for update;

  has_existing_signup := found;

  if has_existing_signup and existing_signup.status = 'registered' then
    result_signup := existing_signup;
  else
    select count(*)
    into registered_count
    from public.event_signups
    where event_id = target_event_id
      and status = 'registered';

    if registered_count >= target_event.capacity then
      raise exception 'Event is full';
    end if;

    if has_existing_signup then
      update public.event_signups
      set status = 'registered'
      where id = existing_signup.id
      returning * into result_signup;
    else
      insert into public.event_signups (event_id, volunteer_user_id, status)
      values (target_event_id, current_user_id, 'registered')
      returning * into result_signup;
    end if;
  end if;

  reminder_24h := target_event.date_time - interval '24 hours';
  reminder_1h := target_event.date_time - interval '1 hour';

  insert into public.reminder_jobs (event_id, signup_id, reminder_type, send_at)
  values
    (target_event_id, result_signup.id, '24h', reminder_24h),
    (target_event_id, result_signup.id, '1h', reminder_1h)
  on conflict (signup_id, reminder_type) do update
  set send_at = excluded.send_at,
      status = 'queued',
      sent_at = null
  where excluded.send_at > timezone('utc'::text, now());

  delete from public.reminder_jobs
  where signup_id = result_signup.id
    and send_at <= timezone('utc'::text, now());

  return result_signup;
end;
$$;

grant execute on function public.register_for_event(uuid) to authenticated;

create or replace function public.cancel_event_signup(target_event_id uuid)
returns public.event_signups
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  result_signup public.event_signups%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  update public.event_signups
  set status = 'cancelled'
  where event_id = target_event_id
    and volunteer_user_id = current_user_id
  returning * into result_signup;

  if not found then
    raise exception 'Signup not found';
  end if;

  delete from public.reminder_jobs
  where signup_id = result_signup.id
    and sent_at is null;

  return result_signup;
end;
$$;

grant execute on function public.cancel_event_signup(uuid) to authenticated;
