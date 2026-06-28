import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { INSTRUCTOR_NAV } from '../../../config/navigation'

export default function InstructorEarningsPage() {
  return (
    <DashboardLayout navItems={INSTRUCTOR_NAV}>
      <style>{`@media (max-width: 768px) { .stub-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>
      <div className="stub-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Mis ganancias</h1>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 420 }}>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Esta sección está en construcción</h2>
          <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)', fontWeight: 400 }}>Próximamente disponible</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
