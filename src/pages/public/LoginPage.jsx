import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const { user, loading: authLoading, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true })
  }, [user, authLoading, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : err.message)
      return
    }
    navigate('/dashboard')
  }

  if (authLoading) return null

  return (
    <>
      <style>{`
        .aip { width: 100%; padding: .75rem 1rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; color: var(--carbon); font-size: 16px; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); box-sizing: border-box; }
        .aip:focus { border-color: var(--jade); background: white; }
        .albl { display: block; font-size: .72rem; font-weight: 600; color: #9B9894; margin-bottom: .4rem; letter-spacing: .05em; text-transform: uppercase; }
        .abtn { width: 100%; padding: .9rem; background: var(--jade); color: white; border: none; border-radius: 9px; font-size: .95rem; font-weight: 700; cursor: pointer; transition: background .2s, opacity .2s; font-family: var(--sans); }
        .abtn:hover { background: var(--jade-hover); }
        .abtn:disabled { opacity: .6; cursor: not-allowed; }
        .aerr { background: #fef2f0; border: 1px solid #f5c6bb; color: #c0392b; border-radius: 8px; padding: .65rem 1rem; font-size: .82rem; margin-bottom: 1rem; }
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
              <p style={{ fontSize: '.73rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.3rem' }}>Cubo Academy</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.65rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: 0 }}>Bienvenido de vuelta</h1>
            </div>

            {error && <div className="aerr">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="albl">Correo electrónico</label>
                <input type="email" className="aip" placeholder="tucorreo@empresa.com" required value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="albl">Contraseña</label>
                <input type="password" className="aip" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button type="submit" className="abtn" disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar a mi cuenta'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '.78rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
              <a href="#" style={{ color: 'var(--jade)', textDecoration: 'none' }}>¿Olvidaste tu contraseña?</a>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center', fontSize: '.84rem', color: 'var(--text-2)' }}>
              ¿No tienes cuenta?{' '}
              <Link to="/registro" style={{ color: 'var(--jade)', fontWeight: 600, textDecoration: 'none' }}>Regístrate</Link>
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
