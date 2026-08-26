import { supabase } from './supabase'
import { runMutation, runQuery, runFunction, errorMessage } from './db'
import { formatEventDateTime } from './formatDate'

/**
 * Cancela un evento y avisa a quien se había inscrito.
 *
 * El orden importa: primero se marca la cancelación, después se notifica. Si
 * fuera al revés y el guardado fallara, habríamos avisado de una cancelación
 * que no ocurrió.
 *
 * El aviso es best-effort, como el resto de correos de la plataforma. Un fallo
 * de correo no debe dejar el evento a medio cancelar —abierto a inscripciones—
 * que es lo peor de los dos mundos.
 */
export async function cancelEvent({ event, reason }) {
  const trimmed = (reason || '').trim()

  const { ok, error } = await runMutation(
    supabase.from('courses')
      .update({ cancelled_at: new Date().toISOString(), cancellation_reason: trimmed || null })
      .eq('id', event.id),
    'cancelEvent: marcar cancelado',
  )
  if (!ok) return { error: errorMessage(error) }

  const { data: enrolled } = await runQuery(
    supabase.from('enrollments').select('student_id').eq('course_id', event.id),
    'cancelEvent: matriculados a avisar',
  )
  // También quien tiene una solicitud pendiente: pagó o estaba por pagar, y es
  // justo a quien peor le sentaría enterarse por su cuenta.
  const { data: pending } = await runQuery(
    supabase.from('orders').select('student_id').eq('course_id', event.id).eq('status', 'pending'),
    'cancelEvent: solicitudes pendientes a avisar',
  )

  const ids = [...new Set([...(enrolled || []), ...(pending || [])].map(r => r.student_id))]

  await Promise.allSettled(ids.map(id => runFunction(supabase, 'send-notification-email', {
    recipientId: id,
    // 'reminder' y no 'event_cancelled': la edge function desplegada valida el
    // tipo contra su propia lista y rechaza los que no conoce con «Faltan
    // campos requeridos». Su código no está en este repo, así que no se puede
    // ampliar desde aquí. El valor 'event_cancelled' ya existe en el enum
    // email_type esperando a que la función se actualice; hasta entonces, el
    // asunto y el cuerpo son los que llevan el significado.
    type: 'reminder',
    subject: `Evento cancelado · ${event.title}`,
    message: buildCancellationEmail({ title: event.title, reason: trimmed, schedule: formatEventDateTime(event.event_start_at, event.event_end_at, event) }),
  }, 'cancelEvent: aviso de cancelación')))

  return { ok: true, notified: ids.length }
}

function buildCancellationEmail({ title, reason, schedule }) {
  const motivo = reason
    ? `\n\nMotivo: ${reason}`
    : ''
  // La fecha ayuda a ubicar cuál convocatoria se canceló, sobre todo si el
  // destinatario tiene más de un evento con nosotros a la vez.
  const cuando = schedule ? ` programado para el ${schedule}` : ''
  return `Lamentamos informarte de que el evento «${title}»${cuando} ha sido cancelado.${motivo}
\nSi habías completado el pago, nos pondremos en contacto contigo para gestionar la devolución.
\nSentimos las molestias.`
}

/** Deshace la cancelación. No notifica: se avisa cuando se vuelva a publicar. */
export async function uncancelEvent(event) {
  const { ok, error } = await runMutation(
    supabase.from('courses')
      .update({ cancelled_at: null, cancellation_reason: null })
      .eq('id', event.id),
    'cancelEvent: reactivar',
  )
  return ok ? { ok: true } : { error: errorMessage(error) }
}
