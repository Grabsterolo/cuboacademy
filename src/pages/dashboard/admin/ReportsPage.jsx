import DashboardLayout from '../../../components/dashboard/DashboardLayout'

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <style>{`@media (max-width: 768px) { .stub-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>
      <div className="stub-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Análisis</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Reportes</h1>
        </div>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Esta sección está en construcción</h2>
          <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)', fontWeight: 400 }}>Próximamente disponible</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
