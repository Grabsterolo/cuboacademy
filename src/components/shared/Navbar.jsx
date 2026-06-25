import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const { user, profile, signIn, signUp, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('login')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regRole, setRegRole] = useState('student')
  const [regPassword, setRegPassword] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const searchRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { closeModal(); setMenuOpen(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = (modal || menuOpen) ? 'hidden' : ''
  }, [modal, menuOpen])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function openModal(t) {
    setTab(t)
    setFormError('')
    setFormSuccess('')
    setMenuOpen(false)
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
    const { error } = await signUp({ email: regEmail, password: regPassword, fullName: regName, role: 'student' })
    setFormLoading(false)
    if (error) { setFormError(error.message); return }
    setFormSuccess('¡Cuenta creada! Revisa tu correo para confirmar tu registro.')
  }

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = profile?.role === 'instructor' ? 'Instructor' : profile?.role === 'admin' ? 'Admin' : 'Estudiante'

  return (
    <>
      <style>{`
        .nav-link { color: var(--text-2); font-size: .85rem; font-weight: 500; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .nav-link:hover { color: var(--jade); }
        .btn-outline-nav { padding: .45rem 1.1rem; border: 1px solid var(--border); background: white; color: var(--carbon); border-radius: 7px; font-size: .85rem; font-weight: 500; cursor: pointer; transition: border-color .2s, color .2s; -webkit-tap-highlight-color: transparent; }
        .btn-outline-nav:hover { border-color: var(--jade); color: var(--jade); }
        .btn-primary-nav { padding: .45rem 1.15rem; background: var(--jade); color: white; border: none; border-radius: 7px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: background .2s; -webkit-tap-highlight-color: transparent; }
        .btn-primary-nav:hover { background: var(--jade-hover); }
        .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(23,26,28,.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; overflow-y: auto; }
        .auth-modal-box { background: white; border: 1px solid var(--border); border-radius: 16px; padding: 2.5rem; width: 100%; max-width: 440px; min-height: 520px; position: relative; box-shadow: 0 24px 60px rgba(23,26,28,.18); }
        .m-tab { flex: 1; padding: .45rem; background: transparent; border: none; color: var(--text-2); font-size: .85rem; font-weight: 500; cursor: pointer; border-radius: 5px; transition: background .2s, color .2s; -webkit-tap-highlight-color: transparent; }
        .m-tab.active { background: white; color: var(--carbon); font-weight: 600; box-shadow: 0 1px 3px rgba(23,26,28,.1); }
        .form-inp { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); }
        .form-inp:focus { border-color: var(--jade); background: white; }
        .form-sel { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; cursor: pointer; transition: border-color .2s; font-family: var(--sans); }
        .form-sel:focus { border-color: var(--jade); }
        .btn-submit { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; margin-top: .4rem; transition: background .2s, opacity .2s; font-family: var(--sans); -webkit-tap-highlight-color: transparent; }
        .btn-submit:hover { background: var(--jade-hover); }
        .btn-submit:disabled { opacity: .6; cursor: not-allowed; }
        .form-error { background: #fef2f0; border: 1px solid #f5c6bb; color: #c0392b; border-radius: 7px; padding: .6rem .9rem; font-size: .8rem; margin-bottom: .9rem; }
        .form-success { background: var(--jade-soft); border: 1px solid var(--jade-light); color: var(--jade-dark); border-radius: 7px; padding: .6rem .9rem; font-size: .8rem; margin-bottom: .9rem; }
        .user-chip { display: flex; align-items: center; gap: .5rem; padding: .35rem .85rem .35rem .4rem; background: var(--jade-soft); border-radius: 20px; border: 1px solid var(--jade-light); cursor: default; }
        .avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--jade); display: flex; align-items: center; justify-content: center; color: white; font-size: .7rem; font-weight: 700; flex-shrink: 0; }
        .btn-signout { background: none; border: none; color: var(--text-2); font-size: .8rem; font-weight: 500; cursor: pointer; padding: .3rem .5rem; border-radius: 5px; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .btn-signout:hover { color: var(--terra); }
        .search-area-item:hover { color: var(--jade) !important; }
        /* Hamburger / mobile */
        .nav-hamburger { display: none; background: none; border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; cursor: pointer; color: var(--carbon); align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; min-width: 42px; min-height: 42px; }
        .nav-desktop-center { display: flex; align-items: center; gap: 2rem; }
        .nav-desktop-auth { display: flex; align-items: center; gap: .6rem; }
        .nav-mobile-drawer { display: none; position: fixed; top: 66px; left: 0; right: 0; bottom: 0; background: rgba(248,246,241,.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 98; flex-direction: column; padding: 1.5rem 6% 0; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .nav-mobile-drawer.open { display: flex; }
        .nav-mobile-link { font-size: 1.3rem; font-family: var(--serif); font-weight: 600; color: var(--carbon); padding: 1rem 0; border-bottom: 1px solid var(--border); display: block; -webkit-tap-highlight-color: transparent; }
        .nav-mobile-link:active { color: var(--jade); }
        .btn-mobile-full { width: 100%; padding: 1rem; border-radius: 9px; font-family: var(--serif); font-size: 1rem; font-weight: 600; cursor: pointer; text-align: center; display: block; -webkit-tap-highlight-color: transparent; border: none; }
        @media (max-width: 768px) {
          .nav-hamburger { display: flex; }
          .nav-desktop-center { display: none !important; }
          .nav-desktop-auth { display: none !important; }
          .auth-modal-box { padding: 1.75rem 1.5rem; min-height: unset; border-radius: 12px; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 66, padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(248,246,241,.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
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

        {/* Desktop: links + búsqueda */}
        <div className="nav-desktop-center">
          <ul style={{ display: 'flex', alignItems: 'center', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><Link to="/cursos" className="nav-link">Cursos</Link></li>
            <li><Link to="/instructores" className="nav-link">Instructores</Link></li>
          </ul>

          <div ref={searchRef} style={{ position: 'relative' }}>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: '.5rem',
                padding: searchOpen ? '.4rem .75rem' : '.4rem .6rem',
                background: searchOpen ? 'white' : 'var(--cream)',
                border: `1px solid ${searchOpen ? 'var(--jade)' : 'var(--border)'}`,
                borderRadius: 20, width: searchOpen ? 220 : 36,
                transition: 'width .3s ease, border-color .2s, background .2s',
                overflow: 'hidden', cursor: searchOpen ? 'text' : 'pointer',
              }}
              onClick={() => !searchOpen && setSearchOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={searchOpen ? 'var(--jade)' : 'var(--text-2)'}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink: 0, transition: 'stroke .2s' }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar curso o tema..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '.83rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', width: '100%', opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? 'auto' : 'none', transition: 'opacity .2s' }}
                autoFocus={searchOpen} />
              {searchOpen && searchQuery && (
                <button onClick={e => { e.stopPropagation(); setSearchQuery('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--text-2)', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {searchOpen && searchQuery.length > 1 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 280, background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(23,26,28,.12)', overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '.6rem', color: 'var(--text-2)', fontSize: '.82rem', fontFamily: 'var(--sans)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Próximamente podrás buscar cursos aquí
                </div>
                <div style={{ borderTop: '1px solid var(--border)', padding: '.75rem 1.1rem' }}>
                  <div style={{ fontSize: '.75rem', color: '#B5B2AB', marginBottom: '.5rem', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>Áreas disponibles</div>
                  {categories.map(cat => (
                    <div key={cat.id} style={{ padding: '.4rem 0', fontSize: '.83rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jade)', display: 'inline-block', flexShrink: 0 }} />
                      {cat.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: auth */}
        <div className="nav-desktop-auth">
          {user ? (
            <>
              <Link to="/dashboard" className="user-chip" style={{ textDecoration: 'none', cursor: 'pointer' }}>
                <div className="avatar">{displayName[0].toUpperCase()}</div>
                <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
              </Link>
              <button className="btn-signout" onClick={handleSignOut}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn-outline-nav" onClick={() => openModal('login')}>Iniciar sesión</button>
              <button className="btn-primary-nav" onClick={() => openModal('register')}>Registrarse</button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menú">
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`}>
        <nav>
          <Link to="/cursos" className="nav-mobile-link">Cursos</Link>
          <Link to="/instructores" className="nav-mobile-link">Instructores</Link>
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: '1.5rem', paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem', background: 'var(--jade-soft)', borderRadius: 10, marginBottom: '.25rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{displayName[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: '.95rem', fontWeight: 600, fontFamily: 'var(--serif)', color: 'var(--carbon)' }}>{displayName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 500 }}>{roleLabel}</div>
                </div>
              </div>
              <Link to="/dashboard" className="btn-mobile-full" style={{ background: 'var(--jade)', color: 'white', textDecoration: 'none' }}>Mi área</Link>
              <button className="btn-mobile-full" style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' }} onClick={handleSignOut}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <button className="btn-mobile-full" style={{ background: 'var(--jade)', color: 'white' }} onClick={() => openModal('register')}>Registrarse gratis</button>
              <button className="btn-mobile-full" style={{ background: 'transparent', color: 'var(--carbon)', border: '1px solid var(--border)' }} onClick={() => openModal('login')}>Iniciar sesión</button>
            </>
          )}
        </div>
      </div>

      {/* Auth modal */}
      {modal === 'auth' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="auth-modal-box">
            <button onClick={closeModal} style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 6, minWidth: 32, minHeight: 32 }}>
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
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="••••••••" required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                </div>
                <button className="btn-submit" type="submit" disabled={formLoading}>{formLoading ? 'Entrando…' : 'Entrar a mi cuenta'}</button>
                <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
                  ¿Olvidaste tu contraseña? <a href="#" style={{ color: 'var(--jade)' }}>Recupérala aquí</a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nombre completo</label>
                  <input type="text" className="form-inp" placeholder="Tu nombre" required value={regName} onChange={e => setRegName(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" required value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </div>
<div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="Mínimo 8 caracteres" required minLength={8} value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                </div>
                <button className="btn-submit" type="submit" disabled={formLoading}>{formLoading ? 'Creando cuenta…' : 'Crear mi cuenta'}</button>
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
