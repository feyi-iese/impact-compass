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
