import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'

export default function ForgotPasswordScreen() {
  const { resetPasswordForEmail } = useAuth()
  const { navigate } = useNavigation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await resetPasswordForEmail(email)
    setLoading(false)
    // Don't reveal whether the email exists — same message either way.
    if (err) setError('No se pudo enviar el correo. Intenta de nuevo.')
    else setDone(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jade-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,125,120,.15)', filter: 'blur(80px)', top: '-15%', right: '-10%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420 }}>
        <button onClick={() => navigate('login')}
          style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '.82rem', marginBottom: '2rem', padding: 0, transition: 'color .2s' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,.9)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,.55)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a iniciar sesión
        </button>

        <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '2.5rem 2.25rem', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>
              Cubo <span style={{ color: 'var(--jade-light)' }}>Campus</span>
            </div>
            <p style={{ marginTop: '.5rem', fontSize: '.82rem', color: 'rgba(255,255,255,.5)', fontWeight: 400 }}>Recupera tu contraseña</p>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 56, height: 56, background: 'var(--jade)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '.5rem' }}>Revisa tu correo</h3>
              <p style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Si <strong style={{ color: 'rgba(255,255,255,.8)' }}>{email}</strong> tiene una cuenta, recibirás un enlace para restablecer tu contraseña. Si no llega en unos minutos, revisa spam o pide a un administrador que la restablezca por ti.
              </p>
              <button onClick={() => navigate('login')}
                style={{ width: '100%', padding: '.9rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                Volver a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.
              </p>
              <div style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="forgot-email" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Correo electrónico</label>
                <input id="forgot-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@email.com" autoComplete="email"
                  style={{ width: '100%', padding: '.8rem 1rem', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'white', fontSize: '.95rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(22,125,120,.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.82rem', color: '#FCA5A5', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '1rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, transition: 'opacity .2s' }}>
                {loading ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
