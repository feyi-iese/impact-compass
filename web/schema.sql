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

-- Policy: Anyone can sign up for the waitlist
create policy "Anyone can sign up for waitlist" on public.waitlist
  for insert with check (true);

-- Policy: Only service role can view waitlist (admin only)
create policy "Only admin can view waitlist" on public.waitlist
  for select using (false);


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
