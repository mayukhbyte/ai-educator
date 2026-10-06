create table if not exists public.student_roster (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  student_id text not null unique,
  full_name text not null,
  email text not null unique,
  class_level integer not null check (class_level between 1 and 12),
  section text not null default 'Section A',
  status text not null default 'active' check (status in ('active', 'removed')),
  teacher_remark text not null default '',
  removal_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists student_roster_class_status_name_idx
  on public.student_roster (class_level, status, full_name);

alter table public.student_roster enable row level security;

grant all on table public.student_roster to service_role;
