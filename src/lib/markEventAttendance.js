import { supabase } from './supabase'
import { runMutation, errorMessage } from './db'

/**
 * Marca (o revierte) la asistencia de un estudiante a un evento.
 *
 * `completed_at` es la única señal de asistencia que hay, y la base reacciona a
 * ella en los dos sentidos:
 *
 *  - al ponerla, `create_certificate_on_completion` crea el certificado
 *    `pending` si el evento lleva certificado;
 *  - al quitarla, `revoke_certificate_on_attendance_revert` lo retira — borra el
 *    que aún no se había aprobado y pasa a `rejected` el ya emitido, que no se
 *    puede hacer desaparecer porque tiene código de verificación público.
 *
 * Por eso aquí no hay nada que limpiar a mano: basta con escribir la fecha.
 */
export async function markEventAttendance({ enrollmentId, attended }) {
  const { data, error, ok } = await runMutation(
    supabase
      .from('enrollments')
      .update({ completed_at: attended ? new Date().toISOString() : null })
      .eq('id', enrollmentId)
      .select('id, completed_at')
      .single(),
    'markEventAttendance: registrar asistencia',
  )
  // Antes esto devolvía siempre «Intenta de nuevo», que es el peor consejo
  // posible cuando el motivo es que no tienes permiso o que el evento cambió:
  // repetir no arregla ninguno de los dos. errorMessage ya traduce lo que hay
  // que traducir (42501 → «No tienes permiso para hacer esto»).
  if (!ok) return { error: errorMessage(error, 'No se pudo actualizar la asistencia.') }
  return { enrollment: data }
}
