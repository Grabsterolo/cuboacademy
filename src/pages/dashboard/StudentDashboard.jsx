import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { STUDENT_NAV } from '../../config/navigation'

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const { settings } = useSettings()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'estudiante').split(' ')[0]

  return (
    <DashboardLayout navItems={STUDENT_NAV}>
      <style>{`@media (max-width: 768px) { .std-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>
      <div className="std-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Bienvenido de vuelta</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>
            Hola, {firstName}
          </h1>
        </div>

        {/* Empty state */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 60, height: 60, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.5rem' }}>
            Todavía no tienes cursos
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '1.5rem', fontWeight: 300 }}>
            {settings.welcome_message || 'Explora el catálogo y empieza a aprender con formación diseñada por consultores activos.'}
          </p>
          <Link to="/cursos" style={{ display: 'inline-block', padding: '.75rem 1.75rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 600 }}>
            Explorar catálogo
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
