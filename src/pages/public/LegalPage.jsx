import { useNavigation } from '../../context/NavigationContext'
import { useSettings } from '../../context/SettingsContext'
import { legalPageFor, mailtoUrl, whatsappUrl, whatsappDisplay } from '../../lib/contactInfo'

/**
 * Términos, privacidad y reembolsos: una sola pantalla para las tres, porque
 * solo cambian el título y la clave de configuración de la que leen.
 *
 * El texto vive en platform_settings para que el cliente pueda ajustarlo sin
 * desplegar — son documentos suyos y con efectos legales.
 *
 * Cuando todavía no hay texto NO se inventa uno: se dice que está en
 * preparación y se ofrece el contacto. Publicar unos términos genéricos
 * redactados por nosotros daría por sentados compromisos que el negocio no ha
 * asumido, que es peor que reconocer que aún no están.
 */
export default function LegalPage() {
  const { screen, navigate } = useNavigation()
  const { settings } = useSettings()
  const page = legalPageFor(screen)
  if (!page) return null

  const body = (settings[page.settingKey] || '').trim()
  const email = settings.contact_email
  const waUrl = whatsappUrl(settings.contact_whatsapp)

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 5% 4rem' }}>
      <button onClick={() => navigate('landing')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Inicio
      </button>

      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.1rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: '0 0 1.5rem' }}>
        {page.label}
      </h1>

      {body ? (
        // whiteSpace: pre-wrap y no HTML: el admin escribe texto plano en el
        // panel, así que se respetan sus saltos de línea sin abrir la puerta a
        // inyectar marcado desde configuración.
        <div style={{ fontSize: '.92rem', color: 'var(--carbon)', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontWeight: 300 }}>
          {body}
        </div>
      ) : (
        <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem 1.75rem' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: '0 0 .5rem' }}>
            Documento en preparación
          </p>
          <p style={{ fontSize: '.88rem', color: 'var(--text-2)', lineHeight: 1.7, margin: 0, fontWeight: 300 }}>
            Todavía no hemos publicado este documento. Si necesitas conocer estas condiciones
            antes de inscribirte, escríbenos y te las explicamos sin compromiso.
          </p>
          {(email || waUrl) && (
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
              {email && (
                <a href={mailtoUrl(email, page.label)}
                  style={{ padding: '.6rem 1.15rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontSize: '.85rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--sans)' }}>
                  {email}
                </a>
              )}
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  style={{ padding: '.6rem 1.15rem', background: 'white', color: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.85rem', fontWeight: 700, textDecoration: 'none', fontFamily: 'var(--sans)' }}>
                  WhatsApp {whatsappDisplay(settings.contact_whatsapp)}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
