import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ADMIN_NAV } from '../../../config/navigation'

export default function AnnouncementsPage() {
  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <style>{`@media (max-width: 768px) { .stub-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>
      <div className="stub-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 420 }}>
          <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Esta sección está en construcción</h2>
          <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)', fontWeight: 400 }}>Próximamente disponible</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
