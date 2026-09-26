# Auditoría técnica — CUBO Campus

Fecha: 2026-09-25 · Rama: `main` · Base: `sshfhlaqlqgdkwaecvpx` (producción)

> **Aplicado y verificado en producción el 2026-09-26.** Las 7 migraciones están
> aplicadas y comprobadas contra la base; el sitio público se revisó después del
> cambio de permisos y sigue correcto. Detalle en [CHANGES.md](CHANGES.md).

---

## 1. Stack real (determinado desde el código, no asumido)

| Capa | Qué se usa | Evidencia |
| --- | --- | --- |
| Framework UI | React 19.2 (sin framework de aplicación) | `package.json`, `src/main.jsx` |
| Lenguaje | JavaScript + JSX. **No hay TypeScript** | no existe `tsconfig.json`; `@types/*` están pero sin uso real |
| Bundler | Vite 8 | `vite.config.js` |
| Estilos | Tailwind 3.4 + CSS custom properties + estilos en línea | `tailwind.config.js`, `src/styles/globals.css` |
| Enrutado | **Ninguno.** Estado en memoria (`NavigationContext`) | `src/context/NavigationContext.jsx` — ver ARCH-001 |
| Backend | Supabase (Postgres 17.6) | `src/lib/supabase.js` |
| Auth | Supabase Auth (email/contraseña) | `src/context/AuthContext.jsx` |
| Autorización | RLS + funciones `SECURITY DEFINER` + privilegios por columna | 23 tablas con RLS activo |
| Almacenamiento | Supabase Storage, 5 buckets | `storage.buckets` |
| Funciones servidor | 2 edge functions en repo (`approve-certificate`, `provision-instructor`) + `send-notification-email` desplegada **fuera** del repo | `supabase/functions/` |
| Estado cliente | 4 Context providers, sin librería de estado | `src/context/` |
| Datos remotos | `useQuery` propio + envoltorio `runQuery`/`runMutation`/`runFunction` | `src/lib/useQuery.js`, `src/lib/db.js` |
| Tests | **Ninguno** | no hay runner ni archivos de test |
| Lint | oxlint | `npm run lint` |
| Correo | Resend, vía edge function | `email_logs` |

**Tamaño:** 21 537 líneas en `src/`, 96 archivos.

### Verificaciones ejecutadas al inicio

| Comando | Resultado |
| --- | --- |
| `npm run lint` | pasa, 8 avisos (LINT-001) |
| `npm run build` | pasa en 1,4 s |
| `npm run typecheck` | **no existe** (el proyecto no usa TypeScript) |
| `npm test` | **no existe** |

---

## 2. Mapa de entidades reales

Las entidades no coinciden con el esquema genérico de e-learning. Lo que existe de verdad:

```
auth.users ──1:1── profiles (role: admin|instructor|student, is_active)
                      │
                      ├── instructor_id ──> courses ──┬── modules ── lessons ──┬── resources
                      │                    (type:     │                        └── quizzes ── questions ── answers
                      │                     course|   │
                      │                     event)    ├── category_id ──> categories
                      │                               ├── enrollments ──┬── lesson_progress
                      │                               │                 ├── certificates
                      │                               │                 └── exam_submissions
                      │                               ├── orders
                      │                               ├── course_reviews
                      │                               └── wishlist_items
                      ├── announcements (created_by)
                      ├── notifications (recipient_id)
                      └── email_logs (recipient_id)

platform_settings (clave/valor, sin relación)
instructor_applications ──> profiles (profile_id, al aprobar)
```

### Decisión de diseño central: `courses` es una tabla para dos cosas

**Cursos y eventos comparten la tabla `courses`**, separados por `courses.type`
(`course` | `event`). Los eventos usan columnas propias que quedan nulas en los
cursos: `event_start_at`, `event_end_at`, `modality`, `location`, `capacity`,
`country`, `city`, `cancelled_at`, `cancellation_reason`.

Esto es coherente y está bien defendido en el código (`src/lib/eventStatus.js`
centraliza `isEvent()` y el estado), pero es el origen de varios riesgos: toda
pantalla que olvide filtrar por `type` mezcla las dos cosas. `StudentLearningPage`
tiene un guardarraíl explícito para esto (redirige si `type === 'event'`).

