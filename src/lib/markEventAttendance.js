import { supabase } from './supabase'

/**
 * Marca (o revierte) la asistencia de un estudiante a un evento.
 *
 * Poner `completed_at` dispara el mismo trigger que usan los cursos
 * (`certificate_on_completion_trigger`) — si el evento tiene certificado,
 * se crea automáticamente una fila `pending` en `certificates`.
 */
export async function markEventAttendance({ enrollmentId, attended }) {
  const { data, error } = await supabase
    .from('enrollments')
    .update({ completed_at: attended ? new Date().toISOString() : null })
    .eq('id', enrollmentId)
    .select('id, completed_at')
    .single()
  if (error) return { error: 'No se pudo actualizar la asistencia. Intenta de nuevo.' }
  return { enrollment: data }
}
