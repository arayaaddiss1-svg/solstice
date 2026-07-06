-- Solstice: perimenopause self-management app
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- 1. Daily logs table
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null,
  hot_flashes int default 0,
  night_sweats boolean default false,
  sleep_hours numeric(3,1),
  sleep_quality int check (sleep_quality between 1 and 5),
  mood int check (mood between 1 and 5),
  brain_fog int check (brain_fog between 1 and 5),
  joint_aches int check (joint_aches between 1 and 5),
  cycle_status text check (cycle_status in ('none','light','regular','heavy','spotting')),
  notes text,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table public.logs enable row level security;

create policy "Users can view their own logs"
  on public.logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.logs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own logs"
  on public.logs for delete
  using (auth.uid() = user_id);

-- 2. Index for fast per-user date-range queries (the Arc, insights, reports)
create index if not exists logs_user_date_idx on public.logs (user_id, log_date desc);

-- 3. Optional: profile table for display name (auth.users already stores email)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can upsert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 4. Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
