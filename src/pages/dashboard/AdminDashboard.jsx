import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_NAV } from '../../config/navigation'

const METRICS = [
  { label: 'Total usuarios', value: '—', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos publicados', value: '—', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Órdenes', value: '—', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg> },
  { label: 'Ingresos', value: '—', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
]

export default function AdminDashboard() {
  const { profile, user } = useAuth()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'admin').split(' ')[0]

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <div style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Panel administrativo</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>
            Hola, {firstName}
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {METRICS.map(m => (
            <div key={m.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.6rem', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div style={{ width: 40, height: 40, background: 'var(--jade-soft)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{m.value}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.25rem', fontWeight: 400 }}>{m.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
