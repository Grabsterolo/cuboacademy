# Registro de cambios — auditoría del 2026-09-25

Commiteado en la rama `auditoria/2026-09-25` (11 commits, uno por hallazgo).
Las 7 migraciones están **aplicadas y verificadas en producción** el 2026-09-26:
ver «Aplicación y verificación» al final. El frontend está corregido en la rama
pero **aún no desplegado**.

Comprobaciones tras cada grupo de cambios: `npm run lint` (0 avisos, antes 8) y
`npm run build` (pasa). No hay `typecheck` ni `test` en este proyecto.

---

## Base de datos — migraciones aplicadas

### `20260925000000_fix_quiz_score_denominator.sql` — QUIZ-001, CRITICAL

**Archivo:** función `submit_quiz_attempt`

**Qué pasaba.** El denominador de la nota se calculaba recorriendo solo las
preguntas que venían en `p_responses`, que las manda el cliente. Enviar menos
preguntas reducía el denominador: quien mandaba únicamente las que tenía
acertadas sacaba 100 %.

**Por qué importaba.** No hacía falta adivinar nada. La política de
`quiz_responses` deja al estudiante leer sus propias respuestas con
`points_earned`, así que el camino era: intento 1 contestando todo, mirar qué
preguntas puntuaron, intento 2 enviando solo esas → 100 % y `passed = true`. Y
`passed` dispara `auto_submit_exam_on_quiz_pass`, que mete la solicitud de
examen en la cola del instructor, que es la puerta al certificado. La interfaz
no protegía nada: exige contestar todo, pero el RPC es público y acepta el
cuerpo que se le mande.

**Qué se hizo.** El recorrido parte ahora de las preguntas del quiz
(`where qq.quiz_id = p_quiz_id`), no de lo enviado. Una pregunta que no llega
puntúa 0, que es lo que significa dejarla en blanco. De paso, una pregunta de
otro quiz colada en el cuerpo deja de tener efecto.

**Impacto.** Ninguno para quien responde por la interfaz: ya mandaba todas las
preguntas, así que su nota no cambia. Cambia solo para quien manda un cuerpo
parcial. En producción no hay ningún quiz todavía (0 quizzes, 0 preguntas, 0
intentos), así que no hay datos que reparar ni notas que recalcular.

**Probado.** Aplicada y comprobada contra la base: la función ya no usa la
lista de preguntas del cliente y recorre las del quiz.

---

### `20260925000100_event_capacity_past_and_race.sql` — EVENT-001 (HIGH), EVENT-002 (MEDIUM)

**Archivo:** función `enforce_event_capacity`

**Qué pasaba (EVENT-001).** Un evento finalizado seguía aceptando inscripciones
por la API REST. `enrollmentBlock()` lo bloquea, pero solo en React; su propio
comentario decía «la comprobación que manda vive en el trigger
enforce_event_capacity», y el trigger comprobaba cancelación y cupo, pero no la
fecha. Explotable ahora mismo: «I Certificación Cubo Feedback» terminó el
2026-07-23 y sigue `published` y `public`.

**Qué pasaba (EVENT-002).** El trigger leía el recuento de plazas y decidía sin
bloqueo. Dos inscripciones a la vez leían el mismo número, las dos lo veían por
debajo del cupo y las dos entraban.

**Qué se hizo.** Se añadió la comprobación de fecha
(`coalesce(event_end_at, event_start_at) < now()`), dejando pasar al admin y al
contexto de servicio — inscribir a mano a quien asistió ocurre necesariamente
después del evento, y confirmar un pago tardío también. Y un
`pg_advisory_xact_lock` por evento antes de contar, tomado solo cuando hay cupo
declarado para no pagarlo en eventos sin límite ni en cursos.

**Impacto.** El botón «Inscribir manualmente» y la confirmación de órdenes
siguen funcionando (son de admin). Un estudiante deja de poder inscribirse a un
evento pasado por la API. El bloqueo serializa solo inscripciones al mismo
evento.

---

### `20260925000200_rls_lessons_scope_and_instructor_pii.sql` — RLS-001, RLS-002 (HIGH)

**Archivos:** política `read_lessons_public_or_enrolled`, privilegios de `profiles`

**Qué pasaba (RLS-001).** La política SELECT de `lessons` incluía
`get_user_role() = ANY('admin','instructor')` sin acotar por propiedad:
cualquier instructor leía el contenido completo de las lecciones de cualquier
curso, incluido el material de pago de otros instructores.

**Qué se hizo.** Se quitó esa cláusula. No cierra ningún camino legítimo: la
política ALL «Instructor gestiona lecciones de sus cursos» ya resuelve SELECT
para el instructor en lo suyo y para el admin en todo, y las políticas
permisivas se combinan con OR.

