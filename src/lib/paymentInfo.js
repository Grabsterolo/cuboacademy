import { supabase } from './supabase'
import { runQuery } from './db'

/**
 * Datos e instrucciones del pago manual.
 *
 * No hay pasarela: el estudiante paga por SINPE Móvil o transferencia y envía
 * el comprobante, y un admin activa el acceso. Todo lo que el estudiante ve
 * (modal de confirmación, correo, «Mis compras») se arma aquí, para que las
 * tres superficies no se desincronicen cuando el admin edite la configuración.
 */

export const PAYMENT_SETTING_KEYS = [
  'payment_instructions',
  'sinpe_number',
  'bank_account',
  'payment_note',
]

/**
 * Etiquetas legibles del medio de pago.
 *
 * La columna guarda el valor del enum en minúscula («sinpe», «transferencia»),
 * que no es texto para enseñarle a nadie: el recibo llegó a imprimir «paypal»
 * tal cual, un medio que además no existe en la plataforma.
 *
 * `paypal` y `stripe` se mantienen porque siguen en el enum y hay órdenes
 * históricas que podrían tenerlos; no significa que estén integrados.
 */
export const PAYMENT_PROVIDER_LABEL = {
  manual:        'Pago manual',
  sinpe:         'SINPE Móvil',
  transferencia: 'Transferencia bancaria',
  paypal:        'PayPal',
  stripe:        'Stripe',
}

/** Medios que el admin puede elegir al aprobar. Sin pasarelas: no hay ninguna. */
export const SELECTABLE_PROVIDERS = ['sinpe', 'transferencia', 'manual']

/**
 * Nunca devuelve el valor crudo: si apareciera uno desconocido, es preferible
 * un guion a imprimir un identificador interno en un recibo.
 */
export function paymentProviderLabel(provider) {
  return PAYMENT_PROVIDER_LABEL[provider] || '—'
}

/**
 * Referencia corta que el estudiante escribe en el detalle de la transferencia
 * y que el admin ve en el listado de órdenes. Derivada del id para que ambos
 * lados la calculen igual sin una columna extra.
 */
export function orderReference(orderId) {
  return orderId ? orderId.slice(0, 8).toUpperCase() : ''
}

export function formatAmount(amount, currency = 'USD') {
  return `${Number(amount || 0).toFixed(2)} ${currency || 'USD'}`
}

/**
 * Se consulta en el momento de usarse en vez de leer SettingsContext: el
 * contexto carga una sola vez al montar la app, y con RLS estas claves solo
 * son visibles para usuarios autenticados — quien abrió la página sin sesión
 * y luego inició sesión tendría el contexto sin los datos de pago.
 */
export async function fetchPaymentSettings() {
  const { data } = await runQuery(
    supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', [...PAYMENT_SETTING_KEYS, 'contact_email']),
    'paymentInfo: datos de pago',
  )
  const map = {}
  for (const row of data || []) map[row.key] = row.value
  return map
}

/** ¿Hay al menos un medio de pago configurado por el admin? */
export function hasPaymentChannels(settings) {
  return Boolean(settings?.sinpe_number || settings?.bank_account)
}

/**
 * Cuerpo en texto plano del correo. La edge function convierte los saltos de
 * línea en <br/>, así que se compone como texto y no como HTML.
 */
export function buildPaymentEmail({ courseTitle, orderId, amount, currency, settings, schedule }) {
  const ref = orderReference(orderId)
  const to = settings.contact_email
  const lines = [
    `Recibimos tu solicitud de inscripción para "${courseTitle}".`,
  ]
  // Solo los eventos tienen una fecha fija que perder de vista. Sin esto, el
  // correo de un evento de pago no decía cuándo era: la persona sabía que
  // había pedido algo, pero no qué día presentarse.
  if (schedule) lines.push('', `Fecha: ${schedule}`)
  lines.push(
    '',
    `Referencia: ${ref}`,
    `Monto: ${formatAmount(amount, currency)}`,
    '',
    'Para completar tu inscripción, realiza el pago por uno de estos medios:',
  )
  if (settings.sinpe_number) lines.push(`· SINPE Móvil: ${settings.sinpe_number}`)
  if (settings.bank_account) lines.push(`· Cuenta bancaria: ${settings.bank_account}`)
  if (!hasPaymentChannels(settings)) {
    lines.push(
      to
        ? `· Escríbenos a ${to} y te indicamos los medios de pago disponibles.`
        : '· Escríbenos y te indicamos los medios de pago disponibles.',
    )
  }
  if (settings.payment_instructions) {
    lines.push('', settings.payment_instructions)
  }
  lines.push('')
  lines.push(
    to
      ? `Incluye la referencia ${ref} en el detalle de la transferencia y envía el comprobante a ${to}.`
      : `Incluye la referencia ${ref} en el detalle de la transferencia y envíanos el comprobante.`,
  )
  if (settings.payment_note) lines.push('', settings.payment_note)
  return lines.join('\n')
}
