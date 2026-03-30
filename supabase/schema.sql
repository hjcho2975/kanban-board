-- 팀 칸반 보드 스키마
-- Supabase SQL Editor에서 실행하세요.

-- 1. users 테이블 (auth.users를 확장)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null default '',
  role text not null default 'member' check (role in ('leader', 'member')),
  team_id uuid,
  created_at timestamptz not null default now()
);

-- 2. boards 테이블 (MVP: 팀당 1개)
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null,
  name text not null default '팀 보드',
  created_at timestamptz not null default now()
);

-- team_id를 users.team_id와 같게 맞춤
alter table public.users add constraint users_team_id_fkey
  foreign key (team_id) references public.boards(team_id);

-- 3. tasks 테이블
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assignee_id uuid references public.users(id) on delete set null,
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'inprogress', 'done')),
  board_id uuid not null references public.boards(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS (Row Level Security)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.boards enable row level security;
alter table public.tasks enable row level security;

-- users: 자기 자신 또는 같은 팀원만 조회
create policy "users: read own team"
  on public.users for select
  using (
    auth.uid() = id or
    team_id in (select team_id from public.users where id = auth.uid())
  );

create policy "users: update own"
  on public.users for update
  using (auth.uid() = id);

create policy "users: insert own"
  on public.users for insert
  with check (auth.uid() = id);

-- boards: 같은 팀만 조회
create policy "boards: read own team"
  on public.boards for select
  using (
    team_id in (select team_id from public.users where id = auth.uid())
  );

-- boards: leader만 생성
create policy "boards: leader insert"
  on public.boards for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'leader')
  );

-- tasks: 같은 팀 내 모두 조회
create policy "tasks: read own team"
  on public.tasks for select
  using (
    board_id in (
      select b.id from public.boards b
      join public.users u on u.team_id = b.team_id
      where u.id = auth.uid()
    )
  );

-- tasks: 로그인 사용자 모두 생성 가능
create policy "tasks: insert"
  on public.tasks for insert
  with check (
    board_id in (
      select b.id from public.boards b
      join public.users u on u.team_id = b.team_id
      where u.id = auth.uid()
    )
  );

-- tasks: assignee 본인 또는 leader만 수정
create policy "tasks: update assignee or leader"
  on public.tasks for update
  using (
    assignee_id = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role = 'leader')
  );

-- tasks: assignee 본인 또는 leader만 삭제
create policy "tasks: delete assignee or leader"
  on public.tasks for delete
  using (
    assignee_id = auth.uid() or
    exists (select 1 from public.users where id = auth.uid() and role = 'leader')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- Realtime 구독 활성화
-- ─────────────────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.tasks;
