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
