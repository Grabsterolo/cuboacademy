import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import ChangePasswordRow from '../../../components/dashboard/ChangePasswordRow'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'

function Card({ title, desc, children, span }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: '.79rem', color: 'var(--text-2)', margin: '.25rem 0 0', fontWeight: 400, lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ padding: '0 1.75rem' }}>{children}</div>
    </div>
  )
}

function Row({ label, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1.1rem 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 300 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()

  return (
    <DashboardLayout>
      <style>{`
        .cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 900px) { .cfg-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .cfg-pad { padding: 1.25rem 1rem 2rem !important; } }
      `}</style>

      <div className="cfg-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Configuración</h1>
        </div>

        <div className="cfg-grid">

          {/* Cuenta */}
          <Card title="Cuenta" desc="Información de acceso y seguridad de tu cuenta.">
            <Row label="Correo electrónico" desc={user?.email || '—'}>
              <span style={{ fontSize: '.76rem', color: 'var(--text-3)', background: 'var(--cream)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>No editable</span>
            </Row>
            <ChangePasswordRow />
          </Card>

          {/* Perfil */}
          <Card title="Mi perfil" desc="Información personal visible en la plataforma.">
            <Row label="Editar información" desc="Nombre, foto de perfil, país y más." last>
              <button onClick={() => navigate('perfil')}
                style={{ padding: '.45rem 1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Ir a Mi perfil →
              </button>
            </Row>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  )
}
