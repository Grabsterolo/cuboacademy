import { describe, it, expect } from 'vitest'
import {
  isEvent,
  eventStatus,
  seatsLabel,
  enrollmentBlock,
  splitEnrollments,
  sortEventsByRelevance,
  eventAccessLink,
} from './eventStatus'

/**
 * Este archivo es la red de seguridad de las reglas de evento.
 *
 * Todas las funciones de eventStatus.js aceptan `now` como parámetro — no es
 * un detalle de estilo, es lo que permite probarlas sin congelar el reloj ni
 * depender de la fecha en que se ejecuten. Aquí se usa siempre un `NOW` fijo.
 *
 * Las fechas se construyen en hora local y se pasan en ISO, igual que llegan de
 * la base, para que `sameLocalDay` se compare como en producción sea cual sea
 * la zona horaria de la máquina.
 */

const NOW = new Date(2026, 8, 26, 14, 0, 0) // 26 sep 2026, 14:00 local

/** ISO de un instante desplazado respecto a NOW. */
function iso({ days = 0, hours = 0 }) {
  const d = new Date(NOW)
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

/** Evento mínimo; se sobrescribe lo que cada prueba necesite. */
function evento(extra = {}) {
  return {
    type: 'event',
    event_start_at: iso({ days: 5 }),
    event_end_at: iso({ days: 5, hours: 3 }),
    cancelled_at: null,
    ...extra,
  }
}

describe('isEvent', () => {
  it('distingue eventos de cursos por type', () => {
    expect(isEvent({ type: 'event' })).toBe(true)
    expect(isEvent({ type: 'course' })).toBe(false)
  })

  it('no revienta con null ni undefined', () => {
    expect(isEvent(null)).toBe(false)
    expect(isEvent(undefined)).toBe(false)
  })
})

describe('eventStatus', () => {
  it('la cancelación gana a cualquier fecha', () => {
    // Incluso un evento futuro cancelado se muestra como cancelado: a quien
    // pagó le importa más saber que no se hace que saber cuándo era.
    const e = evento({ cancelled_at: iso({ days: -1 }) })
    expect(eventStatus(e, NOW).key).toBe('cancelled')
  })

  it('un evento que ya terminó es «past»', () => {
    const e = evento({ event_start_at: iso({ days: -2 }), event_end_at: iso({ days: -2, hours: 3 }) })
    expect(eventStatus(e, NOW).key).toBe('past')
  })

  it('un evento de hoy que YA terminó es «past», no «today»', () => {
    // Este es el motivo de mirar event_end_at antes que la fecha de inicio.
    const e = evento({
      event_start_at: iso({ hours: -6 }), // hoy por la mañana
      event_end_at: iso({ hours: -4 }),   // y ya acabó
    })
    expect(eventStatus(e, NOW).key).toBe('past')
  })

  it('un evento de hoy que aún no termina es «today»', () => {
    const e = evento({ event_start_at: iso({ hours: -1 }), event_end_at: iso({ hours: 2 }) })
    expect(eventStatus(e, NOW).key).toBe('today')
  })

  it('un evento futuro es «upcoming»', () => {
    expect(eventStatus(evento(), NOW).key).toBe('upcoming')
  })

  it('sin fecha de fin usa la de inicio para decidir si pasó', () => {
    const terminado = evento({ event_start_at: iso({ hours: -2 }), event_end_at: null })
    expect(eventStatus(terminado, NOW).key).toBe('past')
  })

  it('sin fecha de inicio asume «upcoming», nunca «past»', () => {
    // Un evento mal configurado no debe decirle «finalizado» a alguien que pagó.
    const e = evento({ event_start_at: null, event_end_at: null })
    expect(eventStatus(e, NOW).key).toBe('upcoming')
  })
})

describe('seatsLabel', () => {
  const cupos = { capacity: 12, taken: 0, remaining: 12, is_full: false }

  it('sin cupo declarado no dice nada', () => {
    // «Cupo ilimitado» sonaría a promesa; lo que hay es un evento sin límite.
    expect(seatsLabel({ capacity: null, remaining: null, is_full: false })).toBeNull()
    expect(seatsLabel(null)).toBeNull()
  })

  it('lleno → «Agotado»', () => {
    expect(seatsLabel({ ...cupos, remaining: 0, is_full: true })).toMatchObject({ key: 'full', text: 'Agotado' })
  })

  it('con 3 o menos avisa en tono de urgencia', () => {
    expect(seatsLabel({ ...cupos, remaining: 3 })).toMatchObject({ key: 'few', tone: 'few' })
    expect(seatsLabel({ ...cupos, remaining: 1 }).text).toBe('Queda 1 cupo')
    expect(seatsLabel({ ...cupos, remaining: 2 }).text).toBe('Quedan 2 cupos')
  })

  it('con holgura informa sin alarmar', () => {
    expect(seatsLabel({ ...cupos, remaining: 8 })).toMatchObject({ key: 'ok', text: 'Quedan 8 cupos' })
  })

  // ── Regresión: la ficha se contradecía a sí misma ────────────────────────
  //
  // «I Certificación Cubo Feedback» mostraba «Evento finalizado» y justo debajo
  // «Quedan 12 cupos de 12». Quedan plazas en el sentido aritmético, pero no
  // hay nada a lo que apuntarse.

  it('NO anuncia cupos en un evento finalizado', () => {
    const pasado = evento({ event_start_at: iso({ days: -3 }), event_end_at: iso({ days: -3, hours: 3 }) })
    expect(seatsLabel(cupos, pasado, NOW)).toBeNull()
  })

  it('NO anuncia cupos en un evento cancelado', () => {
    expect(seatsLabel(cupos, evento({ cancelled_at: iso({ days: -1 }) }), NOW)).toBeNull()
  })

  it('sí los anuncia en un evento vigente', () => {
    expect(seatsLabel(cupos, evento(), NOW)).toMatchObject({ key: 'ok' })
  })

  it('sin pasarle el evento se comporta como antes', () => {
    // El parámetro es opcional a propósito: una llamada nueva que lo olvide
    // debe seguir funcionando, no romperse.
    expect(seatsLabel(cupos)).toMatchObject({ key: 'ok', text: 'Quedan 12 cupos' })
  })
})

describe('enrollmentBlock', () => {
  const libre = { capacity: 12, remaining: 12, is_full: false }

  it('deja pasar un evento vigente con cupo', () => {
    expect(enrollmentBlock(evento(), libre, NOW)).toBeNull()
  })

  it('bloquea un evento cancelado', () => {
    expect(enrollmentBlock(evento({ cancelled_at: iso({ days: -1 }) }), libre, NOW))
      .toMatchObject({ reason: 'cancelled' })
  })

  it('bloquea un evento agotado', () => {
    expect(enrollmentBlock(evento(), { ...libre, remaining: 0, is_full: true }, NOW))
      .toMatchObject({ reason: 'full' })
  })

  it('bloquea un evento finalizado', () => {
    // El espejo en el servidor es enforce_event_capacity, que desde la
    // auditoría también comprueba la fecha. Esto solo cubre la cortesía de
    // interfaz; la regla que manda vive en la base.
    const pasado = evento({ event_start_at: iso({ days: -2 }), event_end_at: iso({ days: -2, hours: 2 }) })
    expect(enrollmentBlock(pasado, libre, NOW)).toMatchObject({ reason: 'past' })
  })

  it('la cancelación tiene prioridad sobre el agotamiento', () => {
    const e = evento({ cancelled_at: iso({ days: -1 }) })
    expect(enrollmentBlock(e, { ...libre, is_full: true }, NOW)).toMatchObject({ reason: 'cancelled' })
  })

  it('un curso (no evento) no se bloquea por fecha', () => {
    // Los cursos comparten tabla con los eventos; sin el filtro por type, un
    // curso sin event_start_at se colaría por la rama de eventos.
    const curso = { type: 'course', event_start_at: null, event_end_at: null, cancelled_at: null }
    expect(enrollmentBlock(curso, libre, NOW)).toBeNull()
  })
})

describe('splitEnrollments', () => {
  it('separa cursos de eventos y descarta matrículas sin curso', () => {
    const { courses, events } = splitEnrollments([
      { id: 1, courses: { type: 'course' } },
      { id: 2, courses: { type: 'event' } },
      { id: 3, courses: null }, // curso borrado: no debe contarse en ninguno
    ])
    expect(courses.map(e => e.id)).toEqual([1])
    expect(events.map(e => e.id)).toEqual([2])
  })

  it('tolera null', () => {
    expect(splitEnrollments(null)).toEqual({ courses: [], events: [] })
  })
})

describe('sortEventsByRelevance', () => {
  it('pone los vigentes antes que los pasados', () => {
    const rows = [
      { id: 'pasado', courses: evento({ event_start_at: iso({ days: -10 }), event_end_at: iso({ days: -10, hours: 2 }) }) },
      { id: 'lejano', courses: evento({ event_start_at: iso({ days: 30 }), event_end_at: iso({ days: 30, hours: 2 }) }) },
      { id: 'pronto', courses: evento({ event_start_at: iso({ days: 2 }), event_end_at: iso({ days: 2, hours: 2 }) }) },
    ]
    expect(sortEventsByRelevance(rows, NOW).map(r => r.id)).toEqual(['pronto', 'lejano', 'pasado'])
  })

  it('no modifica el array que recibe', () => {
    const rows = [
      { id: 'b', courses: evento({ event_start_at: iso({ days: 9 }) }) },
      { id: 'a', courses: evento({ event_start_at: iso({ days: 1 }) }) },
    ]
    sortEventsByRelevance(rows, NOW)
    expect(rows.map(r => r.id)).toEqual(['b', 'a'])
  })
})

describe('eventAccessLink', () => {
  it('devuelve el enlace en un evento virtual', () => {
    expect(eventAccessLink({ location: 'https://meet.example.com/abc' })).toBe('https://meet.example.com/abc')
  })

  it('una dirección no es un enlace', () => {
    // En presenciales `location` guarda una calle; pintarla como enlace daría
    // una URL suelta donde debería ir una dirección.
    expect(eventAccessLink({ location: 'Torre 2020, San José' })).toBeNull()
  })

  it('sin ubicación no hay enlace', () => {
    expect(eventAccessLink({ location: null })).toBeNull()
    expect(eventAccessLink({})).toBeNull()
  })
})