**Verificado antes de tocarlo.** Se revisaron las 13 lecturas de `lessons` en
`src/`: todas son del curso propio, del admin, del estudiante matriculado, o del
temario público vía `course_syllabus_by_slug` (SECURITY DEFINER, no depende de
esta política). Ninguna necesita leer lecciones ajenas.

**Qué pasaba (RLS-002).** `read_profiles` incluye `role = 'instructor'`, que
entrega la fila completa —con `email` y `phone`— a cualquier visitante anónimo.

**Qué se hizo.** La cláusula se queda (el sitio público necesita nombre, avatar,
bio, profesión y especialidad). Se acotó por columna: se le retira a `anon` el
SELECT sobre `email` y `phone` y se le devuelve sobre el resto. Es la misma
técnica que este proyecto ya usa para `answers.is_correct`.

**Verificado antes de tocarlo.** Ninguna pantalla pública pide `email` ni
`phone`. Y la vía de escape: existe `users_view`, que hace SELECT sobre
`profiles` incluyendo el correo y que `anon` puede leer — pero está creada con
`security_invoker=on`, así que se evalúa con los permisos de quien consulta y el
revoke la alcanza. `users_view` se queda porque la usan Usuarios del panel y los
dos asistentes, todas como `authenticated`.

**Lo que NO se arregló.** A `authenticated` no se le retira nada: los
privilegios por columna son por rol, no por política, y un admin también es
`authenticated` — revocárselo rompería Usuarios, Órdenes y Asistencia. Un
estudiante con sesión todavía puede leer el correo de un instructor. Queda
anotado en AUDIT.md.

---

### `20260925000300_harden_grants_and_drop_unused_view.sql` — SEC-LOW-001 (LOW), DB-001 (MEDIUM)

**Qué se hizo.** Un bloque que recorre las funciones de `public` que devuelven
`trigger` y les revoca EXECUTE a `anon` y `authenticated`. Eran 14 las
expuestas; 10 ya estaban revocadas, así que esto termina un trabajo empezado y
lo deja de forma que no haya que mantenerlo a mano.

Y se elimina la vista `lessons_syllabus_preview`: sin uso en `src/`, sin
dependientes en `pg_depend`, y era el único ERROR del linter de seguridad
(`security_invoker=false`, así que saltaba la RLS y entregaba títulos de
lecciones de cursos `unlisted` y `private` publicados).

**Cuidado explícito.** No se tocan los ayudantes que usan las políticas RLS
(`auth_user_role`, `get_user_role`, `is_my_student`, `is_enrolled_in_course`,
`event_seats_taken`, `*_admin_or_owner`): se evalúan dentro de las políticas con
los permisos de quien consulta, así que revocarlos rompería la RLS de media base.

---

### `20260925000400_instructor_documents_upload_limits.sql` — STORAGE-001 (MEDIUM)

**Qué pasaba.** El bucket `instructor-documents` acepta subidas anónimas (hace
falta: quien se postula todavía no tiene cuenta), pero tenía `file_size_limit` y
`allowed_mime_types` en NULL. Cualquiera podía subir archivos de cualquier tipo
y tamaño, tantos como quisiera. La restricción existía solo en el navegador
(PDF, 8 MB), y la subida va directa al endpoint de Storage sin pasar por ahí.

**Qué se hizo.** Se fijan en el bucket los mismos límites que ya declara el
formulario: `application/pdf` y 8 MB. No cambia nada para quien se postula.

---

### `20260925000500_revoke_certificate_on_attendance_revert.sql` — CERT-001 (MEDIUM)

**Qué pasaba.** Marcar asistencia crea el certificado (trigger
`create_certificate_on_completion`). Quitarla —el mismo botón, que es un
interruptor— dejaba el certificado en pie. Alguien marcado por error conservaba
su certificado en la cola, el admin lo aprobaba sin motivo para sospechar, y
quedaba una credencial con código de verificación público sin haberla ganado.

**Qué se hizo.** Un trigger simétrico al que lo crea, porque quien crea el
certificado es un trigger y ponerlo en el cliente valdría solo para el botón que
ya existe, no para un reembolso o cualquier pantalla futura. Dos casos, ambos
con mecanismos que ya existían:

- certificado sin aprobar → se borra (no se emitió nada, era una entrada en la
  cola de revisión);
- certificado ya aprobado → **no** se borra, porque tiene código público y PDF;
  pasa a `rejected`, que es el estado terminal que este sistema ya usa para
  «no vale», con la nota del motivo. `notify_certificate_review` avisa al
  estudiante y `request_certificate_review` le deja reclamar.

