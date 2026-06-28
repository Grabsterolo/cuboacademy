import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useNavigation } from '../../context/NavigationContext'
import { supabase } from '../../lib/supabase'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { settings } = useSettings()
  const { navigate, screen, enterPortal } = useNavigation()
  const allowRegistration = settings.allow_public_registration !== 'false'
  const allowInstructor = settings.allowed_registration_roles === 'student_instructor'
  const platformName = settings.platform_name || 'Cubo Academy'
  const spIdx = platformName.indexOf(' ')
  const namePart1 = spIdx > -1 ? platformName.slice(0, spIdx) + ' ' : platformName
  const namePart2 = spIdx > -1 ? platformName.slice(spIdx + 1) : ''

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categories, setCategories] = useState([])
  const searchRef = useRef(null)

  // Close mobile menu when screen changes
  useEffect(() => { setMenuOpen(false) }, [screen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') { setMenuOpen(false); setSearchOpen(false) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false); setSearchQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut()
    navigate('landing')
  }

  function goToDashboard() {
    setMenuOpen(false)
    enterPortal('panel')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = profile?.role === 'instructor' ? 'Instructor' : profile?.role === 'admin' ? 'Admin' : 'Estudiante'
  const avatar = profile?.avatar_url

  return (
    <>
      <style>{`
        .nav-link { color: var(--text-2); font-size: .85rem; font-weight: 500; transition: color .2s; cursor: pointer; background: none; border: none; font-family: var(--sans); padding: 0; -webkit-tap-highlight-color: transparent; }
        .nav-link:hover { color: var(--jade); }
        .btn-outline-nav { padding: .45rem 1.1rem; border: 1px solid var(--border); background: white; color: var(--carbon); border-radius: 7px; font-size: .85rem; font-weight: 500; cursor: pointer; transition: border-color .2s, color .2s; font-family: var(--sans); -webkit-tap-highlight-color: transparent; }
        .btn-outline-nav:hover { border-color: var(--jade); color: var(--jade); }
        .btn-primary-nav { padding: .45rem 1.15rem; background: var(--jade); color: white; border: none; border-radius: 7px; font-size: .85rem; font-weight: 600; cursor: pointer; transition: background .2s; font-family: var(--sans); -webkit-tap-highlight-color: transparent; }
        .btn-primary-nav:hover { background: var(--jade-hover); }
        .user-chip { display: flex; align-items: center; gap: .5rem; padding: .35rem .85rem .35rem .4rem; background: var(--jade-soft); border-radius: 20px; border: 1px solid var(--jade-light); cursor: pointer; background: none; border: none; }
        .btn-signout { background: none; border: none; color: var(--text-2); font-size: .8rem; font-weight: 500; cursor: pointer; padding: .3rem .5rem; border-radius: 5px; transition: color .2s; -webkit-tap-highlight-color: transparent; }
        .btn-signout:hover { color: var(--terra); }
        .nav-hamburger { display: none; background: none; border: 1px solid var(--border); border-radius: 7px; padding: 8px 10px; cursor: pointer; color: var(--carbon); align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; min-width: 42px; min-height: 42px; }
        .nav-desktop-center { display: flex; align-items: center; gap: 2rem; }
        .nav-desktop-auth { display: flex; align-items: center; gap: .6rem; }
        .nav-mobile-drawer { display: none; position: fixed; top: 66px; left: 0; right: 0; bottom: 0; background: rgba(248,246,241,.97); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); z-index: 98; flex-direction: column; padding: 1.5rem 6% 0; overflow-y: auto; }
        .nav-mobile-drawer.open { display: flex; }
        .nav-mobile-link { font-size: 1.3rem; font-family: var(--serif); font-weight: 600; color: var(--carbon); padding: 1rem 0; border-bottom: 1px solid var(--border); display: block; cursor: pointer; background: none; border-bottom: 1px solid var(--border); width: 100%; text-align: left; border-top: none; border-left: none; border-right: none; font-family: var(--serif); -webkit-tap-highlight-color: transparent; }
        .btn-mobile-full { width: 100%; padding: 1rem; border-radius: 9px; font-family: var(--serif); font-size: 1rem; font-weight: 600; cursor: pointer; text-align: center; display: block; -webkit-tap-highlight-color: transparent; }
        @media (max-width: 768px) {
          .nav-hamburger { display: flex; }
          .nav-desktop-center { display: none !important; }
          .nav-desktop-auth { display: none !important; }
        }
      `}</style>

      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 66, padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(248,246,241,.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? '0 2px 20px rgba(23,26,28,.07)' : 'none',
        transition: 'box-shadow .3s',
      }}>
        {/* Logo */}
        <button className="nav-link" onClick={() => navigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
            <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
            <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
          </svg>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--carbon)' }}>{namePart1}</span>
            {namePart2 && <span style={{ color: 'var(--jade)' }}>{namePart2}</span>}
          </span>
        </button>

        {/* Desktop center: nav + search */}
        <div className="nav-desktop-center">
          <ul style={{ display: 'flex', alignItems: 'center', gap: '2rem', listStyle: 'none', margin: 0, padding: 0 }}>
            <li><button className="nav-link" onClick={() => navigate('courses')}>Cursos</button></li>
          </ul>

          <div ref={searchRef} style={{ position: 'relative' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: searchOpen ? '.4rem .75rem' : '.4rem .6rem', background: searchOpen ? 'white' : 'var(--cream)', border: `1px solid ${searchOpen ? 'var(--jade)' : 'var(--border)'}`, borderRadius: 20, width: searchOpen ? 220 : 36, transition: 'width .3s ease, border-color .2s, background .2s', overflow: 'hidden', cursor: searchOpen ? 'text' : 'pointer' }}
              onClick={() => !searchOpen && setSearchOpen(true)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? 'var(--jade)' : 'var(--text-2)'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Buscar curso o tema..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '.83rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', width: '100%', opacity: searchOpen ? 1 : 0, pointerEvents: searchOpen ? 'auto' : 'none' }}
                autoFocus={searchOpen} />
              {searchOpen && searchQuery && (
                <button onClick={e => { e.stopPropagation(); setSearchQuery('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-2)', flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
            {searchOpen && searchQuery.length > 1 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 280, background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 32px rgba(23,26,28,.12)', overflow: 'hidden', zIndex: 200 }}>
                <div style={{ padding: '1rem 1.1rem', fontSize: '.82rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Próximamente podrás buscar cursos aquí
                </div>
                {categories.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '.75rem 1.1rem' }}>
                    <div style={{ fontSize: '.72rem', color: '#B5B2AB', marginBottom: '.5rem', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600 }}>Áreas disponibles</div>
                    {categories.map(cat => (
                      <div key={cat.id} style={{ padding: '.4rem 0', fontSize: '.83rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--jade)', display: 'inline-block', flexShrink: 0 }} />
                        {cat.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop auth */}
        <div className="nav-desktop-auth">
          {user ? (
            <>
              <button onClick={goToDashboard}
                style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.35rem .85rem .35rem .4rem', background: 'var(--jade-soft)', borderRadius: 20, border: '1px solid var(--jade-light)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: avatar ? 'transparent' : 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '.7rem', fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
                  {avatar ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
              </button>
              <button className="btn-signout" onClick={handleSignOut}>Salir</button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.25rem' }}>
              <div style={{ display: 'flex', gap: '.6rem' }}>
                <button className="btn-outline-nav" onClick={() => navigate('login')}>Iniciar sesión</button>
                {allowRegistration && <button className="btn-primary-nav" onClick={() => navigate('register')}>Registrarse</button>}
              </div>
              {allowInstructor && (
                <button onClick={() => navigate('instructor-apply')} style={{ background: 'none', border: 'none', fontSize: '.72rem', color: 'var(--jade)', cursor: 'pointer', fontWeight: 500, fontFamily: 'var(--sans)', padding: 0 }}>
                  ¿Eres instructor? Postúlate →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(m => !m)} aria-label="Menú">
          {menuOpen
            ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${menuOpen ? ' open' : ''}`}>
        <nav>
          <button className="nav-mobile-link" onClick={() => { navigate('courses'); setMenuOpen(false) }}>Cursos</button>
        </nav>
        <div style={{ flex: 1 }} />
        <div style={{ paddingTop: '1.5rem', paddingBottom: 'max(1.5rem,env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '1rem', background: 'var(--jade-soft)', borderRadius: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{displayName[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: '.95rem', fontWeight: 600, fontFamily: 'var(--serif)', color: 'var(--carbon)' }}>{displayName}</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 500 }}>{roleLabel}</div>
                </div>
              </div>
              <button className="btn-mobile-full" style={{ background: 'var(--jade)', color: 'white', border: 'none' }} onClick={goToDashboard}>Mi área</button>
              <button className="btn-mobile-full" style={{ background: 'transparent', color: 'var(--text-2)', border: '1px solid var(--border)' }} onClick={handleSignOut}>Cerrar sesión</button>
            </>
          ) : (
            <>
              {allowRegistration && <button className="btn-mobile-full" style={{ background: 'var(--jade)', color: 'white', border: 'none' }} onClick={() => { navigate('register'); setMenuOpen(false) }}>Registrarse gratis</button>}
              <button className="btn-mobile-full" style={{ background: 'transparent', color: 'var(--carbon)', border: '1px solid var(--border)' }} onClick={() => { navigate('login'); setMenuOpen(false) }}>Iniciar sesión</button>
              {allowInstructor && (
                <button onClick={() => { navigate('instructor-apply'); setMenuOpen(false) }} style={{ background: 'none', border: 'none', textAlign: 'center', fontSize: '.82rem', color: 'var(--jade)', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', paddingBottom: '.5rem' }}>
                  ¿Eres instructor? Postúlate →
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
