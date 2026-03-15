-- Fin.SYS - Sync (Snapshot único por usuário)
-- Execute este SQL no Supabase SQL Editor.

-- 1) Tabela
create table if not exists public.fin_sys_user_snapshot (
  user_id uuid primary key references auth.users (id) on delete cascade,
  updated_at timestamptz not null default now(),
  snapshot jsonb not null
);

-- 2) Índices (opcional - JSON já é indexado internamente; mas updated_at ajuda)
create index if not exists fin_sys_user_snapshot_updated_at_idx
  on public.fin_sys_user_snapshot (updated_at desc);

-- 3) RLS
alter table public.fin_sys_user_snapshot enable row level security;

-- Permite SELECT apenas do próprio usuário
drop policy if exists "fin_sys_snapshot_select_own" on public.fin_sys_user_snapshot;
create policy "fin_sys_snapshot_select_own"
  on public.fin_sys_user_snapshot
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Permite INSERT apenas na própria linha
drop policy if exists "fin_sys_snapshot_insert_own" on public.fin_sys_user_snapshot;
create policy "fin_sys_snapshot_insert_own"
  on public.fin_sys_user_snapshot
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Permite UPDATE apenas na própria linha
drop policy if exists "fin_sys_snapshot_update_own" on public.fin_sys_user_snapshot;
create policy "fin_sys_snapshot_update_own"
  on public.fin_sys_user_snapshot
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
