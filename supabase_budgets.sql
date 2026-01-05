-- Create budgets table
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category_id uuid references categories(id) on delete cascade not null,
  amount numeric not null, -- The limit amount
  profile_id uuid references profiles(id) on delete cascade not null,
  unique(category_id, profile_id) -- One budget per category per user
);

-- RLS
alter table budgets enable row level security;

create policy "Users can CRUD their own budgets"
  on budgets for all
  using (auth.uid() = profile_id);
