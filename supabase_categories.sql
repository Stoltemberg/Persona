-- Create categories table
create table categories (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  icon text, -- Store lucide icon name or emoji
  color text, -- Store hex color
  type text not null check (type in ('income', 'expense')),
  profile_id uuid references profiles(id) on delete cascade not null
);

-- RLS Policies
alter table categories enable row level security;

create policy "Users can view their own categories"
  on categories for select
  using (auth.uid() = profile_id);

create policy "Users can insert their own categories"
  on categories for insert
  with check (auth.uid() = profile_id);

create policy "Users can update their own categories"
  on categories for update
  using (auth.uid() = profile_id);

create policy "Users can delete their own categories"
  on categories for delete
  using (auth.uid() = profile_id);

-- Insert Default Categories for new users (Optional - requires triggers or manual app logic)
-- For now, we will handle default categories in the Frontend App logic (onboarding).
