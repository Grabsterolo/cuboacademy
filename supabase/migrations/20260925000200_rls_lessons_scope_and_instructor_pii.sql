-- RLS-001 (HIGH) — cualquier instructor podía leer las lecciones de todos.
-- RLS-002 (HIGH) — el correo y el teléfono de los instructores eran públicos.

-- ── RLS-001 ──────────────────────────────────────────────────────────────────
-- La política SELECT de `lessons` era:
--
--     (is_free_preview = true)
--     OR (get_user_role() = ANY (ARRAY['admin','instructor']))
--     OR (está matriculado)
--
-- Esa cláusula del medio no acota por propiedad: le daba a CUALQUIER instructor
-- el contenido completo de las lecciones de CUALQUIER curso, incluidos
-- `video_url` y `description` de los cursos de pago de otros instructores.
-- Acceso horizontal entre cuentas del mismo rol.
--
-- Y era redundante para lo que sí hace falta: la política ALL «Instructor
-- gestiona lecciones de sus cursos» ya resuelve SELECT para el instructor en
-- sus propios cursos y para el admin en todos —
--
--     EXISTS (modules m JOIN courses c ON c.id = m.course_id
--             WHERE m.id = lessons.module_id
--               AND (c.instructor_id = auth.uid() OR get_user_role() = 'admin'))
--
-- así que quitarla no cierra ningún camino legítimo, solo el ajeno. Las
-- políticas permisivas se combinan con OR, de modo que admin y propietario
-- siguen entrando por la política ALL.
--
-- Comprobado antes de tocar nada: todas las lecturas de `lessons` en src/ son
-- del curso propio (asistente, evaluaciones), del admin (revisión), del
-- estudiante matriculado (reproductor, progreso) o del temario público vía
-- `course_syllabus_by_slug`, que es SECURITY DEFINER y no depende de esta
-- política. Ninguna necesita leer lecciones de otro instructor.

drop policy if exists read_lessons_public_or_enrolled on public.lessons;

create policy read_lessons_public_or_enrolled on public.lessons
for select
using (
  is_free_preview = true
  or exists (
    select 1
    from public.enrollments e
    join public.modules m on m.id = lessons.module_id
    where e.student_id = auth.uid()
      and e.course_id = m.course_id
  )
);

-- ── RLS-002 ──────────────────────────────────────────────────────────────────
-- `read_profiles` incluye `role = 'instructor'`, que entrega la FILA COMPLETA
-- de cada instructor a cualquier visitante anónimo — con `email` y `phone`.
-- Verificado: el rol `anon` leía los correos de los instructores.
--
-- La cláusula tiene que quedarse: el sitio público necesita nombre, avatar,
-- bio, profesión y especialidad para el bloque «Nuestro equipo» y para los
-- joins `profiles!instructor_id(...)` de la portada y los dos catálogos. Lo que
-- sobra no son las filas, son dos columnas.
--
-- Así que se acota por columna, la misma técnica que este proyecto ya usa para
-- `answers.is_correct` (que no tiene SELECT para anon ni authenticated). Se le
-- retira a `anon` el SELECT sobre `email` y `phone` y se le devuelve sobre el
-- resto.
--
-- A `authenticated` no se le toca: el panel de administración lista correos en
-- Usuarios, Órdenes y Asistencia, y los privilegios por columna son por rol,
-- no por política — revocárselo a `authenticated` rompería esas pantallas,
-- porque un admin también es `authenticated`. Queda anotado en AUDIT.md que un
-- estudiante con sesión todavía puede leer el correo de un instructor; es un
-- problema bastante menor que el anónimo y necesita otro mecanismo.
--
-- Comprobado antes de tocar nada: ninguna pantalla pública pide `email` ni
-- `phone` de `profiles`. Piden `full_name`, `avatar_url`, `bio`, `profession`,
-- `specialty`.
--
-- Y comprobada la vía de escape: existe `public.users_view`, que hace SELECT
-- sobre `profiles` **incluyendo email**, y `anon` tiene SELECT sobre ella. Una
-- vista normal se evalúa con los permisos de su dueño (`postgres`), lo que
-- habría dejado este revoke en nada. No es el caso: `users_view` está creada con
-- `security_invoker=on`, así que se evalúa con los permisos y la RLS de quien
-- consulta — el revoke la alcanza igual.
--
-- `users_view` se queda: la usan Usuarios del panel (necesita el correo) y los
-- dos asistentes (solo `id, full_name`), las tres como `authenticated`, a quien
-- no se le retira nada aquí.

revoke select on public.profiles from anon;

grant select (
  id, full_name, avatar_url, role, bio, created_at, updated_at, is_active,
  last_name, country, profession, specialty, years_experience,
  current_company, linkedin_url, website_url, twitter_url, interests
) on public.profiles to anon;
