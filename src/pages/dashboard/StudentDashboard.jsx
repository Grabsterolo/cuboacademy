import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  {
    label: 'Mi aprendizaje', path: '/dashboard',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  },
  {
    label: 'Explorar cursos', path: '/cursos',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    label: 'Mis certificados', path: '/dashboard/certificados',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>,
  },
  {
    label: 'Mi perfil', path: '/dashboard/perfil',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
]

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'estudiante').split(' ')[0]

  return (
    <DashboardLayout navItems={navItems}>
      <div style={{ padding: '2.5rem 2.5rem 3rem' }}>
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
            Explora el catálogo y empieza a aprender con formación diseñada por consultores activos.
          </p>
          <Link to="/cursos" style={{ display: 'inline-block', padding: '.75rem 1.75rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 600 }}>
            Explorar catálogo
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}
