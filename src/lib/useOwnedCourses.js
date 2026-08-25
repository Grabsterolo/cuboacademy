import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { runQuery } from './db'

/**
 * Qué cursos y eventos ya tiene el estudiante, para no ofrecerle comprar algo
 * que ya compró.
 *
 * La tienda listaba el catálogo sin cruzarlo con nada, así que a alguien que ya
 * había pagado y completado un curso se le seguía ofreciendo a $120 igual que a
 * un desconocido.
 *
 * Se distinguen tres situaciones, no dos:
 *  - `owned`   — hay matrícula, o una orden pagada. Ya es suyo.
 *  - `pending` — hay una solicitud en revisión. Todavía no es suyo, pero
 *                ofrecerle comprarlo otra vez le haría duplicar la solicitud.
 *
 * Se consultan las dos tablas porque no siempre van juntas: la matrícula puede
 * existir sin orden (curso gratuito, alta manual del admin) y la orden pagada
 * puede existir sin matrícula si algo falló al crearla.
 */
export function useOwnedCourses(user) {
  const [owned, setOwned] = useState(() => new Set())
  const [pending, setPending] = useState(() => new Set())
  const [loading, setLoading] = useState(Boolean(user))

  useEffect(() => {
    if (!user) { setOwned(new Set()); setPending(new Set()); setLoading(false); return }
    let cancelled = false
    setLoading(true)

    Promise.all([
      runQuery(
        supabase.from('enrollments').select('course_id').eq('student_id', user.id),
        'useOwnedCourses: matrículas',
      ),
      runQuery(
        supabase.from('orders').select('course_id, status').eq('student_id', user.id),
        'useOwnedCourses: órdenes',
      ),
    ]).then(([enrRes, ordRes]) => {
      if (cancelled) return
      const ownedIds = new Set((enrRes.data || []).map(e => e.course_id))
      const pendingIds = new Set()
      for (const o of ordRes.data || []) {
        if (o.status === 'completed') ownedIds.add(o.course_id)
        else if (o.status === 'pending') pendingIds.add(o.course_id)
      }
      // Una orden pendiente sobre algo que ya es suyo no cuenta como pendiente.
      for (const id of ownedIds) pendingIds.delete(id)
      setOwned(ownedIds)
      setPending(pendingIds)
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [user?.id])

  return { owned, pending, loading }
}
