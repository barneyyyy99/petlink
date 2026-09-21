-- PetLink 云端同步 + 家庭共享 表结构（在 Supabase SQL Editor 执行）
-- 本脚本可重复执行（幂等）：所有策略先 drop if exists 再 create，发布订阅用 DO 块判断。

-- ============================================================================
-- 1) app_state：每个 owner 一行 JSON 快照
-- ============================================================================
create table if not exists public.app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.app_state enable row level security;

-- ============================================================================
-- 2) home_members：成员 → owner 家庭的加入关系（家庭共享）
-- ============================================================================
create table if not exists public.home_members (
  owner_id uuid not null references auth.users (id) on delete cascade,
  member_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id)
);
alter table public.home_members enable row level security;

drop policy if exists "read own memberships" on public.home_members;
create policy "read own memberships"
  on public.home_members for select
  using (auth.uid() = member_id or auth.uid() = owner_id);

drop policy if exists "join a home" on public.home_members;
create policy "join a home"
  on public.home_members for insert
  with check (auth.uid() = member_id);

drop policy if exists "leave a home" on public.home_members;
create policy "leave a home"
  on public.home_members for delete
  using (auth.uid() = member_id);

-- ============================================================================
-- 3) app_state 行级安全：owner 或其家庭成员可读/写；仅 owner 可插入自己的行
-- ============================================================================
drop policy if exists "read own app_state" on public.app_state;
create policy "read own app_state"
  on public.app_state for select
  using (
    auth.uid() = user_id
    or exists (select 1 from public.home_members m where m.owner_id = app_state.user_id and m.member_id = auth.uid())
  );

drop policy if exists "insert own app_state" on public.app_state;
create policy "insert own app_state"
  on public.app_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own app_state" on public.app_state;
create policy "update own app_state"
  on public.app_state for update
  using (
    auth.uid() = user_id
    or exists (select 1 from public.home_members m where m.owner_id = app_state.user_id and m.member_id = auth.uid())
  )
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.home_members m where m.owner_id = app_state.user_id and m.member_id = auth.uid())
  );

-- ============================================================================
-- 4) 实时发布（跨设备/成员同步）——幂等：已在发布中则跳过
-- ============================================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'home_members'
  ) then
    alter publication supabase_realtime add table public.home_members;
  end if;
end $$;
