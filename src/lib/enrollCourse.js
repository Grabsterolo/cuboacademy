import { supabase } from './supabase'

/**
 * Enrola a un estudiante en un curso.
 *
 * - Curso gratuito: crea la matrícula directamente.
 * - Curso de pago: crea una orden `pending` para revisión manual del admin.
 *
 * Returns { enrolled, enrollment } | { pendingOrder: true } | { error: string }
 */
export async function enrollCourse({ userId, course }) {
  const isFree = !course.price || Number(course.price) === 0

  if (isFree) {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({ student_id: userId, course_id: course.id, enrolled_at: new Date().toISOString() })
      .select('id, enrolled_at, completed_at')
      .single()
    if (error) return { error: 'No se pudo completar la inscripción. Intenta de nuevo.' }
    return { enrolled: true, enrollment: data }
  }

  const { error } = await supabase
    .from('orders')
    .insert({ student_id: userId, course_id: course.id, amount: Number(course.price), status: 'pending' })
  if (error) return { error: 'No se pudo enviar la solicitud. Intenta de nuevo.' }
  return { pendingOrder: true }
}
