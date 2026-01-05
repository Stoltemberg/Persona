-- Create recurring_templates table
create table recurring_templates (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  amount numeric not null,
  type text not null check (type in ('income', 'expense')),
  category text, -- Can link to categories table if desired, but text for now to match transactions
  expense_type text,
  frequency text not null default 'monthly', -- 'monthly', 'weekly'
  active boolean default true,
  last_generated_date timestamp with time zone,
  next_due_date timestamp with time zone not null,
  profile_id uuid references profiles(id) on delete cascade not null
);

-- RLS
alter table recurring_templates enable row level security;

create policy "Users can CRUD their own templates"
  on recurring_templates for all
  using (auth.uid() = profile_id);
