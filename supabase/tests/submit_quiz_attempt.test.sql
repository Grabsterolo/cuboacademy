-- Prueba de regresión de QUIZ-001 — la nota no la puede fijar quien responde.
--
-- ⚠️  ESTA PRUEBA NO SE HA EJECUTADO NUNCA.
--
--     Se escribió durante la auditoría del 2026-09-25, pero no se pudo correr:
--     la única base disponible en esa sesión era **producción**, y esta prueba
--     crea usuarios, cursos e intentos de quiz. Aunque termina en ROLLBACK, no
--     se ejecuta nada de esto contra datos reales.
--
--     Córrela contra un stack local (`supabase start`) o una rama de base de
--     datos, nunca contra producción:
--
--         psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/submit_quiz_attempt.test.sql
--
--     Si pasa, imprime «TODAS LAS PRUEBAS PASARON». Cualquier fallo aborta con
--     el motivo. Todo ocurre dentro de una transacción que se revierte.
--
-- ── Qué protege ─────────────────────────────────────────────────────────────
--
-- `submit_quiz_attempt` calculaba el denominador de la nota recorriendo solo
-- las preguntas presentes en `p_responses`, que las manda el cliente. Enviar
-- menos preguntas reducía el denominador, así que quien mandaba únicamente las
-- que tenía acertadas sacaba 100 %.
--
-- La prueba 1 es la que importa: 1 acierto de 4 preguntas tiene que dar 25,
-- aunque solo se envíe esa una. Con el fallo daba 100.

begin;

do $$
declare
  v_instructor uuid := '11111111-1111-1111-1111-111111111111';
  v_student    uuid := '22222222-2222-2222-2222-222222222222';
  v_course     uuid;
  v_module     uuid;
  v_lesson     uuid;
  v_quiz       uuid;
  v_q1 uuid; v_q2 uuid; v_q3 uuid; v_q4 uuid;
  v_a1_ok uuid; v_a1_no uuid;
  v_a2_ok uuid;
  v_score numeric;
  v_passed boolean;
