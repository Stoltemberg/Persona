create table goals (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  title text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline date,
  profile_id uuid references profiles(id) not null
);

alter table goals enable row level security;

create policy "Users can view own goals" on goals
  for select using (auth.uid() = profile_id);

create policy "Users can insert own goals" on goals
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own goals" on goals
  for update using (auth.uid() = profile_id);
