import { Link } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'

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

export default function Footer() {
  const { settings } = useSettings()
  const contactEmail = settings.contact_email || 'contacto@cuboacademy.com'
  const hasSocial = settings.social_instagram || settings.social_linkedin || settings.social_youtube

  return (
    <footer style={{ background: 'white', borderTop: '1px solid var(--border)', padding: '1.5rem 5%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.75rem' }}>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700 }}>
          <span style={{ color: 'var(--carbon)' }}>Cubo </span>
          <span style={{ color: 'var(--jade)' }}>Academy</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link to="/cursos" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Cursos</Link>
          <Link to="/instructores" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Instructores</Link>
          <Link to="#" style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 400 }}>Términos</Link>
          <a href={`mailto:${contactEmail}`} style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 400 }}>{contactEmail}</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {hasSocial && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)', display: 'flex', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  {INSTAGRAM_ICON}
                </a>
              )}
              {settings.social_linkedin && (
                <a href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)', display: 'flex', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  {LINKEDIN_ICON}
                </a>
              )}
              {settings.social_youtube && (
                <a href={settings.social_youtube} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-2)', display: 'flex', transition: 'color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                  {YOUTUBE_ICON}
                </a>
              )}
            </div>
          )}
          <span style={{ fontSize: '.74rem', color: '#B5B2AB' }}>© 2025 Grupo Cubo 130 S.A.</span>
        </div>
      </div>
    </footer>
  )
}
