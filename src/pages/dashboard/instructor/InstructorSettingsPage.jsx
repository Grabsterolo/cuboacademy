import { useState } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'
import { supabase } from '../../../lib/supabase'

function Section({ title, desc, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.1rem' }}>
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: '.78rem', color: 'var(--text-2)', margin: '.2rem 0 0', fontWeight: 300 }}>{desc}</p>}
      </div>
      <div style={{ padding: '0 1.5rem' }}>{children}</div>
    </div>
  )
}

function Row({ label, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.15rem', fontWeight: 300 }}>{desc}</div>}
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

export default function InstructorSettingsPage() {
  const { user } = useAuth()
  const { navigate } = useNavigation()

  const [notifNewStudent,    setNotifNewStudent]    = useState(true)
  const [notifAnnouncements, setNotifAnnouncements] = useState(true)
  const [notifReviews,       setNotifReviews]       = useState(false)

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
      <style>{`@media (max-width: 768px) { .cfg-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>

      <div className="cfg-pad" style={{ padding: '2.5rem 2.5rem 3rem', maxWidth: 700 }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Configuración</h1>
        </div>

        {/* Cuenta */}
        <Section title="Cuenta" desc="Información de acceso y seguridad de tu cuenta.">
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
        </Section>

        {/* Perfil */}
        <Section title="Perfil público" desc="Información visible para los estudiantes en tus cursos.">
          <Row label="Editar información" desc="Nombre, foto, biografía, redes sociales y especialidad." last>
            <button onClick={() => navigate('perfil')}
              style={{ padding: '.45rem 1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ir a Mi perfil →
            </button>
          </Row>
        </Section>

        {/* Notificaciones */}
        <Section
          title="Notificaciones por correo"
          desc="Elige qué eventos te gustaría recibir por email.">
          <Row label="Nuevo estudiante" desc="Cuando alguien se inscriba en uno de tus cursos.">
            <Toggle on={notifNewStudent} onChange={setNotifNewStudent} />
          </Row>
          <Row label="Comunicados" desc="Cuando el equipo de Cubo Academy publique un aviso.">
            <Toggle on={notifAnnouncements} onChange={setNotifAnnouncements} />
          </Row>
          <Row label="Reseñas" desc="Cuando un estudiante deje una reseña en tu curso." last>
            <Toggle on={notifReviews} onChange={setNotifReviews} />
          </Row>
        </Section>

      </div>
    </DashboardLayout>
  )
}
