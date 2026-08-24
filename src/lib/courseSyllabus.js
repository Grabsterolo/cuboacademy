import { supabase } from './supabase'

/**
 * Temario público de un curso a partir de su slug.
 *
 * Va por `course_syllabus_by_slug` en vez de leer `modules` y
 * `lessons_syllabus_preview`: ambas pasan por la RLS de `courses`, que a un
 * visitante no matriculado solo le entrega los cursos «published + public».
 * Un curso `unlisted` — accesible por enlace pero fuera del catálogo — cargaba
 * así la ficha con el acordeón vacío. La función aplica la misma regla de
 * visibilidad que `course_by_slug` y devuelve solo título, duración y orden.
 *
 * Devuelve `[{ id, title, order_index, lessons: [{ id, title, duration_mins,
 * order_index }] }]`, ya ordenado; vacío si el curso no es visible.
 */
export async function fetchCourseSyllabus(slug) {
  const { data, error } = await supabase.rpc('course_syllabus_by_slug', { p_slug: slug })
  if (error || !data) return []

  // Una fila por lección; los módulos sin lecciones llegan con lesson_id nulo.
  const byModule = new Map()
  for (const row of data) {
    let mod = byModule.get(row.module_id)
    if (!mod) {
      mod = { id: row.module_id, title: row.module_title, order_index: row.module_order, lessons: [] }
      byModule.set(row.module_id, mod)
    }
    if (row.lesson_id) {
      mod.lessons.push({
        id: row.lesson_id,
        title: row.lesson_title,
        duration_mins: row.lesson_duration_mins,
        order_index: row.lesson_order,
      })
    }
  }
  return [...byModule.values()]
}
