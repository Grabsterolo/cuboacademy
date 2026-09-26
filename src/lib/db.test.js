import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runQuery, runMutation, runFunction, errorMessage } from './db'

/**
 * db.js es la pieza de la que depende todo el manejo de errores de la app, y
 * su garantía central es una sola: **en caso de error, `data` vale `null`,
 * nunca `[]`**.
 *
 * Ese detalle es el que impide que un fallo se disfrace de estado vacío, que
 * es lo que dejó dos pantallas rotas durante meses. Si alguien «simplifica»
 * ese null a `[]` para ahorrarse un condicional, estas pruebas se caen.
 */

/**
 * Un builder de Supabase falso: lo único que importa es que sea awaitable.
 *
 * El aviso de `no-thenable` es correcto como regla general y un falso positivo
 * aquí: el builder de Supabase ES thenable —`await supabase.from(...)` es su
 * forma normal de uso— así que el doble tiene que serlo para parecerse a él.
 */
// eslint-disable-next-line unicorn/no-thenable
const consulta = resultado => ({ then: resolve => resolve(resultado) })

let errorSpy
beforeEach(() => { errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { errorSpy.mockRestore() })

describe('runQuery', () => {
  it('devuelve los datos cuando la consulta va bien', async () => {
    const res = await runQuery(consulta({ data: [{ id: 1 }], error: null }), 'prueba')
    expect(res).toMatchObject({ ok: true, error: null })
    expect(res.data).toEqual([{ id: 1 }])
  })

  it('en error devuelve data NULL, nunca lista vacía', async () => {
    // El corazón del asunto: `[]` haría que la pantalla dijera «Sin
    // resultados» y nadie se enteraría de que la consulta falló.
    const res = await runQuery(consulta({ data: null, error: { message: 'boom' } }), 'prueba')
    expect(res.data).toBeNull()
    expect(res.data).not.toEqual([])
    expect(res.ok).toBe(false)
  })

  it('conserva code, details y hint, que son los que identifican el fallo', async () => {
    const res = await runQuery(consulta({
      data: null,
      error: { message: 'column x does not exist', code: '42703', details: 'd', hint: 'h' },
    }), 'OrdersPage: listar órdenes')
    expect(res.error).toMatchObject({ code: '42703', details: 'd', hint: 'h', context: 'OrdersPage: listar órdenes' })
  })

  it('registra siempre el fallo, aunque quien llama lo ignore', async () => {
    // La segunda capa de la garantía: el error deja rastro en consola aunque
    // el código que llama no mire el valor devuelto.
    await runQuery(consulta({ data: null, error: { message: 'boom' } }), 'ctx')
    expect(errorSpy).toHaveBeenCalledOnce()
    expect(errorSpy.mock.calls[0][0]).toContain('ctx')
  })

  it('no lanza excepciones', async () => {
    // A propósito: en un manejador de eventos de React una excepción no
    // capturada se pierde igual de silenciosamente que el error original.
    await expect(runQuery(consulta({ data: null, error: { message: 'boom' } }), 'ctx')).resolves.toBeDefined()
  })

  it('un error sin mensaje no deja al usuario sin explicación', async () => {
    const res = await runQuery(consulta({ data: null, error: {} }), 'ctx')
    expect(res.error.message).toBe('Error desconocido')
  })
})

describe('runMutation', () => {
  it('marca ok en una escritura correcta', async () => {
    const res = await runMutation(consulta({ data: [{ id: 1 }], error: null }), 'ctx')
    expect(res.ok).toBe(true)
  })

  it('marca ok=false y data null cuando falla', async () => {
    const res = await runMutation(consulta({ data: null, error: { message: 'no' } }), 'ctx')
    expect(res).toMatchObject({ ok: false })
    expect(res.data).toBeNull()
  })
})

describe('runFunction', () => {
  it('saca el motivo del cuerpo, no del mensaje genérico', async () => {
    // functions.invoke no pone el motivo en error.message — lo manda en el
    // cuerpo. Sin esto el usuario ve «Edge Function returned a non-2xx status
    // code», que no le dice nada.
    const supabase = {
      functions: {
        invoke: async () => ({
          data: null,
          error: { message: 'Edge Function returned a non-2xx status code', context: { json: async () => ({ error: 'Faltan campos requeridos' }) } },
        }),
      },
    }
    const res = await runFunction(supabase, 'send-notification-email', {}, 'ctx')
    expect(res.ok).toBe(false)
    expect(res.error.message).toBe('Faltan campos requeridos')
  })

  it('trata como fallo un 200 que trae error en el cuerpo', async () => {
    const supabase = { functions: { invoke: async () => ({ data: { error: 'No autorizado' }, error: null }) } }
    const res = await runFunction(supabase, 'f', {}, 'ctx')
    expect(res.ok).toBe(false)
    expect(res.error.message).toBe('No autorizado')
  })

  it('devuelve los datos cuando todo va bien', async () => {
    const supabase = { functions: { invoke: async () => ({ data: { pdfUrl: 'x' }, error: null }) } }
    const res = await runFunction(supabase, 'f', {}, 'ctx')
    expect(res).toMatchObject({ ok: true })
    expect(res.data).toEqual({ pdfUrl: 'x' })
  })

  it('aguanta un cuerpo de error ilegible', async () => {
    const supabase = {
      functions: {
        invoke: async () => ({ data: null, error: { message: 'falló', context: { json: async () => { throw new Error('no es JSON') } } } }),
      },
    }
    const res = await runFunction(supabase, 'f', {}, 'ctx')
    expect(res.ok).toBe(false)
    expect(res.error.message).toBe('falló')
  })
})

describe('errorMessage', () => {
  it('traduce la violación de RLS a algo que se entienda', () => {
    // «new row violates row-level security policy» no le dice nada a nadie.
    expect(errorMessage({ code: '42501' })).toBe('No tienes permiso para hacer esto.')
  })

  it('traduce el registro no encontrado', () => {
    expect(errorMessage({ code: 'PGRST116' })).toBe('No se encontró el registro.')
  })

  it('usa el mensaje del error cuando no hay traducción', () => {
    expect(errorMessage({ code: 'XX000', message: 'algo pasó' })).toBe('algo pasó')
  })

  it('cae al texto de respaldo sin error', () => {
    expect(errorMessage(null, 'No se pudo guardar.')).toBe('No se pudo guardar.')
  })
})
