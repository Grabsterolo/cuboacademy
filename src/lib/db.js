/**
 * Envoltorio único para las consultas a Supabase.
 *
 * El patrón `.then(({ data }) => setX(data || []))` está por todo el proyecto y
 * tiene un fallo grave: cuando la consulta falla, `data` llega como null, el
 * `|| []` lo convierte en lista vacía y la pantalla dibuja «Sin resultados».
 * El error se disfraza de estado vacío. Un typo en el nombre de una columna
 * dejó dos pantallas rotas durante meses sin que nadie lo notara, porque a
 * simple vista parecían simplemente vacías.
 *
 * JavaScript no puede *obligar* a nadie a desestructurar `error`, así que la
 * garantía se construye en dos capas:
 *
 *  1. Todo fallo se registra siempre en consola con la operación y el
 *     contexto, aunque quien llama lo ignore. Deja de ser invisible.
 *  2. En caso de error `data` vale `null`, nunca `[]`. Una pantalla que siga
 *     haciendo `data || []` seguirá pintando vacío, pero el `error` viaja en el
 *     resultado y la revisión de código lo ve; con `useQuery` + <ErrorState/>
 *     el camino correcto es además el más corto.
 *
 * No lanza excepciones a propósito: obligaría a envolver en try/catch cada
 * llamada, y en los manejadores de eventos de React una excepción no capturada
 * se pierde igual de silenciosamente que el error que intentamos eliminar.
 */

/** Normaliza el error de PostgREST a algo que se pueda enseñar y registrar. */
function normalizeError(error, context) {
  if (!error) return null
  return {
    message: error.message || 'Error desconocido',
    // PostgREST manda `code` (p. ej. 42703 para columna inexistente) y a veces
    // `details`/`hint`, que son lo que de verdad identifica un typo de columna.
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    context,
  }
}

function logError(operation, context, error) {
  // console.error y no warn: esto siempre es un fallo, y así aparece destacado
  // en la pestaña de consola sin tener que subir el nivel de filtro.
  console.error(
    `[db] ${operation} falló${context ? ` — ${context}` : ''}`,
    {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  )
}

/**
 * Ejecuta una lectura.
 *
 * @param {PromiseLike} query  El builder de Supabase, sin await.
 * @param {string} context     Dónde ocurre, para el registro: 'OrdersPage: listar órdenes'.
 * @returns {Promise<{ data: any, error: object|null, ok: boolean }>}
 */
export async function runQuery(query, context) {
  const { data, error } = await query
  if (error) {
    const normalized = normalizeError(error, context)
    logError('consulta', context, normalized)
    // null y no []: quien no mire `error` verá vacío igual, pero nadie puede
    // confundir «falló» con «no hay filas» leyendo el valor devuelto.
    return { data: null, error: normalized, ok: false }
  }
  return { data, error: null, ok: true }
}

/**
 * Ejecuta una escritura (insert/update/delete/upsert).
 *
 * Se separa de runQuery porque en una escritura lo que importa es si salió
 * bien: devolver `ok` evita el `if (error)` invertido que se olvida tan fácil.
 */
export async function runMutation(query, context) {
  const { data, error } = await query
  if (error) {
    const normalized = normalizeError(error, context)
    logError('escritura', context, normalized)
    return { data: null, error: normalized, ok: false }
  }
  return { data, error: null, ok: true }
}

/**
 * Ejecuta una edge function.
 *
 * `functions.invoke` no pone el motivo en `error.message` — lo manda en el
 * cuerpo de la respuesta — así que hay que sacarlo de ahí o el usuario ve
 * «Edge Function returned a non-2xx status code», que no le dice nada.
 */
export async function runFunction(supabase, name, body, context) {
  const { data, error } = await supabase.functions.invoke(name, { body })

  let detail = data?.error || ''
  if (error && !detail) {
    try { detail = (await error.context?.json())?.error || '' } catch { /* sin cuerpo legible */ }
  }

  if (error || detail) {
    const normalized = normalizeError(
      { message: detail || error?.message || 'La función falló.', code: error?.name || null },
      context,
    )
    logError(`función ${name}`, context, normalized)
    return { data: null, error: normalized, ok: false }
  }
  return { data, error: null, ok: true }
}

/** Texto corto para enseñarle al usuario, sin jerga de Postgres. */
export function errorMessage(error, fallback = 'No se pudo completar la operación.') {
  if (!error) return fallback
  // 42501 = violación de RLS. Al usuario «new row violates row-level security
  // policy» no le dice nada; que no tiene permiso, sí.
  if (error.code === '42501') return 'No tienes permiso para hacer esto.'
  if (error.code === 'PGRST116') return 'No se encontró el registro.'
  return error.message || fallback
}