### Fuente de verdad por dato

| Dato | Fuente de verdad | Cómo se garantiza |
| --- | --- | --- |
| Precio | `courses.price` | RLS de `orders` **obliga** a `amount = courses.price` en el INSERT. No se puede manipular desde el cliente. Correcto. |
| Plazas de evento | `event_seats_taken()` en el servidor | Cuenta matrículas ∪ órdenes pendientes. El navegador nunca cuenta (no puede leer filas ajenas). Correcto. |
| Rol | `profiles.role` | Trigger `prevent_role_escalation` + `auth_user_role()` |
| Progreso de lección | `lesson_progress` | RPC `toggle_lesson_progress` (el cliente no decide) |
| Curso completado | `enrollments.completed_at` | Solo servidor: trigger `prevent_student_self_completion` revierte al estudiante |
| Clave de respuestas | `answers.is_correct` | **Privilegio por columna revocado** a `anon` y `authenticated` + RPC `get_answer_key` con control de rol. Bien diseñado. |
| Estado del evento | derivado de fechas (`eventStatus()`), no almacenado | Correcto: no hay estado que se desincronice |

### Estados reales

| Entidad | Estados | Tipo |
| --- | --- | --- |
| `courses.status` | `draft` → `pending` → `published` / `archived` | enum `course_status` |
| `courses.visibility` | `public` \| `unlisted` \| `private` | enum |
| Evento (derivado) | `cancelled` \| `past` \| `today` \| `upcoming` | calculado, no almacenado |
| `orders.status` | `pending` → `completed` / `failed` / `refunded` | enum |
| `certificates.status` | `pending` → `approved` / `rejected` | **text + CHECK** |
| `exam_submissions.status` | `pending` → `approved` / `rejected` | **text + CHECK** |
| `quiz_attempts.status` | `pending_review` \| `graded` | **text + CHECK** |
| Matrícula | sin columna de estado; solo `enrolled_at` / `completed_at` | — |

**No existe matrícula «cancelada».** Un reembolso borra la fila. Esto evita de
raíz el problema clásico de «una inscripción cancelada sigue contando para
capacidad»: no hay tal estado.

---

## 3. Hallazgos

Severidad: CRITICAL (seguridad, corrupción de datos, acceso indebido) · HIGH
(lógica de negocio incorrecta, permisos) · MEDIUM (error funcional secundario,
arquitectura, rendimiento) · LOW (limpieza, deuda menor).

