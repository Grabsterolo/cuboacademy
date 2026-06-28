import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'

export default function RegisterScreen() {
  const { signUp } = useAuth()
  const { navigate } = useNavigation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error: err } = await signUp({
      email, password,
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      role: 'student',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  const INP_STYLE = {
    width: '100%', padding: '.8rem 1rem', background: 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'white',
    fontSize: '.95rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s',
  }
  const LBL_STYLE = { display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }
  const focusIn = e => e.target.style.borderColor = 'rgba(22,125,120,.7)'
  const focusOut = e => e.target.style.borderColor = 'rgba(255,255,255,.12)'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jade-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 450, height: 450, borderRadius: '50%', background: 'rgba(22,125,120,.15)', filter: 'blur(80px)', top: '-10%', left: '-5%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <button onClick={() => navigate('login')}
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.82rem', marginBottom: '2rem', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.9)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Ya tengo cuenta
        </button>

        <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '2.5rem 2.25rem', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
              Cubo <span style={{ color: 'var(--jade-light)' }}>Academy</span>
            </div>
            <p style={{ marginTop: '.5rem', fontSize: '.82rem', color: 'rgba(255,255,255,.5)', fontWeight: 300 }}>Crea tu cuenta gratis</p>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ width: 56, height: 56, background: 'var(--jade)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'white', marginBottom: '.5rem' }}>¡Cuenta creada!</h3>
              <p style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
              </p>
              <button onClick={() => navigate('login')}
                style={{ width: '100%', padding: '.9rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={LBL_STYLE}>Nombre</label>
                  <input style={INP_STYLE} type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={LBL_STYLE}>Apellidos</label>
                  <input style={INP_STYLE} type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="García" onFocus={focusIn} onBlur={focusOut} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={LBL_STYLE}>Correo electrónico</label>
                <input style={INP_STYLE} type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@email.com" onFocus={focusIn} onBlur={focusOut} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={LBL_STYLE}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...INP_STYLE, paddingRight: '2.8rem' }} type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" onFocus={focusIn} onBlur={focusOut} />
                  <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                    style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 0, display: 'flex' }}>
                    {showPass
                      ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={LBL_STYLE}>Confirmar contraseña</label>
                <input style={INP_STYLE} type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contraseña" onFocus={focusIn} onBlur={focusOut} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: '#FCA5A5', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '1rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}>
                {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
              </button>

              <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '.76rem', color: 'rgba(255,255,255,.35)' }}>
                Al registrarte aceptas nuestros términos y condiciones.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
