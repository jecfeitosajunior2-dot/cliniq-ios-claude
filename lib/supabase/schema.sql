-- =============================================================================
-- ClinIQ — schema do backend (auth + casos + storage de áudio)
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
-- =============================================================================

-- 1) Perfil do médico (nome para a saudação, etc.) ----------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Cria o perfil automaticamente no cadastro, puxando o nome do metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Casos clínicos -----------------------------------------------------------
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_name text,
  patient_initials text,
  age text,
  gender text,
  specialty text,
  chief_complaint text,
  summary text,
  findings_count int not null default 0,
  cost_usd numeric not null default 0,
  case_data jsonb,
  transcription jsonb,
  intelligence jsonb,
  audio_path text,
  created_at timestamptz not null default now()
);

create index if not exists cases_user_created_idx
  on public.cases (user_id, created_at desc);

alter table public.cases enable row level security;

drop policy if exists "cases_select_own" on public.cases;
create policy "cases_select_own" on public.cases
  for select using (auth.uid() = user_id);

drop policy if exists "cases_insert_own" on public.cases;
create policy "cases_insert_own" on public.cases
  for insert with check (auth.uid() = user_id);

drop policy if exists "cases_update_own" on public.cases;
create policy "cases_update_own" on public.cases
  for update using (auth.uid() = user_id);

drop policy if exists "cases_delete_own" on public.cases;
create policy "cases_delete_own" on public.cases
  for delete using (auth.uid() = user_id);

-- 3) Storage de áudio (bucket privado, cada médico na sua pasta) ---------------
insert into storage.buckets (id, name, public)
values ('consultations', 'consultations', false)
on conflict (id) do nothing;

drop policy if exists "consultations_read_own" on storage.objects;
create policy "consultations_read_own" on storage.objects
  for select using (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "consultations_insert_own" on storage.objects;
create policy "consultations_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "consultations_delete_own" on storage.objects;
create policy "consultations_delete_own" on storage.objects
  for delete using (
    bucket_id = 'consultations'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