| ID | Área | Sev. | Problema | Causa | Solución | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| QUIZ-001 | Evaluaciones / integridad | CRITICAL | Un estudiante puede sacar 100 % en cualquier quiz enviando solo las preguntas que sabe acertadas. Rompe la cadena de certificación. | `submit_quiz_attempt` acumula el denominador (`v_total_points`) recorriendo **solo las preguntas presentes en `p_responses`**, que las manda el cliente. | Recorrer todas las preguntas del quiz; las no enviadas puntúan 0. | **Corregido y aplicado** |
| EVENT-001 | Eventos / negocio | HIGH | Un evento ya finalizado sigue aceptando inscripciones por la API REST. Explotable hoy: «I Certificación Cubo Feedback» terminó el 2026-07-23 y sigue `published`. | `enrollmentBlock()` lo bloquea solo en la interfaz. El trigger `enforce_event_capacity` comprueba cancelación y cupo, pero **no la fecha**. | Añadir la comprobación de fecha al trigger, dejando pasar a admin/instructor (inscripción manual a posteriori es un caso legítimo). | **Corregido y aplicado** |
| RLS-001 | Autorización | HIGH | Cualquier instructor puede leer **todas** las lecciones de la plataforma, incluido el contenido de pago de otros instructores. | La política SELECT de `lessons` incluye `get_user_role() = ANY('admin','instructor')` sin acotar por propiedad. | Quitar esa cláusula: la política ALL ya da a cada instructor sus lecciones y al admin todas. | **Corregido y aplicado** |
| RLS-002 | Privacidad | HIGH | El correo y el teléfono de los instructores son legibles por visitantes anónimos. | La política `read_profiles` incluye `role = 'instructor'`, que expone la fila completa. | Vista/RPC acotada a campos públicos y quitar la cláusula de la política. | **Corregido y aplicado** (solo `anon`) |
| EVENT-002 | Eventos / concurrencia | MEDIUM | Dos inscripciones simultáneas pueden superar el cupo (sobreventa). | `enforce_event_capacity` lee el recuento sin bloqueo — TOCTOU clásico. | `pg_advisory_xact_lock` por evento antes de contar. | **Corregido y aplicado** |
| CERT-001 | Certificados | MEDIUM | Quitar la asistencia a alguien le deja el certificado ya creado. Si el admin lo aprueba, queda una credencial verificable públicamente sin haberla ganado. | `markEventAttendance` pone `completed_at = null`, pero el certificado que creó el trigger no se retira. | Retirar el certificado no aprobado al revertir la asistencia. | **Corregido y aplicado** |
| STORAGE-001 | Almacenamiento | MEDIUM | Cualquier anónimo puede subir archivos **de cualquier tipo y tamaño** al bucket `instructor-documents`. | La política INSERT solo comprueba `bucket_id`; el bucket tiene `file_size_limit` y `allowed_mime_types` en `null`. La validación (PDF, 8 MB) está solo en el navegador. | Fijar los límites en el bucket para que coincidan con la validación del cliente. | **Corregido y aplicado** |
| WIZ-001 | Lógica de negocio | MEDIUM | El asistente ofrece «Completar 100 %» como condición del certificado, pero si el curso tiene evaluación final el servidor **ignora** esa elección y exige aprobar el examen. | `toggle_lesson_progress` anula la autocompletación cuando existe el módulo «Evaluación Final»; nada impide la combinación en el asistente. | Fijar la condición a «Aprobar evaluación» cuando hay evaluación, y explicarlo. | **Corregido y desplegable** |
| STORAGE-002 | Almacenamiento | MEDIUM | `course-resources` es un bucket **público**: el material de un curso de pago se descarga con solo tener la URL, sin estar matriculado. | Bucket con `public: true`; la RLS del API no aplica al endpoint público. | Requiere decisión: pasar a bucket privado + URLs firmadas. Ver «Decisiones pendientes». | PENDING DECISION |
| DB-001 | Base de datos | MEDIUM | Vista `lessons_syllabus_preview` sin uso, marcada ERROR por el linter de Supabase por ser `SECURITY DEFINER`. | Quedó huérfana al pasar el temario a `course_syllabus_by_slug`. | Eliminarla. | **Corregido y aplicado** |
| ARCH-001 | Arquitectura / UX | MEDIUM | No existe enrutado por URL. Toda la aplicación vive en `/`. Recargar pierde el contexto, atrás/adelante no funcionan, no hay enlaces profundos ni URL por curso o evento. | `NavigationContext` guarda la pantalla en `useState`, sin tocar `history`. | Cambio estructural. Ver «Decisiones pendientes». | PENDING DECISION |
| SEC-LOW-001 | Endurecimiento | LOW | 14 funciones de trigger están expuestas como endpoints RPC a `anon`. No son explotables (Postgres rechaza llamar una función de trigger fuera de un trigger), pero no deberían estar en la superficie pública. | `GRANT EXECUTE` por defecto a `anon`/`authenticated` en el esquema `public`. | Revocar EXECUTE en las funciones de trigger. **Al primer intento no revocó nada**: `anon` no tenía el permiso a su nombre, lo heredaba de `PUBLIC`. Corregido con una segunda migración. | **Corregido y aplicado** (0 expuestas, antes 14) |
| LINT-001 | Calidad | LOW | 8 avisos de oxlint: variables y parámetros sin usar, dos expresiones sin usar. | Restos de refactorizaciones anteriores. | Limpiar los que son residuo real. | **Corregido** (0 avisos) |
| PERF-001 | Rendimiento | LOW | `citiesByCountry.js` pesa 333 KB (108 KB gzip) y se carga en el paso 2 del asistente de eventos. | Dataset de ciudades embebido en el bundle. | Aceptable: está en un chunk aparte y solo lo cargan instructores y admins. Documentado, no se cambia. | Aceptado |
| DEBT-001 | Base de datos | LOW | Los estados mezclan dos convenciones: unos son `enum`, otros `text` + CHECK. | Crecimiento incremental del esquema. | No se toca: cambiar el tipo de una columna en producción no compensa la mejora cosmética. | Aceptado |
| DEBT-002 | Arquitectura | LOW | La cadena del examen final se identifica por el **título** del módulo (`'Evaluación Final'`), en 4 funciones SQL y 6 archivos del frontend. | Convención en vez de columna. | Mitigado: el asistente reserva ese nombre y no deja usarlo en un módulo normal (`useCourseWizard.js:199`). Se documenta como deuda. | Aceptado |
| REPO-001 | Repositorio | LOW | Dos worktrees de git obsoletos en `.claude/worktrees/`, uno con cambios sin commitear cuyo trabajo ya está en `main` por otra vía. | Sesiones en segundo plano anteriores. | Informado a Juan Pablo; no se borra sin su confirmación. | Informado |
| AUTH-002 | Auth | LOW | Protección contra contraseñas filtradas (HaveIBeenPwned) desactivada. | Configuración de consola. | No hay herramienta para cambiarlo desde aquí. Ver «Decisiones pendientes». | PENDING DECISION |