begin
  -- ── fixtures ──────────────────────────────────────────────────────────────
  insert into auth.users (id, email, instance_id, aud, role)
  values (v_instructor, 'instructor.test@example.invalid', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
         (v_student,    'student.test@example.invalid',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

  insert into public.profiles (id, full_name, role, email)
  values (v_instructor, 'Instructor de prueba', 'instructor', 'instructor.test@example.invalid'),
         (v_student,    'Estudiante de prueba', 'student',    'student.test@example.invalid');

  insert into public.courses (title, slug, instructor_id, status, type, price)
  values ('Curso de prueba', 'curso-de-prueba-' || gen_random_uuid(), v_instructor, 'published', 'course', 0)
  returning id into v_course;

  insert into public.modules (course_id, title, order_index)
  values (v_course, 'Módulo 1', 0) returning id into v_module;

  insert into public.lessons (module_id, title, order_index, type)
  values (v_module, 'Lección 1', 0, 'video') returning id into v_lesson;

  -- 4 preguntas de 1 punto: la nota tiene que salir sobre 4, no sobre lo enviado.
  insert into public.quizzes (lesson_id, title, passing_score, max_attempts)
  values (v_lesson, 'Quiz de prueba', 70, 10) returning id into v_quiz;

  insert into public.questions (quiz_id, text, type, order_index, points)
  values (v_quiz, 'P1', 'single', 0, 1) returning id into v_q1;
  insert into public.questions (quiz_id, text, type, order_index, points)
  values (v_quiz, 'P2', 'single', 1, 1) returning id into v_q2;
  insert into public.questions (quiz_id, text, type, order_index, points)
  values (v_quiz, 'P3', 'single', 2, 1) returning id into v_q3;
  insert into public.questions (quiz_id, text, type, order_index, points)
  values (v_quiz, 'P4', 'single', 3, 1) returning id into v_q4;

  insert into public.answers (question_id, text, is_correct, order_index)
  values (v_q1, 'correcta', true, 0) returning id into v_a1_ok;
  insert into public.answers (question_id, text, is_correct, order_index)
  values (v_q1, 'incorrecta', false, 1) returning id into v_a1_no;
  insert into public.answers (question_id, text, is_correct, order_index)
  values (v_q2, 'correcta', true, 0) returning id into v_a2_ok;
  insert into public.answers (question_id, text, is_correct, order_index)
  values (v_q3, 'correcta', true, 0);
  insert into public.answers (question_id, text, is_correct, order_index)
  values (v_q4, 'correcta', true, 0);

  insert into public.enrollments (student_id, course_id) values (v_student, v_course);

  -- A partir de aquí, quien llama es el estudiante.
  perform set_config('request.jwt.claims', json_build_object('sub', v_student, 'role', 'authenticated')::text, true);

  -- ── Prueba 1: el denominador lo fija el quiz, no quien responde ───────────
  select score, passed into v_score, v_passed
  from public.submit_quiz_attempt(v_quiz, json_build_array(
    json_build_object('question_id', v_q1, 'answer_id', v_a1_ok)
  )::jsonb);

  if v_score is distinct from 25.00 then
    raise exception 'FALLO 1: enviando solo 1 de 4 preguntas acertada la nota debía ser 25, y fue %. El denominador vuelve a depender del cliente.', v_score;
  end if;
  if v_passed is not false then
    raise exception 'FALLO 1b: con 25 %% y mínimo 70 %% el intento no debía aprobar, y passed = %', v_passed;
  end if;
  raise notice 'OK 1 — 1 acertada de 4 enviando solo esa: % %%, aprobado = %', v_score, v_passed;

  -- ── Prueba 2: contestar todo bien sí da 100 ──────────────────────────────
  select score, passed into v_score, v_passed
  from public.submit_quiz_attempt(v_quiz, json_build_array(
    json_build_object('question_id', v_q1, 'answer_id', v_a1_ok),
    json_build_object('question_id', v_q2, 'answer_id', v_a2_ok),
    json_build_object('question_id', v_q3, 'answer_id', (select id from public.answers where question_id = v_q3 limit 1)),
    json_build_object('question_id', v_q4, 'answer_id', (select id from public.answers where question_id = v_q4 limit 1))
  )::jsonb);

  if v_score is distinct from 100.00 or v_passed is not true then
    raise exception 'FALLO 2: contestando las 4 correctamente se esperaba 100 y aprobado, y fue % / %', v_score, v_passed;
  end if;
  raise notice 'OK 2 — las 4 acertadas: % %%, aprobado = %', v_score, v_passed;

  -- ── Prueba 3: media tabla acertada da 50 ─────────────────────────────────
  select score into v_score
  from public.submit_quiz_attempt(v_quiz, json_build_array(
    json_build_object('question_id', v_q1, 'answer_id', v_a1_ok),
    json_build_object('question_id', v_q2, 'answer_id', v_a2_ok),
    json_build_object('question_id', v_q3, 'answer_id', v_a1_no),
    json_build_object('question_id', v_q4, 'answer_id', v_a1_no)
  )::jsonb);

  if v_score is distinct from 50.00 then
    raise exception 'FALLO 3: 2 de 4 debía dar 50 y dio %', v_score;
  end if;
  raise notice 'OK 3 — 2 acertadas de 4: % %%', v_score;

  -- ── Prueba 4: el envío vacío da 0, no divide por cero ────────────────────
  select score into v_score
  from public.submit_quiz_attempt(v_quiz, '[]'::jsonb);

  if v_score is distinct from 0.00 then
    raise exception 'FALLO 4: un envío vacío debía dar 0 y dio %', v_score;
  end if;
  raise notice 'OK 4 — envío vacío: % %%', v_score;

  -- ── Prueba 5: quedan 4 filas de respuesta por intento ────────────────────
  -- Aunque se envíe una sola pregunta, el intento deja constancia de las
  -- cuatro: la nota sale de las preguntas del quiz, no del cuerpo recibido.
  if (select count(*) from public.quiz_responses r
      join public.quiz_attempts a on a.id = r.attempt_id
      where a.quiz_id = v_quiz) <> 16 then
    raise exception 'FALLO 5: se esperaban 16 respuestas (4 intentos × 4 preguntas) y hay %',
      (select count(*) from public.quiz_responses r join public.quiz_attempts a on a.id = r.attempt_id where a.quiz_id = v_quiz);
  end if;
  raise notice 'OK 5 — cada intento registra las 4 preguntas';

  -- ── Prueba 6: sin matrícula no se puede enviar ───────────────────────────
  delete from public.enrollments where student_id = v_student and course_id = v_course;
  begin
    perform public.submit_quiz_attempt(v_quiz, '[]'::jsonb);
    raise exception 'FALLO 6: sin matrícula el envío debía rechazarse y pasó';
  exception when others then
    if sqlerrm like 'FALLO 6%' then raise; end if;
    raise notice 'OK 6 — sin matrícula se rechaza: %', sqlerrm;
  end;

  raise notice '=== TODAS LAS PRUEBAS PASARON ===';
end;
$$;

rollback;