**Lo que queda fuera.** El PDF sigue en el bucket público aunque el certificado
pase a `rejected`. Es el asunto de archivos huérfanos ya conocido.

---

## Frontend — cambios aplicados y verificados

### `src/lib/markEventAttendance.js` — el motivo del fallo se perdía

Devolvía siempre «No se pudo actualizar la asistencia. Intenta de nuevo.», que
es el peor consejo posible cuando el motivo es falta de permiso: repetir no
arregla nada. Ahora usa `runMutation` + `errorMessage` como el resto del
proyecto, así que el fallo se registra en consola y el usuario ve el motivo
real (`42501` → «No tienes permiso para hacer esto»).

**Impacto.** Necesario además para CERT-001: si el trigger nuevo rechazara algo,
antes el mensaje no habría llegado a nadie.

### `src/lib/eventStatus.js` + 3 llamadas — cupos anunciados en eventos terminados

`seatsLabel()` devolvía el texto de plazas sin mirar el estado del evento. La
ficha del evento del 22 de julio mostraba «Evento finalizado» y justo debajo
«Quedan 12 cupos de 12» — la misma tarjeta contradiciéndose. Ahora
`seatsLabel(seats, event)` devuelve `null` en eventos cancelados o pasados.

La regla vive en `eventStatus.js` y no en cada pantalla, que es la razón de ser
de ese archivo: la tarjeta del catálogo, la ficha pública y la del portal no
pueden volver a discrepar. Los tres sitios que la llamaban pasan ahora el
evento; el parámetro es opcional, así que una llamada olvidada se comporta como
antes en vez de romperse.

**Probado en el navegador.** Catálogo y ficha del evento pasado: la línea de
cupos desaparece, «FINALIZADO» y «Evento finalizado» se mantienen, y
«Cupo limitado (12 personas)» sigue en la lista de características, que es
descripción del formato y no una promesa de disponibilidad. Sin errores de
consola.

### `src/pages/public/CourseCatalogPage.jsx` — un fallo se veía como catálogo vacío

Era la última página pública con el patrón que `lib/db.js` existe para
erradicar: `.then(({ data }) => setX(data || []))`. Si la consulta fallaba, el
visitante veía «No encontramos cursos». En la página que vende los cursos, eso
significa que se va creyendo que no hay nada. Su hermana `EventCatalogPage` ya
lo hacía bien, así que se copió ese patrón exacto: `runQuery`, estado `loadErr`,
`<ErrorState>` con botón de reintento.

**Probado en el navegador.** Se interceptó `fetch` para forzar un 500 en
`/rest/v1/courses`: aparece «No pudimos cargar los cursos» con el código 42703 y
el botón «Reintentar». Retirado el fallo simulado, «Reintentar» recupera el
catálogo (1 curso). Ciclo carga → error → reintento → éxito verificado entero.

### `src/.../Step5Certificate.jsx`, `useCourseWizard.js`, `CourseWizardPage.jsx` — WIZ-001

El asistente ofrecía «Completar 100 %» como condición del certificado, pero
`toggle_lesson_progress` se niega a completar la matrícula cuando el curso tiene
el módulo «Evaluación Final» («a course with a final exam module must be
completed via exam approval»). Guardar `'complete'` dejaba en la base una
promesa que el propio servidor incumple: quien acababa las lecciones no
completaba el curso y no entendía por qué.

Dos capas:

- **al guardar** (`saveStep5`), la condición se normaliza a `'pass'` si el curso
  tiene evaluación con preguntas. Es el punto por el que pasa cualquier camino,
  incluido el de un curso que ya tenía `'complete'` guardado y al que se le
  añade la evaluación después;
- **en la interfaz**, con evaluación el selector se sustituye por la condición
  real («Aprobar evaluación») y una nota que explica cómo cambiarla (quitar la
  evaluación en el paso 4).

**Impacto en datos.** Ninguno ahora: el único curso con evaluación en producción
ya tiene `certificate_condition = 'pass'`, y los dos eventos con `'complete'` no
tienen módulos, así que la normalización no los toca.

**No probado en pantalla.** Requiere sesión de instructor o admin, y no tengo
credenciales ni debo usarlas. Verificado por lectura del diff, lint y build.

### Limpieza de lint — 8 avisos a 0

Se revisó cada uno antes de tocarlo; todos eran residuo real:

