import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const { user, loading: authLoading, signUp } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (!authLoading && !registered && user) navigate('/dashboard', { replace: true })
  }, [user, authLoading, navigate, registered])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!nombre.trim()) { setError('Ingresa tu nombre.'); return }
    if (!apellidos.trim()) { setError('Ingresa tus apellidos.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    const { error: err } = await signUp({
      email,
      password,
      fullName: `${nombre.trim()} ${apellidos.trim()}`,
      role: 'student',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setRegistered(true)
  }

  if (authLoading) return null

  if (registered) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '3rem 2.5rem', boxShadow: '0 4px 32px rgba(23,26,28,.08)' }}>
            <div style={{ width: 64, height: 64, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.75rem' }}>¡Cuenta creada!</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Revisa tu correo electrónico para confirmar tu registro y comenzar a aprender.
            </p>
            <Link to="/login" style={{ display: 'block', width: '100%', padding: '.9rem', background: 'var(--jade)', color: 'white', borderRadius: 9, fontFamily: 'var(--sans)', fontSize: '.95rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .rip { width: 100%; padding: .75rem 1rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; color: var(--carbon); font-size: 16px; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); box-sizing: border-box; }
        .rip:focus { border-color: var(--jade); background: white; }
        .rlbl { display: block; font-size: .72rem; font-weight: 600; color: #9B9894; margin-bottom: .4rem; letter-spacing: .05em; text-transform: uppercase; }
        .rbtn { width: 100%; padding: .9rem; background: var(--jade); color: white; border: none; border-radius: 9px; font-size: .95rem; font-weight: 700; cursor: pointer; transition: background .2s, opacity .2s; font-family: var(--sans); }
        .rbtn:hover { background: var(--jade-hover); }
        .rbtn:disabled { opacity: .6; cursor: not-allowed; }
        .rerr { background: #fef2f0; border: 1px solid #f5c6bb; color: #c0392b; border-radius: 8px; padding: .65rem 1rem; font-size: .82rem; margin-bottom: 1rem; }
        .rrow { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        @media (max-width: 480px) { .rrow { grid-template-columns: 1fr; } }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
                <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
                <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
              </svg>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--carbon)' }}>Cubo </span>
                <span style={{ color: 'var(--jade)' }}>Academy</span>
              </span>
            </Link>
          </div>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', boxShadow: '0 4px 32px rgba(23,26,28,.08)' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <p style={{ fontSize: '.73rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.3rem' }}>Estudiante</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: 0 }}>Crea tu cuenta</h1>
            </div>

            {error && <div className="rerr">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="rrow" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="rlbl">Nombre *</label>
                  <input type="text" className="rip" placeholder="Juan" required value={nombre} onChange={e => setNombre(e.target.value)} />
                </div>
                <div>
                  <label className="rlbl">Apellidos *</label>
                  <input type="text" className="rip" placeholder="García López" required value={apellidos} onChange={e => setApellidos(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="rlbl">Correo electrónico *</label>
                <input type="email" className="rip" placeholder="tucorreo@empresa.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label className="rlbl">Contraseña *</label>
                <input type="password" className="rip" placeholder="Mínimo 8 caracteres" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="rlbl">Confirmar contraseña *</label>
                <input type="password" className="rip" placeholder="Repite tu contraseña" required value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <button type="submit" className="rbtn" disabled={loading}>
                {loading ? 'Creando cuenta…' : 'Crear mi cuenta'}
              </button>
              <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '.9rem' }}>
                Al registrarte aceptas los <a href="#" style={{ color: 'var(--jade)', textDecoration: 'none' }}>Términos de uso</a>
              </div>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center', fontSize: '.84rem', color: 'var(--text-2)' }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: 'var(--jade)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</Link>
            </div>

            <div style={{ textAlign: 'center', marginTop: '.75rem', fontSize: '.78rem', color: '#B5B2AB' }}>
              ¿Quieres ser instructor?{' '}
              <Link to="/quiero-ser-instructor" style={{ color: 'var(--jade)', textDecoration: 'none', fontWeight: 500 }}>Postúlate aquí</Link>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '.78rem', color: '#B5B2AB' }}>
            <Link to="/" style={{ color: '#B5B2AB', textDecoration: 'none' }}>← Volver al inicio</Link>
          </div>
        </div>
      </div>
    </>
  )
}
