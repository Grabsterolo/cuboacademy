import { supabase } from './supabase'
import { runQuery } from './db'

/**
 * Plazas de uno o varios eventos, según el servidor.
 *
 * El recuento no se hace en el navegador a propósito. Para calcularlo haría
 * falta leer las matrículas y las órdenes de otras personas, que es justo lo
 * que las políticas RLS impiden —y con razón—. La función event_seats devuelve
 * solo el número: cuántas plazas hay, cuántas quedan, si está lleno.
 *
 * Devuelve un mapa por id de evento. Si la consulta falla se devuelve vacío y
 * quien llama pinta la ficha sin la línea de cupos: es peor bloquear una
 * compra por no poder contar que no mostrar el dato.
 */
export async function fetchEventSeats(courseIds) {
  const ids = [...new Set((courseIds || []).filter(Boolean))]
  if (!ids.length) return {}

  const { data, error } = await runQuery(
    supabase.rpc('event_seats', { p_course_ids: ids }),
    'eventSeats: plazas disponibles',
  )
  if (error || !data) return {}

  return Object.fromEntries(data.map(r => [r.course_id, {
    capacity: r.capacity,
    taken: r.taken,
    remaining: r.remaining,
    is_full: r.is_full,
  }]))
}

/** Atajo para una sola ficha. */
export async function fetchSeatsFor(courseId) {
  if (!courseId) return null
  const map = await fetchEventSeats([courseId])
  return map[courseId] || null
}