| Archivo | Qué era |
| --- | --- |
| `HomePage.jsx` | `COURSES`, array de 41 líneas con cursos inventados de la maqueta, sin usar desde que la portada lee cursos reales |
| `HomePage.jsx` | `scrolled` nunca se leía, pero su `setScrolled` colgaba de un listener de `scroll` que se ejecutaba en cada desplazamiento para nada — se quitó el listener entero |
| `ui/index.jsx` | `useState` importado sin usar |
| `StepHeader.jsx` | `n` ya no se pinta (el número de paso lo muestra `<WizardProgress/>`) |
| `Step3Content.jsx` | parámetro `mIdx` sin usar |
| `Portal.jsx` | parámetro `params` sin usar en `renderSection` |
| `CourseReviewPage.jsx`, `public/CourseDetailPage.jsx` | ternario usado como sentencia para alternar un `Set`; se pasó a `if/else`, que es como ya lo escribe `StudentLearningPage.toggleMod` |

---

### `20260925000600_revoke_trigger_fn_execute_from_public.sql` — SEC-LOW-001 (corrección)

**Qué pasaba.** La migración `...000300` se aplicó sin error y no revocó nada:
las 14 funciones seguían expuestas. `anon` no tenía el EXECUTE a su nombre, lo
heredaba de `PUBLIC`, así que revocárselo a él era una operación válida sin
efecto.

**Qué se hizo.** Revocar a `public` además de a `anon` y `authenticated`. Se
mantiene el revoke explícito a los dos roles por si alguna función llevara
también un grant directo, que quitar solo `PUBLIC` no cubriría.

**Impacto.** 0 funciones de trigger expuestas (antes 14). Los triggers siguen
disparándose: Postgres comprueba ese permiso al crear el trigger, no al
ejecutarlo.

---

## Aplicación y verificación

Las 7 migraciones se aplicaron una a una el 2026-09-26, comprobando el
resultado contra la base después de cada una.

| Comprobación | Resultado |
| --- | --- |
| `submit_quiz_attempt` ya no usa la lista del cliente | sí |
| `submit_quiz_attempt` recorre todas las preguntas | sí |
| `enforce_event_capacity` comprueba la fecha | sí |
| `enforce_event_capacity` toma el bloqueo por evento | sí |
| `anon` ve `profiles.email` / `phone` | **no** (antes sí) |
| `anon` ve `full_name`, `avatar_url`, `bio`, `profession`, `specialty` | sí |
| `authenticated` ve `profiles.email` (lo necesita el panel) | sí |
| política de `lessons` sin la cláusula de instructor | sí |
| vista `lessons_syllabus_preview` | eliminada |
| funciones de trigger expuestas a `anon` | **0** (antes 14) |
| trigger de revocar certificado conectado | sí |
| bucket `instructor-documents` | 8 MB / `application/pdf` |
| ERROR del linter de seguridad de Supabase | **desaparecido** |
| avisos `anon` SECURITY DEFINER | 18 (antes 31) |

### El revoke que no revocaba nada

`...000300` se aplicó sin error y **no cambió nada**. Al comprobarlo, las 14
funciones seguían expuestas: `anon` no tenía el EXECUTE a su nombre, lo
heredaba de `PUBLIC`. En el ACL se ve como la entrada sin beneficiario
(`=X/postgres`), que estaba presente en las expuestas y ausente en las 10 ya
endurecidas antes de esta sesión.

Se añadió `...000600_revoke_trigger_fn_execute_from_public.sql`, que revoca a
`public, anon, authenticated`. Resultado: 0 expuestas. No se editó `...000300`
porque ya estaba registrada como aplicada y editarla no la volvería a ejecutar;
en un entorno nuevo las dos se aplican en orden con el mismo resultado.

### Que los triggers sigan disparándose

Quitar EXECUTE a `PUBLIC` no impide que un trigger existente se dispare:
Postgres comprueba ese permiso **al crear** el trigger, no al ejecutarlo. La
prueba está en esta misma base: `enroll_on_order_complete`, `update_updated_at`
y `prevent_role_escalation` ya tenían `PUBLIC` revocado desde antes de esta
sesión, y sus triggers funcionan en producción. Se confirmó además que las 25
funciones conservan sus triggers conectados y el acceso de `service_role`.

(La prueba directa —insertar una matrícula en una transacción revertida— la
bloqueó el clasificador de seguridad por contener escrituras contra
producción.)

### Sitio público tras el cambio de permisos

Revisado `https://www.cubocampus.com` después de aplicar todo, porque el cambio
de privilegios por columna sobre `profiles` era lo único capaz de romper algo
visible:

- «El equipo docente» pinta los 3 instructores con nombre, profesión y bio;
- la franja de datos muestra 1 curso y 3 instructores;
- la ficha de curso carga instructor, temario, reseñas y precio;
- sin errores de consola.

### Lo que queda sin desplegar

Los arreglos de frontend (cupos en eventos finalizados, estado de error del
catálogo de cursos, condición del certificado en el asistente, limpieza de
código muerto) están commiteados en `auditoria/2026-09-25` pero **no
desplegados**: producción sigue sirviendo el frontend anterior.
