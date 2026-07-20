import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth()
  const { navigate } = useNavigation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setLoading(true)
    const { error: err } = await updatePassword(password)
    setLoading(false)
    if (err) { setError(err.message || 'No se pudo actualizar la contraseña.'); return }
    setDone(true)
    // Force a fresh login with the new password instead of leaving the
    // temporary recovery session in place.
    await supabase.auth.signOut()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--jade-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,125,120,.15)', filter: 'blur(80px)', top: '-15%', right: '-10%', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420 }}>
        <div style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: '2.5rem 2.25rem', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'white', letterSpacing: '-.01em' }}>
              Cubo <span style={{ color: 'var(--jade-light)' }}>Campus</span>
            </div>
            <p style={{ marginTop: '.5rem', fontSize: '.82rem', color: 'rgba(255,255,255,.5)', fontWeight: 300 }}>Crea una contraseña nueva</p>
          </div>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: 56, height: 56, background: 'var(--jade)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'white', marginBottom: '.5rem' }}>¡Contraseña actualizada!</h3>
              <p style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Ya puedes iniciar sesión con tu contraseña nueva.
              </p>
              <button onClick={() => navigate('login')}
                style={{ width: '100%', padding: '.9rem', background: 'var(--jade)', border: 'none', borderRadius: 10, color: 'white', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                Ir a iniciar sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Contraseña nueva</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password"
                  style={{ width: '100%', padding: '.8rem 1rem', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, color: 'white', fontSize: '.95rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(22,125,120,.7)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,.12)'} />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'rgba(255,255,255,.55)', marginBottom: '.4rem', letterSpacing: '.07em', textTransform: 'uppercase' }}>Confirmar contraseña</label>
                <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite tu contraseña" autoComplete="new-password"
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
                {loading ? 'Guardando…' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
