-- =============================================
-- 成长征途 · Supabase 数据库 Schema
-- 在 Supabase SQL Editor 中执行此文件
-- =============================================

-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- ============ users 表 ============
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  username text not null default '勇士',
  balance numeric(10,2) default 0,
  focus_sequence int default 0,
  streak_days int default 0,
  last_sign_date date,
  last_monthly_bonus text, -- 'YYYY-MM' 格式
  today_status text check (today_status in ('good','normal','poor')),
  today_status_date date,
  language_config jsonb default '{"languages":["英语"],"abilities":["听力","阅读","写作","口语"]}',
  lane_tags jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============ lanes 表（六条分路段位数据）============
create table if not exists lanes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lane_id text not null, -- 'research','study','language','fitness','work','life'
  total_stars int default 0,
  tier text default 'bronze',
  level int default 3,
  stars_in_div int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lane_id)
);

-- ============ tags 表（领域标签熟练度）============
create table if not exists tags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lane_id text not null,
  tag_name text not null,
  points int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, lane_id, tag_name)
);

-- ============ tasks 表 ============
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  level text check (level in ('large','medium','small')) not null,
  lane_id text not null,
  difficulty text check (difficulty in ('easy','medium','hard')) default 'medium',
  parent_id uuid references tasks(id) on delete set null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- ============ focus_blocks 表 ============
create table if not exists focus_blocks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  lane_id text not null,
  tag text not null,
  difficulty text check (difficulty in ('easy','medium','hard')) default 'medium',
  duration_min int default 60,
  reward numeric(8,2) default 0,
  completed boolean default false,
  created_at timestamptz default now()
);

-- ============ policies 表（国策）============
create table if not exists policies (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  description text,
  group_id uuid,
  checked_dates date[] default '{}',
  created_at timestamptz default now()
);

-- ============ policy_groups 表 ============
create table if not exists policy_groups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  tolerance int default 0, -- 容错数量
  created_at timestamptz default now()
);

-- ============ daily_logs 表 ============
create table if not exists daily_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  status text check (status in ('good','normal','poor')),
  signed_in boolean default false,
  sign_time timestamptz,
  focus_blocks_count int default 0,
  earned numeric(8,2) default 0,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- ============ transactions 表（额度收支）============
create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  description text not null,
  amount numeric(8,2) not null, -- 正为收入，负为支出
  type text, -- '专注块','任务','段位','签到','国策','消费','系统'
  balance_snapshot numeric(10,2), -- 操作后余额快照
  category text, -- 消费分类
  note text,
  created_at timestamptz default now()
);

-- ============ season_records 表 ============
create table if not exists season_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  year int not null,
  quarter int not null, -- 1-4
  lanes_snapshot jsonb, -- 各分路最终段位
  focus_blocks_count int default 0,
  total_earned numeric(10,2) default 0,
  total_spent numeric(10,2) default 0,
  policy_days int default 0,
  summary_text text,
  created_at timestamptz default now(),
  unique(user_id, year, quarter)
);

-- ============ year_records 表 ============
create table if not exists year_records (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade,
  year int not null,
  seasons_data jsonb, -- 四个赛季数据
  total_focus_blocks int default 0,
  total_earned numeric(10,2) default 0,
  total_spent numeric(10,2) default 0,
  best_season int,
  worst_season int,
  summary_text text,
  created_at timestamptz default now(),
  unique(user_id, year)
);

-- ============ Row Level Security ============
alter table users enable row level security;
alter table lanes enable row level security;
alter table tags enable row level security;
alter table tasks enable row level security;
alter table focus_blocks enable row level security;
alter table policies enable row level security;
alter table policy_groups enable row level security;
alter table daily_logs enable row level security;
alter table transactions enable row level security;
alter table season_records enable row level security;
alter table year_records enable row level security;

-- 基础 RLS 策略（用户只能访问自己的数据）
-- 注意：若使用匿名访问或自定义认证，可根据需要调整

-- 允许所有操作（开发模式，正式部署建议改为基于 auth.uid() 的策略）
create policy "allow_all" on users for all using (true);
create policy "allow_all" on lanes for all using (true);
create policy "allow_all" on tags for all using (true);
create policy "allow_all" on tasks for all using (true);
create policy "allow_all" on focus_blocks for all using (true);
create policy "allow_all" on policies for all using (true);
create policy "allow_all" on policy_groups for all using (true);
create policy "allow_all" on daily_logs for all using (true);
create policy "allow_all" on transactions for all using (true);
create policy "allow_all" on season_records for all using (true);
create policy "allow_all" on year_records for all using (true);
