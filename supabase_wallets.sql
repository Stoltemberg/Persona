-- Create wallets table
create table wallets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  type text not null default 'checking', -- checking, savings, cash, credit_card, investment
  color text default '#12c2e9',
  initial_balance numeric default 0,
  profile_id uuid references profiles(id) on delete cascade not null
);

-- RLS
alter table wallets enable row level security;

create policy "Users can CRUD their own wallets"
  on wallets for all
  using (auth.uid() = profile_id);

-- Add wallet_id to transactions
alter table transactions add column wallet_id uuid references wallets(id) on delete set null;
