import { supabase } from './supabase'
import { fetchPaymentSettings, buildPaymentEmail } from './paymentInfo'
import { formatEventDateTime } from './formatDate'
import { runFunction } from './db'

/**
 * Enrola a un estudiante en un curso.
 *
 * - Curso gratuito: crea la matrícula directamente.
 * - Curso de pago: crea una orden `pending` para revisión manual del admin.
 *
 * Returns { enrolled, enrollment } | { pendingOrder: true, order } | { error: string }
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

  // La orden se devuelve completa porque quien llama necesita mostrarle al
  // estudiante la referencia y el monto: sin eso, «solicitud enviada» no le
  // dice cómo pagar.
  const { data: order, error } = await supabase
    .from('orders')
    .insert({ student_id: userId, course_id: course.id, amount: Number(course.price), status: 'pending' })
    .select('id, amount, currency, status, created_at')
    .single()
  if (error) return { error: 'No se pudo enviar la solicitud. Intenta de nuevo.' }

  sendPaymentInstructionsEmail({ userId, course, order })

  return { pendingOrder: true, order }
}

/**
 * Correo con las instrucciones de pago. Best-effort deliberado, igual que el
 * resto de correos de la plataforma: si falla, el estudiante ya tiene las
 * mismas instrucciones en el modal y en «Mis compras», así que no tiene
 * sentido bloquear ni hacer fallar la inscripción por esto.
 */
function sendPaymentInstructionsEmail({ userId, course, order }) {
  fetchPaymentSettings()
    .then(settings => runFunction(supabase, 'send-notification-email', {
        recipientId: userId,
        type: 'purchase',
        subject: `Cómo completar tu pago · ${course.title}`,
        message: buildPaymentEmail({
          courseTitle: course.title,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          settings,
          // Solo los eventos tienen fecha; un curso en línea no la necesita.
          schedule: course.type === 'event' ? formatEventDateTime(course.event_start_at, course.event_end_at, course) : null,
        }),
    }, 'enrollCourse: correo de instrucciones de pago'))
    // Sigue siendo best-effort — el estudiante ya tiene las instrucciones en el
    // modal y en «Mis compras» —, pero runFunction deja constancia del fallo.
    .catch(() => {})
}
