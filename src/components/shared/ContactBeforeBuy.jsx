import { useSettings } from '../../context/SettingsContext'
import { hasContactChannel, mailtoUrl, whatsappUrl, whatsappDisplay } from '../../lib/contactInfo'

/**
 * Vía de contacto junto al botón de compra.
 *
 * En la ficha es donde alguien decide gastar $120, y hasta ahora no había forma
 * de preguntar nada desde ahí: ni el pie salía en esta pantalla ni el correo de
 * contacto se pintaba en ningún sitio. Quien dudaba, se iba.
 *
 * No se dibuja nada si el admin no ha configurado ningún canal: una sección de
 * ayuda sin manera de pedirla es peor que no tenerla.
 */
export function ContactBeforeBuy({ subject }) {
  const { settings } = useSettings()
  if (!hasContactChannel(settings)) return null

  const email = settings.contact_email
  const waUrl = whatsappUrl(settings.contact_whatsapp, subject ? `Hola, tengo una consulta sobre "${subject}".` : undefined)

  return (
    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
      <p style={{ fontSize: '.78rem', color: 'var(--text-2)', margin: '0 0 .6rem', lineHeight: 1.5 }}>
        ¿Dudas antes de inscribirte? Te respondemos.
      </p>
      <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .8rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', textDecoration: 'none', fontFamily: 'var(--sans)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.05-1.32A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3 .78.8-2.92-.19-.31A8.2 8.2 0 1 1 12 20.2z"/></svg>
            WhatsApp {whatsappDisplay(settings.contact_whatsapp)}
          </a>
        )}
        {email && (
          <a href={mailtoUrl(email, subject ? `Consulta sobre ${subject}` : undefined)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .8rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', textDecoration: 'none', fontFamily: 'var(--sans)' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg>
            Escríbenos
          </a>
        )}
      </div>
    </div>
  )
}
