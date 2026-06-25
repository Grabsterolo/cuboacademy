import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signIn, signUp, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('login')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  // login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regRole, setRegRole] = useState('student')
  const [regPassword, setRegPassword] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
  }, [modal])

  function openModal(t) {
    setTab(t)
    setFormError('')
    setFormSuccess('')
    setModal('auth')
  }

  function closeModal() {
    setModal(null)
    setFormError('')
    setFormSuccess('')
    setLoginEmail('')
    setLoginPassword('')
    setRegName('')
    setRegEmail('')
    setRegRole('student')
    setRegPassword('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    const { error } = await signIn({ email: loginEmail, password: loginPassword })
    setFormLoading(false)
    if (error) {
      setFormError(error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message)
      return
    }
    closeModal()
    navigate('/dashboard')
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!regName.trim()) { setFormError('Ingresa tu nombre completo.'); return }
    if (regPassword.length < 8) { setFormError('La contraseña debe tener al menos 8 caracteres.'); return }
    setFormError('')
    setFormLoading(true)
    const { error } = await signUp({ email: regEmail, password: regPassword, fullName: regName, role: regRole })
    setFormLoading(false)
    if (error) { setFormError(error.message); return }
    setFormSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu registro.')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'

  return (
    <>
      <style>{`
        .nav-link { color: var(--text-2); font-size: .85rem; font-weight: 500; transition: color .2s; }
        .nav-link:hover { color: var(--jade); }
        .btn-outline-nav { padding: .45rem 1.1rem; border: 1px solid var(--border); background: white; color: var(--carbon); border-radius: 7px; font-size: .85rem; font-weight: 500; cursor: pointer; transition: border-color .2s, color .2s; }
        .btn-outline-nav:hover { border-color: var(--jade); color: var(--jade); }
        .btn-primary-nav { padding: .45rem 1.15rem; background: var(--jade); color: white; border: none; border-radius: 7px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: background .2s; }
        .btn-primary-nav:hover { background: var(--jade-hover); }
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(23,26,28,.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
        .m-tab { flex: 1; padding: .45rem; background: transparent; border: none; color: var(--text-2); font-size: .85rem; font-weight: 500; cursor: pointer; border-radius: 5px; transition: background .2s, color .2s; }
        .m-tab.active { background: white; color: var(--carbon); font-weight: 600; box-shadow: 0 1px 3px rgba(23,26,28,.1); }
        .form-inp { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: .88rem; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); }
        .form-inp:focus { border-color: var(--jade); background: white; }
        .form-sel { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: .88rem; outline: none; cursor: pointer; appearance: none; transition: border-color .2s; font-family: var(--sans); }
        .form-sel:focus { border-color: var(--jade); }
        .btn-submit { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; margin-top: .4rem; transition: background .2s, opacity .2s; font-family: var(--sans); }
        .btn-submit:hover { background: var(--jade-hover); }
        .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
        .form-error { background: #fef2f0; border: 1px solid #f5c6bb; color: #c0392b; border-radius: 7px; padding: .6rem .9rem; font-size: .8rem; margin-bottom: .9rem; }
        .form-success { background: var(--jade-soft); border: 1px solid var(--jade-light); color: var(--jade-dark); border-radius: 7px; padding: .6rem .9rem; font-size: .8rem; margin-bottom: .9rem; }
        .user-chip { display: flex; align-items: center; gap: .5rem; padding: .35rem .85rem .35rem .4rem; background: var(--jade-soft); border-radius: 20px; border: 1px solid var(--jade-light); cursor: default; }
        .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--jade); display: flex; align-items: center; justify-content: center; color: white; font-size: .7rem; font-weight: 700; flex-shrink: 0; }
        .btn-signout { background: none; border: none; color: var(--text-2); font-size: .8rem; font-weight: 500; cursor: pointer; padding: .3rem .5rem; border-radius: 5px; transition: color .2s; }
        .btn-signout:hover { color: var(--terra); }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 66, padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(248,246,241,.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        transition: 'box-shadow .3s',
        boxShadow: scrolled ? '0 2px 20px rgba(23,26,28,.07)' : 'none',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
            <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
            <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
          </svg>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--carbon)' }}>Cubo </span>
            <span style={{ color: 'var(--jade)' }}>Academy</span>
          </span>
        </Link>

        <ul style={{ display: 'flex', alignItems: 'center', gap: '2rem', listStyle: 'none' }}>
          <li><Link to="/cursos" className="nav-link">Cursos</Link></li>
          <li><Link to="/#diferenciador" className="nav-link">Diferencial</Link></li>
          <li><Link to="/#instructores" className="nav-link">Instructores</Link></li>
          <li><Link to="/#como-funciona" className="nav-link">Cómo funciona</Link></li>
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          {user ? (
            <>
              <div className="user-chip">
                <div className="avatar">{displayName[0].toUpperCase()}</div>
                <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </span>
              </div>
              <Link to="/dashboard" className="btn-outline-nav" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Mi área
              </Link>
              <button className="btn-signout" onClick={handleSignOut}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn-outline-nav" onClick={() => openModal('login')}>
                Iniciar sesión
              </button>
              <button className="btn-primary-nav" onClick={() => openModal('register')}>
                Registrarse
              </button>
            </>
          )}
        </div>
      </nav>

      {modal === 'auth' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400, position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div style={{ textAlign: 'center', marginBottom: '1.75rem', fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--carbon)' }}>Cubo </span>
              <span style={{ color: 'var(--jade)' }}>Academy</span>
            </div>

            <div style={{ display: 'flex', background: 'var(--cream)', borderRadius: 8, padding: 3, gap: 3, marginBottom: '1.75rem', border: '1px solid var(--border)' }}>
              <button className={`m-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setFormError(''); setFormSuccess('') }}>Iniciar sesión</button>
              <button className={`m-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setFormError(''); setFormSuccess('') }}>Registrarse</button>
            </div>

            {formError && <div className="form-error">{formError}</div>}
            {formSuccess && <div className="form-success">{formSuccess}</div>}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" required
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="••••••••" required
                    value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <button className="btn-submit" type="submit" disabled={formLoading}>
                  {formLoading ? 'Entrando…' : 'Entrar a mi cuenta'}
                </button>
                <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
                  ¿Olvidaste tu contraseña? <a href="#" style={{ color: 'var(--jade)' }}>Recupérala aquí</a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nombre completo</label>
                  <input type="text" className="form-inp" placeholder="Tu nombre" required
                    value={regName} onChange={e => setRegName(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" required
                    value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Tipo de cuenta</label>
                  <select className="form-sel" value={regRole} onChange={e => setRegRole(e.target.value)}>
                    <option value="student">Estudiante</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="Mínimo 8 caracteres" required minLength={8}
                    value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                </div>
                <button className="btn-submit" type="submit" disabled={formLoading}>
                  {formLoading ? 'Creando cuenta…' : 'Crear mi cuenta'}
                </button>
                <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
                  Al registrarte aceptas los <a href="#" style={{ color: 'var(--jade)' }}>Términos de uso</a>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
