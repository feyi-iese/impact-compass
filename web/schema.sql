-- Create a table for public profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  display_name text,
  zip_code text,
  causes text[], 
  skills text[],
  notifications_opt_in boolean default false,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Value prop: Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policy: Public profiles are viewable by everyone
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

-- Policy: Users can insert their own profile
create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Create a table for the waitlist (publicly writeable for now)
create table public.waitlist (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for waitlist
alter table public.waitlist enable row level security;

-- Policy: Anyone can sign up for the waitlist (explicit roles = reliable with Supabase API)
create policy "Anyone can sign up for waitlist" on public.waitlist
  for insert to anon, authenticated
  with check (true);

-- Policy: Only service role can view waitlist (admin only)
create policy "Only admin can view waitlist" on public.waitlist
  for select to anon, authenticated
  using (false);

grant usage on schema public to anon, authenticated;
grant insert on public.waitlist to anon, authenticated;


-- Function to handle new user signup trigger
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Onboarding (anonymous): server-side preference capture without auth.users id
-- ---------------------------------------------------------------------------
create table public.onboarding_submissions (
  id uuid primary key default gen_random_uuid(),
  email text,
  zip_code text not null,
  causes text[],
  skills text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.onboarding_submissions enable row level security;

create policy "Anyone can submit onboarding preferences" on public.onboarding_submissions
  for insert to anon, authenticated
  with check (true);

create policy "Onboarding submissions not publicly readable" on public.onboarding_submissions
  for select to anon, authenticated
  using (false);

grant insert on public.onboarding_submissions to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Organizer interest (home page "I'm an organizer" form)
-- ---------------------------------------------------------------------------
create table public.org_interests (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  email text not null,
  cause text not null,
  phone text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.org_interests enable row level security;

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

-- ---------------------------------------------------------------------------
-- Opportunities (feed + detail); seed rows mirror web/src/lib/seedData.js
-- ---------------------------------------------------------------------------
create table public.opportunities (
  id text primary key,
  title text not null,
  description text not null,
  cause_domain text not null,
  organizer_name text not null,
  organizer_verified boolean default false not null,
  date_time timestamp with time zone not null,
  duration_minutes integer not null,
  location_address text not null,
  location_lat double precision,
  location_lng double precision,
  capacity integer not null,
  requirements text,
  image_url text,
  status text not null default 'active',
  spots_left integer not null
);

alter table public.opportunities enable row level security;

create policy "Active opportunities are viewable by everyone" on public.opportunities
  for select to anon, authenticated
  using (status = 'active');

grant select on public.opportunities to anon, authenticated;

-- Seed rows (idempotent; safe to re-run)
insert into public.opportunities (
  id, title, description, cause_domain, organizer_name, organizer_verified,
  date_time, duration_minutes, location_address, location_lat, location_lng,
  capacity, requirements, image_url, status, spots_left
)
values
  (
    '1',
    'Urban Tree Planting Day',
    $$Help us plant 200 trees in the Eixample district. All tools and training provided. Perfect for first-timers! We'll be working alongside the city's environmental team to restore native species and boost urban biodiversity.$$,
    'Climate Action',
    'Barcelona Green Alliance',
    true,
    '2026-03-08T09:00:00Z'::timestamptz,
    180,
    'Parc de la Ciutadella, Barcelona',
    41.3879,
    2.1699,
    30,
    'Wear comfortable clothes and sturdy shoes. Gloves provided.',
    null,
    'active',
    12
  ),
  (
    '2',
    'Language Café for Refugees',
    $$Practice Spanish conversation with newly arrived refugees in a relaxed café setting. No teaching experience needed — just patience and a smile. Coffee and snacks provided by our partner bakery.$$,
    'Social Justice',
    'Benvinguts Initiative',
    true,
    '2026-03-05T17:00:00Z'::timestamptz,
    120,
    'Café Cometa, Carrer del Parlament 20, Barcelona',
    41.3762,
    2.1622,
    15,
    'Conversational Spanish (B1+). Friendly attitude!',
    null,
    'active',
    6
  ),
  (
    '3',
    'Kids Coding Workshop (Volunteer Mentor)',
    $$Guide a group of 8–12 year-olds through their first Scratch project. You'll be paired with 2–3 kids. Curriculum is provided — you just bring enthusiasm and patience.$$,
    'Education',
    'Codi per a Tothom',
    true,
    '2026-03-10T14:00:00Z'::timestamptz,
    150,
    'Centre Cívic Pati Llimona, Barcelona',
    41.3825,
    2.1802,
    10,
    'Basic programming knowledge. DBS check completed (we can help).',
    null,
    'active',
    4
  ),
  (
    '4',
    'Food Rescue & Distribution',
    $$Collect surplus food from local markets and restaurants, sort it at our hub, and distribute care packages to people sleeping rough. A direct, hands-on way to fight food waste and hunger at the same time.$$,
    'Community Building',
    'FoodShare Barcelona',
    false,
    '2026-03-06T07:00:00Z'::timestamptz,
    240,
    'Mercat de Sant Antoni, Barcelona',
    41.3772,
    2.1631,
    20,
    'Able to carry boxes (up to 10kg). Early start!',
    null,
    'active',
    8
  ),
  (
    '5',
    'Animal Shelter Morning Help',
    $$Walk dogs, socialize cats, and help clean enclosures at Barcelona's largest animal shelter. A great way to spend a Saturday morning if you love animals but can't have your own pet.$$,
    'Animal Welfare',
    'Fundació FAADA',
    true,
    '2026-03-15T08:30:00Z'::timestamptz,
    180,
    $$Centre d'Acollida d'Animals, Barcelona$$,
    41.4207,
    2.1873,
    12,
    'No allergies to animals. Closed-toe shoes.',
    null,
    'active',
    5
  ),
  (
    '6',
    'Beach & River Cleanup',
    $$Join us for a 3-hour cleanup along the Barceloneta beach. Bags, grabbers, and gloves provided. We'll record and weigh everything we collect for our impact report.$$,
    'Climate Action',
    'Clean Coast Initiative',
    false,
    '2026-03-22T10:00:00Z'::timestamptz,
    180,
    'Platja de la Barceloneta, Barcelona',
    41.3760,
    2.1920,
    40,
    'Dress for weather. Sunscreen recommended.',
    null,
    'active',
    22
  )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Next-phase MVP foundation (idempotent)
-- Organizations, events, event signups, and reminder queue
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists role text not null default 'volunteer';

alter table public.profiles
  add column if not exists organization_id uuid;

-- Organizations owned by authenticated organizer users.
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

-- Event table for organizer-owned opportunities.
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
  skills_needed text[],
  event_category text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.events enable row level security;

-- Add metadata columns for scraped data
alter table public.events 
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists contact_website text,
  add column if not exists imported_organizer_name text;

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

-- Volunteer signups to events.
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

-- Basic reminder queue for organizer/volunteer event reminders.
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

-- ---------------------------------------------------------------------------
-- Safer signup/cancel RPCs for event registration and reminder scheduling.
-- ---------------------------------------------------------------------------
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
