-- Run this once in the Supabase SQL Editor to add the round tracker.
-- Safe to run alongside your existing schema.sql — this only adds new tables,
-- it doesn't touch analyses, usage_logs, or the reports bucket.

create table if not exists public.tracked_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  analysis_id uuid references public.analyses,
  account text,
  item_type text,
  bureaus text[],
  balance text,
  status text,
  dofd text,
  issues jsonb,
  created_at timestamptz default now()
);

alter table public.tracked_items enable row level security;

create policy "individuals read own tracked items"
  on public.tracked_items for select
  using (auth.uid() = user_id);

create policy "individuals insert own tracked items"
  on public.tracked_items for insert
  with check (auth.uid() = user_id);

create policy "individuals update own tracked items"
  on public.tracked_items for update
  using (auth.uid() = user_id);

create table if not exists public.tracker_rounds (
  id uuid primary key default gen_random_uuid(),
  tracked_item_id uuid references public.tracked_items not null,
  user_id uuid references auth.users not null,
  round_number int not null,
  letter_type text,
  sent_date date,
  response_type text default 'pending',
  response_date date,
  notes text,
  created_at timestamptz default now()
);

alter table public.tracker_rounds enable row level security;

create policy "individuals read own rounds"
  on public.tracker_rounds for select
  using (auth.uid() = user_id);

create policy "individuals insert own rounds"
  on public.tracker_rounds for insert
  with check (auth.uid() = user_id);

create policy "individuals update own rounds"
  on public.tracker_rounds for update
  using (auth.uid() = user_id);
