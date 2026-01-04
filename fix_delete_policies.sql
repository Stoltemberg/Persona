-- 1. Fix Goals RLS (Allow Delete)
drop policy if exists "Users can delete own goals" on goals;
create policy "Users can delete own goals" on goals
  for delete using (auth.uid() = profile_id);

-- 2. Fix Transactions RLS (Allow Delete and Update if missing)
drop policy if exists "Users can delete own transactions" on transactions;
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = profile_id);

drop policy if exists "Users can update own transactions" on transactions;
create policy "Users can update own transactions" on transactions
  for update using (auth.uid() = profile_id);
