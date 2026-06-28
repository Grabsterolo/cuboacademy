import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { INSTRUCTOR_NAV } from '../../config/navigation'

export default function InstructorDashboard() {
  const { profile, user } = useAuth()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'instructor').split(' ')[0]

  return (
    <DashboardLayout navItems={INSTRUCTOR_NAV}>
      <div style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Panel de instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>
            Hola, {firstName}
          </h1>
        </div>

        {/* Empty state */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 480 }}>
          <div style={{ width: 60, height: 60, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.5rem' }}>
            Crea tu primer curso
          </h2>
          <p style={{ fontSize: '.85rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '1.5rem', fontWeight: 300 }}>
            Comparte tu experiencia consultiva con profesionales que quieren aprender desde la práctica real.
          </p>
          <button style={{ display: 'inline-block', padding: '.75rem 1.75rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
            Crear curso
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
