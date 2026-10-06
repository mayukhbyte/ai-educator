create table if not exists public.published_assessments (
  test_id text primary key,
  class_level integer not null check (class_level between 1 and 12),
  subject text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  test_data jsonb not null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists published_assessments_active_class_subject_idx
  on public.published_assessments (class_level, lower(subject), published_at desc)
  where status = 'active';

create table if not exists public.assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  test_id text not null references public.published_assessments(test_id),
  student_email text not null,
  student_name text not null,
  class_level integer not null check (class_level between 1 and 12),
  subject text not null,
  score numeric(7,2) not null,
  max_marks numeric(7,2) not null,
  percentage numeric(5,2) not null,
  time_taken_seconds integer not null check (time_taken_seconds >= 0),
  answers jsonb not null default '{}'::jsonb,
  result_data jsonb not null,
  teacher_feedback text not null default '',
  submitted_at timestamptz not null default now(),
  feedback_at timestamptz,
  unique (test_id, student_email)
);

create index if not exists assessment_submissions_student_idx
  on public.assessment_submissions (student_email, submitted_at desc);

create index if not exists assessment_submissions_test_idx
  on public.assessment_submissions (test_id, submitted_at desc);

alter table public.published_assessments enable row level security;
alter table public.assessment_submissions enable row level security;
grant all on public.published_assessments to service_role;
grant all on public.assessment_submissions to service_role;

drop policy if exists "Service role manages published assessments" on public.published_assessments;
create policy "Service role manages published assessments"
  on public.published_assessments for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Service role manages assessment submissions" on public.assessment_submissions;
create policy "Service role manages assessment submissions"
  on public.assessment_submissions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
