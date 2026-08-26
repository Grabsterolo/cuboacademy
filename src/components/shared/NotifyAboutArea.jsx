import { useSettings } from '../../context/SettingsContext'
import { hasContactChannel, mailtoUrl, whatsappUrl } from '../../lib/contactInfo'

/**
 * «Avisarme cuando haya contenido en esta área» — el CTA del estado vacío al
 * filtrar el catálogo por una categoría sin cursos o eventos.
 *
 * No hay lista de espera real detrás: montar una tabla y un flujo de avisos
 * que nadie revisaría en el panel —ni siquiera hay RESEND_API_KEY configurada
 * todavía para que un correo automático salga— sería simular una función que
 * no existe. En vez de eso, el clic abre un mensaje ya redactado al canal de
 * contacto real de la plataforma, el mismo que ya usa ContactBeforeBuy, con
 * el área en el asunto: alguien lo recibe y puede avisar de verdad.
 *
 * Sin ningún canal configurado no se muestra nada — un botón que promete un
 * aviso y no hace nada es peor que no ofrecerlo.
 */
export function NotifyAboutArea({ areaName }) {
  const { settings } = useSettings()
  if (!areaName || !hasContactChannel(settings)) return null

  const subject = `Avísenme: ${areaName}`
  const message = `Hola, me interesa el área de "${areaName}" en Cubo Campus. ¿Podrían avisarme cuando haya cursos o eventos disponibles ahí?`
  const waUrl = whatsappUrl(settings.contact_whatsapp, message)
  const mailUrl = mailtoUrl(settings.contact_email, subject, message)
  const href = waUrl || mailUrl
  if (!href) return null

  return (
    <a href={href} target={waUrl ? '_blank' : undefined} rel={waUrl ? 'noopener noreferrer' : undefined}
      style={{ display: 'inline-flex', alignItems: 'center', padding: '.6rem 1.4rem', background: 'white', color: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--sans)', cursor: 'pointer' }}>
      Avisarme cuando haya contenido en esta área
    </a>
  )
}
