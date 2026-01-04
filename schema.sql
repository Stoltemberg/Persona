-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  username text unique,
  avatar_url text,
  household_id uuid, -- We will create this table next
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Households Table (Shared space for couples)
create table households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table households enable row level security;

-- Transactions Table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  amount numeric not null,
  description text not null,
  category text,
  type text check (type in ('income', 'expense')),
  date date not null default CURRENT_DATE,
  profile_id uuid references profiles(id) not null,
  household_id uuid references households(id), -- Optional: if null, it's personal
  is_shared boolean default false
);

alter table transactions enable row level security;

create policy "Users can view their own transactions" on transactions
  for select using (auth.uid() = profile_id);
  
create policy "Users can view household transactions" on transactions
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.household_id = transactions.household_id
    )
  );

create policy "Users can insert own transactions" on transactions
  for insert with check (auth.uid() = profile_id);
