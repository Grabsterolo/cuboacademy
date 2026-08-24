-- La ficha de un curso `unlisted` cargaba con el temario vacío. course_by_slug
-- entrega el curso a quien llega por el enlace, pero los módulos se leían de la
-- tabla `modules`, cuya RLS acaba consultando `courses` — y para un visitante no
-- matriculado la política de courses solo deja pasar «published AND public». El
-- curso aparecía y el contenido no. No era un agujero (privado seguía cerrado),
-- era media ficha.
--
-- Se resuelve con la misma forma que course_by_slug en vez de abrir la RLS de
-- modules: aflojar la tabla haría que los módulos de un curso unlisted fueran
-- enumerables por /rest/v1/modules, que es justo lo que «fuera de listados»
-- significa que no debe pasar. La regla de visibilidad no se copia: esta función
-- llama a course_by_slug, así que vive en un único sitio.
--
-- Devuelve solo lo que ya era público del temario — título, duración y orden.
-- Ni video_url ni description de la lección: eso sigue exigiendo matrícula.
-- Los módulos sin lecciones salen igual (LEFT JOIN, lesson_id nulo), como en el
-- acordeón actual.
create or replace function public.course_syllabus_by_slug(p_slug text)
returns table (
  module_id uuid,
  module_title text,
  module_order integer,
  lesson_id uuid,
  lesson_title text,
  lesson_duration_mins integer,
  lesson_order integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.id::uuid,
    m.title::text,
    m.order_index::integer,
    l.id::uuid,
    l.title::text,
    l.duration_mins::integer,
    l.order_index::integer
  from public.course_by_slug(p_slug) c
  join public.modules m on m.course_id = c.id
  left join public.lessons l on l.module_id = m.id
  order by m.order_index, l.order_index;
$$;

revoke execute on function public.course_syllabus_by_slug(text) from public;
grant execute on function public.course_syllabus_by_slug(text) to anon, authenticated;
