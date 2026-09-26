-- EVENT-001 (HIGH) — un evento finalizado seguía aceptando inscripciones.
-- EVENT-002 (MEDIUM) — el cupo se podía superar con dos inscripciones a la vez.
--
-- ── EVENT-001 ────────────────────────────────────────────────────────────────
-- `enrollmentBlock()` (src/lib/eventStatus.js) devuelve 'past' y la interfaz no
-- pinta el botón. Su propio comentario dice: «la comprobación que manda vive en
-- el trigger enforce_event_capacity, porque la API REST está abierta». Pero el
-- trigger solo miraba `cancelled_at` y el cupo — la fecha, no. Así que la regla
-- existía únicamente en React.
--
-- No es hipotético: «I Certificación Cubo Feedback» terminó el 2026-07-23 y
-- sigue `published` y `public`. Hoy mismo un POST a /rest/v1/enrollments la
-- acepta.
--
-- Quién sí puede: el admin. Inscribir a mano a quien asistió fuera de la
-- plataforma es un caso legítimo y deliberado (commit a79d91e, botón
-- «Inscribir manualmente»), y ocurre necesariamente después del evento.
-- También confirmar una orden que se pagó tarde. El patrón de `auth.uid() is
-- null` se copia de `prevent_role_escalation`: en contexto de servicio
-- (service key, edge function) no hay usuario y no se bloquea.
--
-- ── EVENT-002 ────────────────────────────────────────────────────────────────
-- El trigger leía `event_seats_taken()` y comparaba, sin bloqueo. Dos
-- transacciones concurrentes leían el mismo recuento, las dos lo veían por
-- debajo del cupo y las dos insertaban: cupo 12 con 13 inscritos. La ventana es
-- de milisegundos, pero un evento que se agota es justo cuando varias personas
-- pulsan a la vez.
--
-- `pg_advisory_xact_lock` serializa por evento (no por tabla): las
-- inscripciones a eventos distintos no se estorban, y el bloqueo se suelta al
-- cerrar la transacción. Se toma antes de contar y solo cuando hay cupo que
-- vigilar, para no pagarlo en los eventos sin límite ni en los cursos.

create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  ev            record;
  seats_taken   int;
  already_holds boolean;
  v_ended_at    timestamptz;
begin
  select c.type, c.capacity, c.cancelled_at, c.title, c.event_start_at, c.event_end_at
    into ev
    from public.courses c
   where c.id = new.course_id;

  if not found or ev.type <> 'event' then
    return new;
  end if;

  if ev.cancelled_at is not null then
    raise exception 'Este evento fue cancelado y ya no admite inscripciones.'
      using errcode = 'check_violation';
  end if;

  -- EVENT-001: un evento que ya terminó no admite inscripciones nuevas, salvo
  -- que las haga un admin (inscripción manual de quien asistió, confirmación de
  -- un pago tardío) o el propio servidor.
  v_ended_at := coalesce(ev.event_end_at, ev.event_start_at);
  if v_ended_at is not null
     and v_ended_at < now()
     and auth.uid() is not null
     and public.auth_user_role() <> 'admin' then
    raise exception 'El evento «%» ya finalizó y no admite inscripciones.', ev.title
      using errcode = 'check_violation';
  end if;

  if ev.capacity is null then
    return new;
  end if;

  -- EVENT-002: serializa el contar-y-decidir por evento. Sin esto, dos
  -- inscripciones simultáneas leen el mismo recuento y ambas pasan.
  perform pg_advisory_xact_lock(hashtextextended(new.course_id::text, 0));

  select exists (
    select 1 from public.enrollments
      where course_id = new.course_id and student_id = new.student_id
    union all
    select 1 from public.orders
      where course_id = new.course_id and student_id = new.student_id and status = 'pending'
  ) into already_holds;

  if already_holds then
    return new;
  end if;

  seats_taken := public.event_seats_taken(new.course_id);

  if seats_taken >= ev.capacity then
    raise exception 'El evento «%» ya no tiene cupos disponibles.', ev.title
      using errcode = 'check_violation';
  end if;

  return new;
end;
$function$;
