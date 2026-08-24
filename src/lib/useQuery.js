import { useCallback, useEffect, useState } from 'react'
import { runQuery } from './db'

/**
 * Carga datos al montar y deja el error a la vista.
 *
 * El patrón que sustituye era este, repetido por toda la app:
 *
 *   useEffect(() => {
 *     supabase.from('x').select().then(({ data }) => { setRows(data || []); setLoading(false) })
 *   }, [dep])
 *
 * donde un fallo acababa en `[]` y la pantalla decía «Sin resultados». Aquí el
 * error es un valor devuelto más, al mismo nivel que los datos, así que
 * ignorarlo cuesta más que atenderlo — y `retry` viene ya listo para el botón
 * de <ErrorState/>.
 *
 * @param {Function|null} queryFn  Devuelve el builder de Supabase. `null` para
 *                                 no cargar todavía (p. ej. mientras no hay sesión).
 * @param {Array} deps             Cuándo recargar.
 * @param {string} context         Para el registro: 'OrdersPage: listar órdenes'.
 */
export function useQuery(queryFn, deps, context) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(Boolean(queryFn))
  const [attempt, setAttempt] = useState(0)

  const retry = useCallback(() => setAttempt(a => a + 1), [])

  useEffect(() => {
    if (!queryFn) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    setError(null)

    runQuery(queryFn(), context).then(res => {
      // Si las deps cambiaron mientras volaba la petición, la respuesta vieja
      // ya no vale: escribirla pisaría a la nueva.
      if (cancelled) return
      setData(res.data)
      setError(res.error)
      setLoading(false)
    })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  return { data, error, loading, retry, setData }
}
