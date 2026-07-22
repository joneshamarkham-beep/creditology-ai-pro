-- Run this once in the Supabase SQL Editor (Supabase dashboard > SQL Editor > New query).
-- It creates the tables and storage bucket the analysis feature needs, and
-- locks every row down so each member can only ever see their own data.

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  created_at timestamptz default now(),
  summary text,
  items jsonb,
  plan jsonb,
  bureaus text[]
);

alter table public.analyses enable row level security;

create policy "individuals read own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "individuals insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  created_at timestamptz default now(),
  input_tokens int,
  output_tokens int,
  purpose text
);

alter table public.usage_logs enable row level security;

create policy "individuals read own usage"
  on public.usage_logs for select
  using (auth.uid() = user_id);

create policy "individuals insert own usage"
  on public.usage_logs for insert
  with check (auth.uid() = user_id);

-- Private bucket for members who opt in to saving their uploaded reports.
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

create policy "individuals read own reports"
  on storage.objects for select
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "individuals upload own reports"
  on storage.objects for insert
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "individuals delete own reports"
  on storage.objects for delete
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
