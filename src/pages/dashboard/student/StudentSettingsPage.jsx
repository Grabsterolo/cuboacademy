import { useState } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'
import { supabase } from '../../../lib/supabase'

function Card({ title, desc, children, span }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', gridColumn: span ? '1 / -1' : undefined }}>
      <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: '.79rem', color: 'var(--text-2)', margin: '.25rem 0 0', fontWeight: 300, lineHeight: 1.5 }}>{desc}</p>}
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

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 42, height: 24, borderRadius: 12, background: on ? 'var(--jade)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
    </button>
  )
}

export default function StudentSettingsPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()

  const [notifAnnouncements,  setNotifAnnouncements]  = useState(true)
  const [notifCourseUpdates,  setNotifCourseUpdates]  = useState(true)
  const [notifNewCourses,     setNotifNewCourses]     = useState(false)

  const [pwLoading, setPwLoading] = useState(false)
  const [pwMsg,     setPwMsg]     = useState('')

  async function sendPasswordReset() {
    if (!user?.email) return
    setPwLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    })
    setPwLoading(false)
    setPwMsg(error ? 'Error al enviar el correo.' : `Correo enviado a ${user.email}`)
    setTimeout(() => setPwMsg(''), 5000)
  }

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
              <span style={{ fontSize: '.76rem', color: '#B5B2AB', background: 'var(--cream)', padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>No editable</span>
            </Row>
            <Row label="Contraseña" desc="Recibe un enlace por correo para restablecer tu contraseña." last>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
                <button onClick={sendPasswordReset} disabled={pwLoading}
                  style={{ padding: '.45rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: 'var(--carbon)', cursor: pwLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: pwLoading ? .6 : 1 }}>
                  {pwLoading ? 'Enviando…' : 'Restablecer contraseña'}
                </button>
                {pwMsg && <span style={{ fontSize: '.72rem', color: pwMsg.includes('Error') ? '#dc2626' : 'var(--jade)' }}>{pwMsg}</span>}
              </div>
            </Row>
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

          {/* Notificaciones — full width */}
          <Card title="Notificaciones por correo" desc="Elige qué actualizaciones deseas recibir en tu bandeja de entrada." span>
            <Row label="Comunicados" desc="Cuando el equipo de Cubo Academy publique un aviso.">
              <Toggle on={notifAnnouncements} onChange={setNotifAnnouncements} />
            </Row>
            <Row label="Actualizaciones de curso" desc="Cuando un instructor actualice contenido de un curso tuyo.">
              <Toggle on={notifCourseUpdates} onChange={setNotifCourseUpdates} />
            </Row>
            <Row label="Nuevos cursos" desc="Cuando haya nuevos cursos disponibles en el catálogo." last>
              <Toggle on={notifNewCourses} onChange={setNotifNewCourses} />
            </Row>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  )
}
