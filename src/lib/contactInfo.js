/**
 * Canales de contacto públicos.
 *
 * `contact_email` existía en platform_settings desde hacía tiempo y no se
 * pintaba en ninguna pantalla pública: el dato estaba, nadie lo veía. Esto lo
 * centraliza para que el pie y la ficha de curso muestren lo mismo.
 */

/**
 * WhatsApp se guarda como lo escriba el admin («+506 8888 8888», «8888-8888»…),
 * pero wa.me solo acepta dígitos. Se limpia aquí en vez de exigirle un formato
 * concreto en el panel.
 */
export function whatsappUrl(raw, message) {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return null
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

/** Para enseñar el número tal y como lo escribió el admin. */
export function whatsappDisplay(raw) {
  return (raw || '').trim()
}

export function mailtoUrl(email, subject) {
  if (!email) return null
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`
}

/** ¿Hay algún canal que enseñar? Evita pintar una sección de contacto vacía. */
export function hasContactChannel(settings) {
  return Boolean(settings?.contact_email || whatsappUrl(settings?.contact_whatsapp))
}

/**
 * Las tres páginas legales, en un solo sitio: el pie las enlaza, el registro
 * enlaza a los términos y el enrutador las resuelve. Definirlas por separado en
 * cada punto es cómo se acaba con un enlace que no lleva a ninguna parte.
 */
export const LEGAL_PAGES = [
  { screen: 'terminos',   settingKey: 'legal_terms',   label: 'Términos y condiciones' },
  { screen: 'privacidad', settingKey: 'legal_privacy', label: 'Política de privacidad' },
  { screen: 'reembolsos', settingKey: 'legal_refund',  label: 'Política de reembolso' },
]

export function legalPageFor(screen) {
  return LEGAL_PAGES.find(p => p.screen === screen) || null
}
