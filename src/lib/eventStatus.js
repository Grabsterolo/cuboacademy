/**
 * Cursos y eventos viven en la misma tabla `courses`, separados por
 * `courses.type`. Cuando una pantalla ignora ese campo, un evento presencial
 * termina contado como curso y enviado al reproductor de lecciones, que para
 * un evento siempre está vacío.
 *
 * Estos helpers son la única definición de «esto es un evento» y de su estado,
 * para que Panel, Instructores, Logros y la vista de evento no vuelvan a
 * responder cosas distintas.
 */

export function isEvent(course) {
  return course?.type === 'event'
}

/** Separa una lista de matrículas en cursos y eventos según courses.type. */
export function splitEnrollments(enrollments) {
  const courses = []
  const events = []
  for (const e of enrollments || []) {
    if (!e.courses) continue
    ;(isEvent(e.courses) ? events : courses).push(e)
  }
  return { courses, events }
}

function sameLocalDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/**
 * Estado de un evento en el tiempo. Un evento que empezó hoy pero ya terminó
 * cuenta como finalizado, no como «hoy» — de ahí que se mire event_end_at
 * antes que la fecha de inicio.
 *
 * Sin fecha de inicio se asume «próximo»: es un evento mal configurado, y
 * decirle «finalizado» a alguien que pagó sería peor que no decir nada.
 */
export function eventStatus(event, now = new Date()) {
  const startRaw = event?.event_start_at
  if (!startRaw) return { key: 'upcoming', label: 'Próximo', bg: 'var(--jade-soft)', color: 'var(--jade)' }

  const start = new Date(startRaw)
  const end = event.event_end_at ? new Date(event.event_end_at) : start

  if (end.getTime() < now.getTime()) {
    return { key: 'past', label: 'Finalizado', bg: '#F5F5F0', color: '#9B9894' }
  }
  if (sameLocalDay(start, now)) {
    return { key: 'today', label: 'Hoy', bg: '#FFFBEB', color: '#B45309' }
  }
  return { key: 'upcoming', label: 'Próximo', bg: 'var(--jade-soft)', color: 'var(--jade)' }
}

/**
 * En eventos virtuales `location` guarda el enlace de acceso (no hay columna
 * aparte); en presenciales guarda una dirección. Distinguirlos permite
 * mostrar un enlace pulsable en vez de una URL suelta como si fuera una calle.
 */
export function eventAccessLink(event) {
  const loc = event?.location
  if (!loc) return null
  return /^https?:\/\//i.test(loc.trim()) ? loc.trim() : null
}

/** Ordena eventos: primero los que aún no han pasado, por fecha ascendente. */
export function sortEventsByRelevance(enrollments, now = new Date()) {
  return [...enrollments].sort((a, b) => {
    const aPast = eventStatus(a.courses, now).key === 'past'
    const bPast = eventStatus(b.courses, now).key === 'past'
    if (aPast !== bPast) return aPast ? 1 : -1
    const at = a.courses?.event_start_at ? new Date(a.courses.event_start_at).getTime() : Infinity
    const bt = b.courses?.event_start_at ? new Date(b.courses.event_start_at).getTime() : Infinity
    return aPast ? bt - at : at - bt
  })
}
