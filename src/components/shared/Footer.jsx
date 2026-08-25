import { useSettings } from '../../context/SettingsContext'
import { useNavigation } from '../../context/NavigationContext'
import { LEGAL_PAGES, whatsappUrl, whatsappDisplay, mailtoUrl } from '../../lib/contactInfo'

const INSTAGRAM_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>
  </svg>
)

const LINKEDIN_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
)

const YOUTUBE_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none"/>
  </svg>
)

const WHATSAPP_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.06 2.86 1.21 3.06c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z"/>
    <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.05-1.32A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3 .78.8-2.92-.19-.31A8.2 8.2 0 1 1 12 20.2z"/>
  </svg>
)

export default function Footer() {
  const { settings } = useSettings()
  const { navigate } = useNavigation()
  const hasSocial = settings.social_instagram || settings.social_linkedin || settings.social_youtube
  const email = settings.contact_email
  const waUrl = whatsappUrl(settings.contact_whatsapp)
  // El año se calculaba a mano y se quedó en 2025; en agosto de 2026 el pie
  // seguía diciendo «© 2025», que es justo lo contrario de una señal de
  // confianza en la pantalla donde alguien decide pagar.
  const year = new Date().getFullYear()

  const linkStyle = {
    fontSize: '.78rem', color: 'var(--text-2)', background: 'none', border: 'none',
    padding: 0, cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', textDecoration: 'none',
  }

  return (
    <footer style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '2.25rem 5% 1.5rem' }}>
      <style>{`
        .footer-cols { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto 1.75rem; }
        .footer-link:hover { color: var(--jade) !important; }
        @media (max-width: 720px) {
          .footer-cols { grid-template-columns: 1fr !important; gap: 1.5rem !important; }
          .footer-bottom { flex-direction: column !important; align-items: flex-start !important; gap: .75rem !important; }
        }
      `}</style>

      <div className="footer-cols">
        {/* Marca */}
        <div>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--carbon)' }}>Cubo </span>
            <span style={{ color: 'var(--jade)' }}>Campus</span>
          </span>
          {settings.platform_description && (
            <p style={{ fontSize: '.78rem', color: 'var(--text-2)', lineHeight: 1.6, margin: '.5rem 0 0', maxWidth: 320, fontWeight: 300 }}>
              {settings.platform_description}
            </p>
          )}
          {hasSocial && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginTop: '.9rem' }}>
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-link" style={{ color: 'var(--text-2)', display: 'flex' }}>{INSTAGRAM_ICON}</a>
              )}
              {settings.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="footer-link" style={{ color: 'var(--text-2)', display: 'flex' }}>{LINKEDIN_ICON}</a>
              )}
              {settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="footer-link" style={{ color: 'var(--text-2)', display: 'flex' }}>{YOUTUBE_ICON}</a>
              )}
            </div>
          )}
        </div>

        {/* Contacto — solo los canales realmente configurados */}
        {(email || waUrl) && (
          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--carbon)', marginBottom: '.7rem' }}>Contacto</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {email && (
                <a href={mailtoUrl(email)} className="footer-link" style={linkStyle}>{email}</a>
              )}
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="footer-link" style={{ ...linkStyle, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  {WHATSAPP_ICON} WhatsApp {whatsappDisplay(settings.contact_whatsapp)}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Legal */}
        <div>
          <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--carbon)', marginBottom: '.7rem' }}>Legal</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {LEGAL_PAGES.map(p => (
              <button key={p.screen} onClick={() => navigate(p.screen)} className="footer-link" style={linkStyle}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-bottom" style={{ maxWidth: 1200, margin: '0 auto', paddingTop: '1.1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
        <span style={{ fontSize: '.74rem', color: '#B5B2AB' }}>© {year} Grupo Cubo 130 S.A.</span>
      </div>
    </footer>
  )
}
