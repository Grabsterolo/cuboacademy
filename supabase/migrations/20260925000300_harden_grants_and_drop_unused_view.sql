-- SEC-LOW-001 (LOW) — funciones de trigger expuestas como endpoints RPC.
-- DB-001 (MEDIUM) — vista `lessons_syllabus_preview` sin uso y marcada ERROR.

-- ── SEC-LOW-001 ──────────────────────────────────────────────────────────────
-- 14 funciones de trigger eran ejecutables por `anon` en /rest/v1/rpc/… No son
-- explotables —Postgres rechaza llamar una función de trigger fuera de un
-- trigger— pero no tienen por qué estar en la superficie pública, y cada una es
-- una entrada que el linter de Supabase seguirá señalando.
--
-- Esto no introduce una convención nueva: 10 de las 24 funciones de trigger ya
-- estaban revocadas (las creadas más recientemente). Esta migración termina el
-- trabajo y lo deja hecho de una forma que no hay que mantener a mano: recorre
-- las funciones de `public` que devuelven `trigger`, sean las que sean.
--
-- Importante lo que NO toca: los ayudantes que usan las políticas RLS
-- (`auth_user_role`, `get_user_role`, `is_my_student`, `is_enrolled_in_course`,
-- `event_seats_taken`, `*_admin_or_owner`). Esos SÍ los tiene que poder ejecutar
-- `authenticated`: se evalúan dentro de las políticas con los permisos de quien
-- consulta, así que revocarlos rompería la RLS de media base.

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prorettype = 'pg_catalog.trigger'::regtype
  loop
    execute format('revoke all on function %s from anon, authenticated', fn.sig);
  end loop;
end;
$$;

-- ── DB-001 ───────────────────────────────────────────────────────────────────
-- `lessons_syllabus_preview` quedó huérfana cuando las dos fichas de curso
-- pasaron a sacar el temario de `course_syllabus_by_slug`. Ya nada en `src/` la
-- consulta (solo se la menciona en un comentario de `courseSyllabus.js`, que
-- explica por qué se dejó de usar) y `pg_depend` no le encuentra dependientes.
--
-- Además es el único ERROR del linter de seguridad: está creada con
-- `security_invoker=false`, así que se evalúa como `postgres` y salta la RLS de
-- `lessons`, `modules` y `courses`. Filtra por `status = 'published'` pero no por
-- `visibility`, de modo que entregaba los títulos y duraciones de las lecciones
-- de cursos `unlisted` y `private` publicados, que es justo lo que la
-- visibilidad pretende no dar.
--
-- Se elimina en vez de arreglarse: la función que la sustituyó ya aplica la
-- regla de visibilidad correcta.

drop view if exists public.lessons_syllabus_preview;
