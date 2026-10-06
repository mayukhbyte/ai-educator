begin;

insert into public.student_roster (
  auth_user_id,
  student_id,
  full_name,
  email,
  class_level,
  section,
  created_at
)
select
  users.id,
  'STU-' || upper(replace(users.id::text, '-', '')),
  coalesce(nullif(users.raw_user_meta_data ->> 'name', ''), split_part(users.email, '@', 1)),
  lower(users.email),
  case
    when coalesce(users.raw_user_meta_data ->> 'classLevel', '') ~ '^[0-9]{1,2}$'
      then case
        when (users.raw_user_meta_data ->> 'classLevel')::integer between 1 and 12
          then (users.raw_user_meta_data ->> 'classLevel')::integer
        else 10
      end
    else 10
  end,
  coalesce(nullif(users.raw_user_meta_data ->> 'section', ''), 'Section A'),
  users.created_at
from auth.users as users
where lower(coalesce(users.raw_user_meta_data ->> 'role', '')) = 'student'
  and users.email is not null
on conflict do nothing;

commit;
