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
  // La cancelación gana a todo lo demás: a quien compró le importa más saber
  // que no se hace que saber si era hoy o mañana.
  if (event?.cancelled_at) {
    return { key: 'cancelled', label: 'Cancelado', bg: '#FEEEEE', color: '#C81E1E' }
  }

  const startRaw = event?.event_start_at
  if (!startRaw) return { key: 'upcoming', label: 'Próximo', bg: 'var(--jade-soft)', color: 'var(--jade-ink)' }

  const start = new Date(startRaw)
  const end = event.event_end_at ? new Date(event.event_end_at) : start

  if (end.getTime() < now.getTime()) {
    return { key: 'past', label: 'Finalizado', bg: '#F5F5F0', color: 'var(--text-3)' }
  }
  if (sameLocalDay(start, now)) {
    return { key: 'today', label: 'Hoy', bg: '#FFFBEB', color: '#B45309' }
  }
  return { key: 'upcoming', label: 'Próximo', bg: 'var(--jade-soft)', color: 'var(--jade-ink)' }
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

/**
 * Texto de plazas para tarjeta y ficha.
 *
 * `seats` viene de la función event_seats del servidor, que es la única que
 * sabe contar: mezcla matrículas y órdenes pendientes de estudiantes distintos.
 * Aquí solo se le pone nombre al número.
 *
 * Sin cupo declarado no se dice nada. «Cupo ilimitado» sonaría a promesa, y lo
 * que hay en realidad es un evento al que nadie le puso límite.
 */
export function seatsLabel(seats) {
  if (!seats || seats.capacity == null) return null
  if (seats.is_full) return { key: 'full', text: 'Agotado', tone: 'full' }
  const left = seats.remaining
  if (left <= 3) return { key: 'few', text: left === 1 ? 'Queda 1 cupo' : `Quedan ${left} cupos`, tone: 'few' }
  return { key: 'ok', text: `Quedan ${left} cupos`, tone: 'ok' }
}

/**
 * ¿Se puede pedir plaza? Reúne en un solo sitio los motivos por los que no,
 * para que la ficha pública y la del portal no discrepen.
 *
 * Es una cortesía de interfaz: la comprobación que manda vive en el trigger
 * enforce_event_capacity, porque la API REST está abierta.
 */
export function enrollmentBlock(event, seats, now = new Date()) {
  if (event?.cancelled_at) return { reason: 'cancelled', label: 'Evento cancelado' }
  if (seats?.is_full) return { reason: 'full', label: 'Agotado' }
  if (isEvent(event) && eventStatus(event, now).key === 'past') {
    return { reason: 'past', label: 'Evento finalizado' }
  }
  return null
}
