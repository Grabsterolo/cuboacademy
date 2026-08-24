-- Instructor visibility of their own students, public aggregate stats, and
-- review author names — without widening `read_profiles` for anon.
--
-- Before this migration `read_profiles` was:
--   (auth_user_role() = 'admin') OR (role = 'instructor') OR (auth.uid() = id)
-- which meant an instructor could not read the profile of a student enrolled
-- in their own course. That broke the attendance list and "Mis estudiantes"
-- (no name, no email), made every review render as "Estudiante", and left the
-- public hero's student counter at 0 because anon cannot count student rows.


-- 1 ──────────────────────────────────────────────────────────────────────────
-- Instructor → own students.
--
-- Walking enrollments -> courses from inside a policy on `profiles` would
-- recurse: both of those tables' policies call get_user_role()/auth_user_role(),
-- which read `profiles` again. SECURITY DEFINER with a pinned search_path runs
-- the lookup as the function owner, so the inner tables' RLS is not re-entered.
--
-- The function takes no instructor argument on purpose — it derives the
-- instructor from auth.uid(), so a caller cannot use it to probe arbitrary
-- (student, instructor) pairs. For anon, auth.uid() is null and it returns
-- false before touching anything.
create or replace function public.is_my_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and exists (
       select 1
       from enrollments e
       join courses c on c.id = e.course_id
       where e.student_id = p_student_id
         and c.instructor_id = auth.uid()
     );
$$;

-- anon needs EXECUTE even though it always gets false back: the grant is what
-- lets the policy expression below be *evaluated* at all. Revoking it makes
-- every anonymous read of `profiles` fail outright with
-- "permission denied for function is_my_student" (verified), which would take
-- the public instructor listings down with it. Do not tighten this to
-- `authenticated` only.
revoke execute on function public.is_my_student(uuid) from public;
grant execute on function public.is_my_student(uuid) to anon, authenticated;

drop policy if exists read_profiles on public.profiles;

create policy read_profiles on public.profiles
for select
using (
  auth_user_role() = 'admin'
  or role = 'instructor'
  or (select auth.uid()) = id
  or public.is_my_student(id)
);


-- 2 ──────────────────────────────────────────────────────────────────────────
-- Public hero counters. Returns aggregates only — never a row that could be
-- traced back to a person — so it is safe to expose to anon, which is the
-- whole point: anon must not be able to enumerate student profiles.
create or replace function public.public_platform_stats()
returns table (students bigint, instructors bigint, courses bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from profiles where role = 'student'    and is_active),
    (select count(*) from profiles where role = 'instructor' and is_active),
    (select count(*) from courses  where type = 'course'     and status = 'published');
$$;

revoke execute on function public.public_platform_stats() from public;
grant execute on function public.public_platform_stats() to anon, authenticated;


-- 3 ──────────────────────────────────────────────────────────────────────────
-- Review author names, scoped to reviews that are already publicly readable.
--
-- course_reviews has no status column of its own — a review is "published"
-- when its course is. The WHERE clause below mirrors the existing
-- "Resenas visibles segun visibilidad del curso" SELECT policy exactly, so
-- this exposes no review that was not already visible; it only adds the
-- author's display name and avatar to rows the caller could already read.
-- Only full_name and avatar_url are projected — never email, phone, or the
-- rest of the profile.
create or replace function public.public_course_reviews(p_course_id uuid)
returns table (
  id         uuid,
  rating     smallint,
  comment    text,
  created_at timestamptz,
  student_id uuid,
  full_name  text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.rating, r.comment, r.created_at, r.student_id,
         p.full_name, p.avatar_url
  from course_reviews r
  join courses c on c.id = r.course_id
  left join profiles p on p.id = r.student_id
  where r.course_id = p_course_id
    and (
      c.status = 'published'
      or c.instructor_id = auth.uid()
      or auth_user_role() = 'admin'
    )
  order by r.created_at desc;
$$;

revoke execute on function public.public_course_reviews(uuid) from public;
grant execute on function public.public_course_reviews(uuid) to anon, authenticated;
