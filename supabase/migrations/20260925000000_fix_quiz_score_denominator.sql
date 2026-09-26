-- QUIZ-001 (CRITICAL) — la nota de un quiz se podía inflar hasta el 100 %.
--
-- `submit_quiz_attempt` calculaba el denominador recorriendo únicamente las
-- preguntas presentes en `p_responses`:
--
--     select array_agg(distinct (item->>'question_id')::uuid) into v_qids
--     from jsonb_array_elements(p_responses) item;
--
--     for v_q in select ... from questions qq
--                where qq.id = any(v_qids) and qq.quiz_id = p_quiz_id
--
-- `p_responses` lo manda el cliente. Enviar menos preguntas reducía el
-- denominador, así que quien enviara solo las que tenía acertadas sacaba 100 %.
--
-- No era teórico: la política de `quiz_responses` deja al estudiante leer sus
-- propias respuestas con `points_earned`, así que el camino completo era
--
--   1. intento 1: contestar todo y leer qué preguntas puntuaron,
--   2. intento 2: enviar solo esas → 100 % y `passed = true`.
--
-- Y `passed` no se queda en la nota: el trigger `auto_submit_exam_on_quiz_pass`
-- crea la solicitud de examen en cuanto se aprueba el quiz de la «Evaluación
-- Final», que es la puerta al certificado. La interfaz no protegía nada aquí —
-- exige contestar todo (`allAnswered` en LessonQuiz.jsx), pero el RPC es
-- público y cualquier estudiante puede llamarlo con el cuerpo que quiera.
--
-- Arreglo: el denominador lo fija el quiz, no quien responde. Se recorren
-- TODAS las preguntas del quiz; las que no lleguen en `p_responses` puntúan 0,
-- que es exactamente lo que significa dejar una en blanco.
--
-- Efecto secundario deseable: una pregunta de otro quiz colada en el cuerpo
-- deja de tener cualquier efecto, porque el recorrido ya no parte de lo enviado.

create or replace function public.submit_quiz_attempt(p_quiz_id uuid, p_responses jsonb)
returns table(attempt_id uuid, score numeric, passed boolean, status text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_student_id uuid := auth.uid();
  v_enrolled boolean;
  v_attempt_count int;
  v_max_attempts int;
  v_passing_score int;
  v_attempt_id uuid;
  v_total_points numeric := 0;
  v_earned_points numeric := 0;
  v_has_open boolean := false;
  v_score numeric;
  v_passed boolean;
  v_status text;
  v_q record;
begin
  if v_student_id is null then
    raise exception 'No autenticado';
  end if;

  select exists (
    select 1 from quizzes q
    join lessons l on l.id = q.lesson_id
    join modules m on m.id = l.module_id
    join enrollments e on e.course_id = m.course_id
    where q.id = p_quiz_id and e.student_id = v_student_id
  ) into v_enrolled;

  if not v_enrolled then
    raise exception 'No tienes acceso a este quiz';
  end if;

  select max_attempts, passing_score into v_max_attempts, v_passing_score
  from quizzes where id = p_quiz_id;

  select count(*) into v_attempt_count from quiz_attempts
  where quiz_id = p_quiz_id and student_id = v_student_id;

  if v_attempt_count >= v_max_attempts then
    raise exception 'Has alcanzado el número máximo de intentos';
  end if;

  insert into quiz_attempts (student_id, quiz_id, started_at, status)
  values (v_student_id, p_quiz_id, now(), 'graded')
  returning id into v_attempt_id;

  -- Todas las preguntas del quiz, no solo las que vinieron en p_responses:
  -- el denominador lo define el quiz.
  for v_q in
    select qq.id, qq.type, qq.points
    from questions qq
    where qq.quiz_id = p_quiz_id
    order by qq.order_index
  loop
    v_total_points := v_total_points + v_q.points;

    if v_q.type in ('single', 'true_false') then
      declare
        v_answer_id uuid;
        v_is_correct boolean;
        v_points_earned numeric;
      begin
        select nullif(item->>'answer_id','')::uuid into v_answer_id
        from jsonb_array_elements(p_responses) item
        where (item->>'question_id')::uuid = v_q.id
        limit 1;

        v_is_correct := false;
        if v_answer_id is not null then
          select is_correct into v_is_correct from answers
          where id = v_answer_id and question_id = v_q.id;
        end if;

        v_points_earned := case when v_is_correct then v_q.points else 0 end;
        v_earned_points := v_earned_points + v_points_earned;

        insert into quiz_responses (attempt_id, question_id, answer_id, points_earned)
        values (v_attempt_id, v_q.id, v_answer_id, v_points_earned);
      end;

    elsif v_q.type = 'multiple' then
      declare
        v_selected uuid[];
        v_correct uuid[];
        v_points_earned numeric;
      begin
        select array_agg(distinct nullif(item->>'answer_id','')::uuid) into v_selected
        from jsonb_array_elements(p_responses) item
        where (item->>'question_id')::uuid = v_q.id and item ? 'answer_id';

        select array_agg(id order by id) into v_correct
        from answers where question_id = v_q.id and is_correct = true;

        v_points_earned := case
          when v_selected is not null
           and (select array_agg(x order by x) from unnest(v_selected) x) = v_correct
          then v_q.points else 0
        end;
        v_earned_points := v_earned_points + v_points_earned;

        insert into quiz_responses (attempt_id, question_id, selected_answer_ids, points_earned)
        values (v_attempt_id, v_q.id, v_selected, v_points_earned);
      end;

    elsif v_q.type = 'open' then
      declare
        v_open_response text;
      begin
        select item->>'open_response' into v_open_response
        from jsonb_array_elements(p_responses) item
        where (item->>'question_id')::uuid = v_q.id
        limit 1;

        -- Una abierta sin contestar también va a revisión: deja constancia de
        -- la pregunta en blanco para que el instructor la califique (0), en vez
        -- de desaparecer del intento como si no existiera.
        v_has_open := true;
        insert into quiz_responses (attempt_id, question_id, open_response, points_earned)
        values (v_attempt_id, v_q.id, v_open_response, null);
      end;
    end if;
  end loop;

  if v_has_open then
    v_status := 'pending_review';
    v_score := null;
    v_passed := null;
    update quiz_attempts set status = v_status where id = v_attempt_id;
  else
    v_score := case when v_total_points > 0 then round((v_earned_points / v_total_points) * 100, 2) else 0 end;
    v_passed := v_score >= v_passing_score;
    v_status := 'graded';
    update quiz_attempts set score = v_score, passed = v_passed, completed_at = now(), status = v_status
    where id = v_attempt_id;
  end if;

  return query select v_attempt_id, v_score, v_passed, v_status;
end;
$function$;
