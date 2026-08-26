-- «Eventos programados» para la franja de datos de la portada.
--
-- Se cuentan solo los que de verdad están por venir: publicados, públicos, con
-- fecha futura y sin cancelar. Un contador que incluyera eventos pasados o
-- cancelados sería otra cifra que no significa lo que dice, que es justo lo que
-- se está quitando de esa pantalla.
create or replace function public.public_platform_stats()
returns table (students integer, instructors integer, courses integer, events integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int from profiles where role = 'student'    and is_active),
    (select count(*)::int from profiles where role = 'instructor' and is_active),
    (select count(*)::int from courses  where type = 'course'     and status = 'published'),
    (select count(*)::int from courses
       where type = 'event'
         and status = 'published'
         and visibility = 'public'
         and cancelled_at is null
         and event_start_at >= now());
$$;

revoke all on function public.public_platform_stats() from public;
grant execute on function public.public_platform_stats() to anon, authenticated;
