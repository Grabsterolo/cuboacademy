import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateProgressByCourse } from './progress'

/**
 * El porcentaje de progreso lo comparten el panel del estudiante y «Mis
 * cursos». Existe una sola función justamente para que las dos pantallas no
 * respondan números distintos, así que vale la pena fijar su aritmética.
 */

/**
 * Supabase falso. Solo necesita encadenar y ser awaitable: `runQuery` hace
 * `await query` y desestructura `{ data, error }`.
 *
 * El aviso de `no-thenable` es un falso positivo aquí: el builder real de
 * Supabase es thenable, así que el doble tiene que serlo para parecerse a él.
 */
function fakeSupabase(porTabla) {
  return {
    from(tabla) {
      const builder = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        // eslint-disable-next-line unicorn/no-thenable
        then: resolve => resolve(porTabla[tabla] ?? { data: [], error: null }),
      }
      return builder
    },
  }
}

/** Atajo: módulos de un curso con N lecciones de ids predecibles. */
function modulos(cursoId, ...idsLecciones) {
  return { course_id: cursoId, lessons: idsLecciones.map(id => ({ id })) }
}

let errorSpy
beforeEach(() => { errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { errorSpy.mockRestore() })

describe('calculateProgressByCourse', () => {
  it('sin cursos no consulta nada', async () => {
    const supabase = fakeSupabase({})
    expect(await calculateProgressByCourse(supabase, 'u1', [])).toEqual({})
    expect(await calculateProgressByCourse(supabase, 'u1', null)).toEqual({})
  })

  it('calcula el porcentaje de lecciones completadas', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2', 'l3', 'l4')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 50 })
  })

  it('un curso sin empezar está al 0 %, no sin definir', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2')], error: null },
      lesson_progress: { data: [], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 0 })
  })

  it('un curso terminado está al 100 %', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 100 })
  })

  it('un curso SIN lecciones da 0, no NaN', async () => {
    // total = 0 ⇒ una división directa daría NaN y la pantalla pintaría
    // «NaN%». El guardarraíl está en la función; esto lo fija.
    const supabase = fakeSupabase({
      modules: { data: [{ course_id: 'c1', lessons: [] }], error: null },
      lesson_progress: { data: [], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 0 })
  })

  it('reparte el progreso por curso sin mezclarlos', async () => {
    const supabase = fakeSupabase({
      modules: {
        data: [modulos('c1', 'l1', 'l2'), modulos('c2', 'l3', 'l4')],
        error: null,
      },
      // l1 es de c1 y l3 de c2: cada uno debe quedar al 50 %, no uno al 100.
      lesson_progress: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l3' }], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1', 'c2'])).toEqual({ c1: 50, c2: 50 })
  })

  it('suma las lecciones de todos los módulos del curso', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2'), modulos('c1', 'l3')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 33 })
  })

  it('redondea a entero', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2', 'l3')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 67 }) // 66,6…
  })

  it('un curso pedido del que no vuelven módulos queda a 0', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }], error: null },
    })
    // c2 se pidió pero no tiene módulos: debe aparecer con 0, no desaparecer
    // del resultado (la pantalla lo pintaría como undefined).
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1', 'c2'])).toEqual({ c1: 100, c2: 0 })
  })

  it('si falla la consulta de módulos devuelve 0, sin reventar', async () => {
    const supabase = fakeSupabase({
      modules: { data: null, error: { message: 'boom', code: '42703' } },
      lesson_progress: { data: [], error: null },
    })
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 0 })
    // Y el fallo deja rastro, no se pierde.
    expect(errorSpy).toHaveBeenCalled()
  })

  // ── Divergencia conocida, fijada a propósito ─────────────────────────────
  //
  // Esta función cuenta TODAS las lecciones, incluidas las del módulo
  // «Evaluación Final». El servidor, en toggle_lesson_progress, las excluye al
  // decidir si la matrícula se completa. No son la misma pregunta —aquí es
  // «cuánto llevas visto», allí «¿ya terminaste?»— pero conviene que quede
  // escrito, para que quien cambie una de las dos sepa que existe la otra.

  it('cuenta también la lección del examen final (a diferencia del servidor)', async () => {
    const supabase = fakeSupabase({
      modules: { data: [modulos('c1', 'l1', 'l2'), modulos('c1', 'examen')], error: null },
      lesson_progress: { data: [{ lesson_id: 'l1' }, { lesson_id: 'l2' }], error: null },
    })
    // 2 de 3, no 2 de 2: la lección del examen entra en el denominador.
    expect(await calculateProgressByCourse(supabase, 'u1', ['c1'])).toEqual({ c1: 67 })
  })
})