---

## 4. Lo que se revisó y está correcto

Conviene dejarlo escrito para que una auditoría futura no lo vuelva a levantar
como sospecha:

- **Manipulación de precio: imposible.** La política INSERT de `orders` obliga a
  `amount = (select price from courses where id = course_id)`.
- **Clave de respuestas: protegida de verdad.** `answers.is_correct` **no** tiene
  `SELECT` para `anon` ni `authenticated` (privilegio por columna revocado). Un
  estudiante matriculado no puede leerla ni por PostgREST ni por RPC —
  `get_answer_key` comprueba rol. Empecé sospechando lo contrario; el diseño es
  correcto.
- **Autocompletarse un curso: imposible.** `prevent_student_self_completion`
  revierte `completed_at` si lo toca el propio estudiante, salvo por el RPC.
- **Autopublicarse un curso: imposible.** `block_instructor_self_publish`.
- **Escalada de rol: imposible.** `prevent_role_escalation` cubre `role` e `is_active`.
- **Cuentas desactivadas.** `AuthContext.establishSession` cierra sesión a
  `is_active = false` desde ambos caminos (`getSession` y `onAuthStateChange`).
- **Inscripción manual acotada a admin**, con el motivo escrito en el código
  (`EventAttendancePage.jsx:24-28`): un instructor no puede insertar matrículas
  ni buscar perfiles ajenos, así que el botón se le oculta con razón.
- **Edge functions**: ambas verifican el rol de quien llama **en el servidor**
  con la service key, no en el navegador.
- **Errores silenciosos**: resueltos de forma sistemática. `src/lib/db.js`
  devuelve `data: null` (nunca `[]`) en error, registra siempre en consola, y
  `useQuery` + `<ErrorState/>` hacen que el camino correcto sea el más corto.
- **Integridad de datos**: 0 huérfanos. Comprobado: matrículas sin orden pagada,
  certificados sin matrícula completada, órdenes pagadas sin matrícula,
  `lesson_progress` de no matriculados, perfiles sin `auth.users` y al revés,
  desajuste de correo entre `profiles` y `auth.users`. Todo a cero.
- **Índices**: completos. Todas las claves ajenas y columnas de filtro habituales
  están indexadas.

---

## 5. Decisiones pendientes

### PENDING DECISION — STORAGE-002: material de curso en bucket público

`course-resources` es público. Quien tenga la URL descarga el PDF sin estar
matriculado. Las URL no son adivinables (llevan marca de tiempo) y solo se
entregan a quien pasa la RLS de `resources`, así que hoy la protección es la
opacidad de la URL, no un permiso.

Arreglarlo bien es pasar el bucket a privado y generar URLs firmadas en cada
descarga. Eso **rompe todas las `resources.file_url` ya guardadas** (son URLs
públicas persistidas) y exige migrar esas filas además de cambiar el código de
descarga.

