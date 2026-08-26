-- Cupo de eventos: hasta ahora `courses.capacity` era texto decorativo. Nadie
-- contaba inscripciones contra él, así que un evento de 5 plazas aceptaba
-- solicitudes sin límite. Y no había forma de cancelar un evento.

-- ── 1. Estado «cancelado» ────────────────────────────────────────────────────
--
-- Va como columna y no como valor nuevo de course_status a propósito. Con un
-- enum, `status = 'cancelled'` sacaría el evento de todas las consultas que
-- filtran por 'published' — incluidas las del portal del estudiante, es decir,
-- justo las de quienes compraron y son los que tienen que ver el aviso. Un
-- evento cancelado sigue estando publicado: lo que cambia es que ya no se
-- puede comprar y que lleva una advertencia encima.
alter table public.courses
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancellation_reason text;

comment on column public.courses.cancelled_at is
  'Evento cancelado. Sigue visible para los matriculados, con aviso; deja de admitir inscripciones y desaparece del catálogo.';

-- ── 2. Plazas ocupadas ───────────────────────────────────────────────────────
--
-- Se cuentan estudiantes DISTINTOS entre matrículas y órdenes pendientes. Una
-- orden pendiente reserva plaza: si no lo hiciera, cinco personas podrían
-- solicitar a la vez un evento de cinco plazas, pagar, y descubrir después que
-- solo caben algunas.
--
-- Distinct importa porque al confirmar un pago se crea la matrícula y la orden
-- queda 'completed': durante ese paso la misma persona aparece en las dos
-- tablas, y contarla dos veces dejaría el evento lleno antes de tiempo.
create or replace function public.event_seats_taken(p_course_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from (
    select student_id from public.enrollments where course_id = p_course_id
    union
    select student_id from public.orders
      where course_id = p_course_id and status = 'pending'
  ) s;
$$;

revoke all on function public.event_seats_taken(uuid) from public;
grant execute on function public.event_seats_taken(uuid) to anon, authenticated;

-- Versión por lotes para el catálogo y las tarjetas: una consulta en vez de
-- una por evento. Devuelve solo el recuento, nunca quién ocupa las plazas.
create or replace function public.event_seats(p_course_ids uuid[])
returns table (course_id uuid, capacity integer, taken integer, remaining integer, is_full boolean)
language sql
stable
security definer
set search_path = public
as $$
  select c.id,
         c.capacity,
         public.event_seats_taken(c.id) as taken,
         case when c.capacity is null then null
              else greatest(c.capacity - public.event_seats_taken(c.id), 0) end as remaining,
         case when c.capacity is null then false
              else public.event_seats_taken(c.id) >= c.capacity end as is_full
  from public.courses c
  where c.id = any(p_course_ids) and c.type = 'event';
$$;

revoke all on function public.event_seats(uuid[]) from public;
grant execute on function public.event_seats(uuid[]) to anon, authenticated;

-- ── 3. Guardarraíl de servidor ───────────────────────────────────────────────
--
-- La comprobación del navegador es una cortesía: evita que alguien pulse un
-- botón inútil. Esta es la que manda, porque la API REST está abierta y
-- cualquiera con el token anónimo puede insertar directamente en `orders`.
create or replace function public.enforce_event_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ev            record;
  seats_taken   int;
  already_holds boolean;
begin
  select c.type, c.capacity, c.cancelled_at, c.title
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

  -- Sin cupo definido, el aforo es abierto: no es un error, es un evento sin
  -- límite declarado.
  if ev.capacity is null then
    return new;
  end if;

  -- Si esta persona ya ocupa plaza (por ejemplo, su orden pendiente pasa a
  -- matrícula al confirmarse el pago), no consume una nueva.
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
$$;

drop trigger if exists trg_enrollments_event_capacity on public.enrollments;
create trigger trg_enrollments_event_capacity
  before insert on public.enrollments
  for each row execute function public.enforce_event_capacity();

drop trigger if exists trg_orders_event_capacity on public.orders;
create trigger trg_orders_event_capacity
  before insert on public.orders
  for each row execute function public.enforce_event_capacity();
