-- Un evento cerrado de cliente («Certificación Empresarial Cubo Feedback»,
-- Grupo América, cupo 5) estaba en el catálogo abierto: exponía el nombre y la
-- sede del cliente y cualquiera podía solicitar inscripción. course_status no
-- distingue «publicado» de «visible para todo el mundo», así que la única forma
-- de ocultarlo era despublicarlo, y entonces los invitados tampoco entran.
create type public.course_visibility as enum ('public', 'unlisted', 'private');

alter table public.courses
  add column visibility public.course_visibility not null default 'public';

-- Los listados filtran por esta columna en cada carga de catálogo.
create index idx_courses_visibility on public.courses (visibility);

-- Matriculado en un curso, resuelto sin reentrar en RLS: la política de
-- enrollments consulta courses, así que llamarla desde una política de courses
-- sin SECURITY DEFINER recursaría. Deriva el estudiante de auth.uid() y no
-- acepta pasarlo como argumento, para que nadie pueda sondear a terceros.
create or replace function public.is_enrolled_in_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and exists (
       select 1 from enrollments e
       where e.course_id = p_course_id
         and e.student_id = auth.uid()
     );
$$;

-- anon necesita EXECUTE aunque siempre reciba false: el GRANT es lo que permite
-- que la expresión de la política se evalúe. Sin él, toda lectura anónima de
-- courses falla con «permission denied for function».
revoke execute on function public.is_enrolled_in_course(uuid) from public;
grant execute on function public.is_enrolled_in_course(uuid) to anon, authenticated;

-- Lectura de la tabla: para un desconocido, solo publicado Y público. Ni
-- «unlisted» ni «private» salen por /rest/v1/courses, así que no son
-- enumerables. Quien ya tiene relación con el curso (admin, instructor
-- asignado, matriculado) lo sigue viendo — sin esto, un curso unlisted o
-- privado aparecería en blanco dentro de «Mis cursos», certificados y órdenes,
-- porque esos joins también pasan por esta política.
drop policy if exists "Cursos publicados visibles a todos" on public.courses;

create policy "Cursos publicados visibles a todos"
on public.courses
for select
using (
  get_user_role() = 'admin'
  or instructor_id = (select auth.uid())
  or public.is_enrolled_in_course(id)
  or (status = 'published' and visibility = 'public')
);

-- La puerta del enlace directo. «unlisted» significa accesible por URL pero
-- fuera de listados; como una política RLS no puede distinguir una consulta por
-- slug de un listado, esa diferencia se expresa aquí: la tabla no entrega
-- unlisted, esta función sí. «private» sigue reservado a admin, instructor y
-- matriculados incluso conociendo el slug.
create or replace function public.course_by_slug(p_slug text)
returns setof public.courses
language sql
stable
security definer
set search_path = public
as $$
  select c.*
  from public.courses c
  where c.slug = p_slug
    and (
      get_user_role() = 'admin'
      or c.instructor_id = auth.uid()
      or public.is_enrolled_in_course(c.id)
      or (c.status = 'published' and c.visibility in ('public', 'unlisted'))
    );
$$;

revoke execute on function public.course_by_slug(text) from public;
grant execute on function public.course_by_slug(text) to anon, authenticated;