**Decisión que hace falta:** ¿el material descargable es parte del valor pagado
que hay que proteger de verdad, o se acepta que una URL filtrada sea
compartible? Con 1 curso y 1 lección en producción, el momento de cambiarlo es
ahora si la respuesta es la primera.

### PENDING DECISION — ARCH-001: enrutado por URL

Hoy no hay URL. Consecuencias reales, no teóricas:

- Recargar en cualquier pantalla devuelve a la portada.
- Atrás y adelante del navegador no hacen nada.
- No se puede enviar el enlace de un curso o un evento a nadie.
- Un solo documento para todo el sitio: los buscadores no pueden indexar fichas.
- El enlace de recuperación de contraseña funciona solo porque cae en la raíz.

Para una plataforma que vende cursos, no poder compartir el enlace de una ficha
es una limitación comercial, no solo técnica.

**Decisión que hace falta:** es un cambio estructural (sincronizar
`NavigationContext` con `history`, dar URL a cada pantalla, resolver el estado
inicial desde la URL al arrancar). Se puede hacer de forma aditiva y sin
reescribir la aplicación, pero no es una corrección puntual y cambia el
comportamiento de navegación en todas las pantallas. No lo emprendo dentro de
esta auditoría sin luz verde.

### Nota de método — verificar no es opcional

La migración `...000300` hacía `revoke all on function … from anon,
authenticated` y se aplicó sin error. Al comprobar el resultado, las 14
funciones **seguían expuestas**: `anon` no tenía ese EXECUTE a su nombre, lo
heredaba de `PUBLIC`, y revocar un permiso que no se tiene directamente es una
operación válida que no hace nada.

Sin la comprobación posterior, esto se habría dado por cerrado estando abierto,
con el linter confirmándolo semanas después. Se arregló con
`...000600_revoke_trigger_fn_execute_from_public.sql`.

### PENDING DECISION — AUTH-002 y configuración de consola

Sin herramienta desde aquí. Siguen abiertos de antes y están anotados en la
lista de pendientes: `RESEND_API_KEY` (los 10 registros de `email_logs` están en
`failed`: **ningún correo de la plataforma se entrega**), Site URL de Auth
apuntando a `localhost:3000`, textos legales vacíos, datos de pago vacíos,
`contact_whatsapp` vacío, y esta protección de contraseñas filtradas.

---

## 6. Arquitectura resultante

No se cambió la arquitectura. La que hay, descrita con precisión:

```
src/main.jsx
  └── App.jsx ── NavigationProvider ── SettingsProvider ── AuthProvider ── NotificationProvider
        └── AppShell  (elige pantalla según `screen`, todo lazy-loaded)
              ├── pantallas de acceso (sin barra)
              ├── Portal.jsx        → portal autenticado, secciones por rol
              └── pantallas públicas → Navbar + contenido + Footer

Capas de datos:
  componentes/páginas
    └── useQuery / hooks (useOwnedCourses, useHeroMedia…)
         └── lib/db.js      runQuery · runMutation · runFunction · errorMessage
              └── lib/supabase.js   cliente único
                   └── Postgres: RLS + SECURITY DEFINER + privilegios por columna

Lógica de dominio en src/lib/ (ya extraída, no la introdujo esta auditoría):
  eventStatus.js  isEvent · eventStatus · enrollmentBlock · seatsLabel
  eventSeats.js   recuento de plazas (servidor)
  enrollCourse.js gratis → matrícula · pago → orden pendiente
  cancelEvent.js  cancelar + avisar
  markEventAttendance.js  asistencia → certificado
  progress.js     progreso por curso, compartido entre pantallas
```

El proyecto **ya venía con la separación que pide el objetivo** (UI → hooks →
dominio en `lib/` → acceso a datos en `db.js` → base). No hacía falta
reorganizarlo, y hacerlo habría sido un cambio cosmético masivo.

La regla de negocio principal (`enrollmentBlock`) ya estaba centralizada; el
problema no era la duplicación sino que el servidor no aplicaba la misma regla
(EVENT-001).
