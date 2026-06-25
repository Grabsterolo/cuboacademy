import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('login')
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setModal(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = modal ? 'hidden' : ''
  }, [modal])

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
        .form-inp { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: .88rem; outline: none; transition: border-color .2s, background .2s; }
        .form-inp:focus { border-color: var(--jade); background: white; }
        .form-sel { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: .88rem; outline: none; cursor: pointer; appearance: none; transition: border-color .2s; }
        .form-sel:focus { border-color: var(--jade); }
        .btn-submit { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; margin-top: .4rem; transition: background .2s; }
        .btn-submit:hover { background: var(--jade-hover); }
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
          <button className="btn-outline-nav" onClick={() => { setTab('login'); setModal('auth') }}>
            Iniciar sesión
          </button>
          <button className="btn-primary-nav" onClick={() => { setTab('register'); setModal('auth') }}>
            Registrarse
          </button>
        </div>
      </nav>

      {modal === 'auth' && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400, position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)', transform: 'translateY(0)', transition: 'transform .25s' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 6 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem', fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700 }}>
              <span style={{ color: 'var(--carbon)' }}>Cubo </span>
              <span style={{ color: 'var(--jade)' }}>Academy</span>
            </div>
            <div style={{ display: 'flex', background: 'var(--cream)', borderRadius: 8, padding: 3, gap: 3, marginBottom: '1.75rem', border: '1px solid var(--border)' }}>
              <button className={`m-tab${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')}>Iniciar sesión</button>
              <button className={`m-tab${tab === 'register' ? ' active' : ''}`} onClick={() => setTab('register')}>Registrarse</button>
            </div>
            {tab === 'login' ? (
              <div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="••••••••" />
                </div>
                <button className="btn-submit">Entrar a mi cuenta</button>
                <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
                  ¿Olvidaste tu contraseña? <a href="#" style={{ color: 'var(--jade)' }}>Recupérala aquí</a>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Nombre completo</label>
                  <input type="text" className="form-inp" placeholder="Tu nombre" />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                  <input type="email" className="form-inp" placeholder="tucorreo@empresa.com" />
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Tipo de cuenta</label>
                  <select className="form-sel">
                    <option value="">Selecciona tu rol</option>
                    <option value="student">Estudiante</option>
                    <option value="instructor">Instructor</option>
                  </select>
                </div>
                <div style={{ marginBottom: '.9rem' }}>
                  <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>Contraseña</label>
                  <input type="password" className="form-inp" placeholder="Mínimo 8 caracteres" />
                </div>
                <button className="btn-submit">Crear mi cuenta</button>
                <div style={{ textAlign: 'center', fontSize: '.74rem', color: '#B5B2AB', marginTop: '1.1rem' }}>
                  Al registrarte aceptas los <a href="#" style={{ color: 'var(--jade)' }}>Términos de uso</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
