-- 1. Create a function to automatically create a profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    -- Generate a default username (email prefix + random number to ensure uniqueness/length)
    split_part(new.email, '@', 1) || '_' || floor(random() * 1000)::text
  );
  return new;
end;
$$;

-- 2. Create the trigger on the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. CRITICAL: Fix your current user (Backfill missing profiles)
insert into public.profiles (id, email, full_name, username)
select 
  id, 
  email, 
  raw_user_meta_data ->> 'full_name',
  split_part(email, '@', 1) || '_' || floor(random() * 1000)::text
from auth.users
where id not in (select id from public.profiles);
