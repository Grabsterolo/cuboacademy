import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'

export default function LoginScreen() {
  const { signIn, user, loading: authLoading } = useAuth()
  const { navigate, enterPortal } = useNavigation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) enterPortal('panel')
  }, [user, authLoading, enterPortal])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : err.message)
    }
    // Success: useEffect above catches user change and calls enterPortal
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jade-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      {/* Orbs */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,125,120,.15)', filter: 'blur(80px)', top: '-15%', right: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(22,125,120,.1)', filter: 'blur(70px)', bottom: '-10%', left: '-8%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420 }}>
        {/* Back button */}
        <button onClick={() => navigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.82rem', marginBottom: '2rem', padding: 0, transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.9)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver al inicio
        </button>

        <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '2.5rem 2.25rem', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>
              Cubo <span style={{ color: 'var(--jade-light)' }}>Academy</span>
            </div>
            <p style={{ marginTop: '.5rem', fontSize: '.82rem', color: 'rgba(255,255,255,.5)', fontWeight: 300 }}>Bienvenido de vuelta</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Correo electrónico</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@email.com" autoComplete="email"
                style={{ width: '100%', padding: '.8rem 1rem', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'white', fontSize: '.95rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                onFocus={e => e.target.style.borderColor = 'rgba(22,125,120,.7)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  style={{ width: '100%', padding: '.8rem 2.8rem .8rem 1rem', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'white', fontSize: '.95rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(22,125,120,.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  style={{ position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.4)', padding: 0, display: 'flex' }}>
                  {showPass
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: '#FCA5A5', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '1rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, transition: 'opacity .2s' }}>
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <p style={{ fontSize: '.82rem', color: 'rgba(255,255,255,.45)' }}>
              ¿Sin cuenta?{' '}
              <button onClick={() => navigate('register')}
                style={{ background: 'none', border: 'none', color: 'var(--jade-light)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.82rem', padding: 0, textDecoration: 'underline' }}>
                Regístrate gratis
              </button>
            </p>
            <button onClick={() => navigate('instructor-apply')}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.76rem', padding: 0 }}>
              ¿Quieres ser instructor? Postúlate →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
