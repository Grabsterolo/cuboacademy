import { useEffect, useState } from 'react'
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'

export default function DashboardLayout({ navItems, children }) {
  const { user, profile, signOut } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const platformName = settings.platform_name || 'Cubo Academy'
  const nameSpaceIdx = platformName.indexOf(' ')
  const namePart1 = nameSpaceIdx > -1 ? platformName.slice(0, nameSpaceIdx) + ' ' : platformName
  const namePart2 = nameSpaceIdx > -1 ? platformName.slice(nameSpaceIdx + 1) : ''
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = profile?.role === 'instructor' ? 'Instructor' : profile?.role === 'admin' ? 'Administrador' : 'Estudiante'

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      <style>{`
        .dash-sidebar {
          width: 240px; min-height: 100vh; background: white;
          border-right: 1px solid var(--border); display: flex;
          flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
        }
        .dash-content { margin-left: 240px; min-height: 100vh; background: var(--cream); }
        .dash-nav-link {
          display: flex; align-items: center; gap: .7rem; padding: .6rem 1rem;
          border-radius: 8px; color: var(--text-2); font-size: .855rem; font-weight: 500;
          font-family: var(--sans); transition: background .18s, color .18s;
          -webkit-tap-highlight-color: transparent;
        }
        .dash-nav-link:hover { background: var(--jade-soft); color: var(--jade); }
        .dash-nav-link.active { background: var(--jade-soft); color: var(--jade); font-weight: 600; }
        .dash-nav-link svg { flex-shrink: 0; opacity: .75; }
        .dash-nav-link.active svg, .dash-nav-link:hover svg { opacity: 1; }
        .btn-signout-dash {
          width: 100%; padding: .55rem; background: transparent;
          border: 1px solid var(--border); border-radius: 7px; font-size: .8rem;
          color: var(--text-2); cursor: pointer; font-family: var(--sans);
          transition: border-color .2s, color .2s; -webkit-tap-highlight-color: transparent;
        }
        .btn-signout-dash:hover { border-color: var(--terra); color: var(--terra); }

        /* Mobile top bar */
        .dash-mobile-bar {
          display: none; position: fixed; top: 0; left: 0; right: 0; height: 56px;
          background: white; border-bottom: 1px solid var(--border);
          z-index: 100; padding: 0 1rem;
          align-items: center; justify-content: space-between;
        }
        .dash-hamburger {
          background: none; border: 1px solid var(--border); border-radius: 7px;
          padding: 7px 9px; cursor: pointer; color: var(--carbon);
          display: flex; align-items: center; justify-content: center;
          min-width: 38px; min-height: 38px; -webkit-tap-highlight-color: transparent;
        }

        /* Drawer overlay */
        .dash-drawer-overlay {
          display: none; position: fixed; inset: 0; z-index: 200;
          background: rgba(23,26,28,.45); backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .dash-drawer-overlay.open { display: block; }

        /* Drawer panel */
        .dash-drawer {
          position: fixed; top: 0; left: 0; bottom: 0; width: 272px;
          background: white; z-index: 201; display: flex; flex-direction: column;
          transform: translateX(-100%); transition: transform .28s cubic-bezier(.4,0,.2,1);
          box-shadow: 4px 0 24px rgba(23,26,28,.12);
        }
        .dash-drawer.open { transform: translateX(0); }

        @media (max-width: 768px) {
          .dash-sidebar { display: none !important; }
          .dash-mobile-bar { display: flex; }
          .dash-content { margin-left: 0; padding-top: 56px; }
        }
      `}</style>

      {/* Desktop sidebar */}
      <div style={{ display: 'flex' }}>
        <aside className="dash-sidebar">
          <div className="dash-sidebar-top" style={{ padding: '1.4rem 1.25rem .75rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
                <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
                <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
              </svg>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '.92rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--carbon)' }}>{namePart1}</span>
                {namePart2 && <span style={{ color: 'var(--jade)' }}>{namePart2}</span>}
              </span>
            </Link>
            <div style={{ height: 1, background: 'var(--border)', margin: '1.1rem 0 .25rem' }} />
          </div>

          <nav className="dash-sidebar-nav" style={{ flex: 1, padding: '.5rem .75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) => `dash-nav-link${isActive ? ' active' : ''}`}
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="dash-sidebar-bottom" style={{ padding: '1rem .75rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem .75rem', borderRadius: 8, background: 'var(--cream)', marginBottom: '.6rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {displayName[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                <div style={{ fontSize: '.68rem', color: 'var(--jade)', fontWeight: 500 }}>{roleLabel}</div>
              </div>
            </div>
            <button className="btn-signout-dash" onClick={handleSignOut}>Cerrar sesión</button>
          </div>
        </aside>

        <main className="dash-content" style={{ flex: 1 }}>
          {children}
        </main>
      </div>

      {/* Mobile top bar */}
      <div className="dash-mobile-bar">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
            <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
            <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
          </svg>
          <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700 }}>
            <span style={{ color: 'var(--carbon)' }}>{namePart1}</span>
            {namePart2 && <span style={{ color: 'var(--jade)' }}>{namePart2}</span>}
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.3rem .7rem .3rem .35rem', background: 'var(--jade-soft)', borderRadius: 20, border: '1px solid var(--jade-light)' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {displayName[0].toUpperCase()}
            </div>
            <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--carbon)', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
          </div>
          <button className="dash-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Menú">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Drawer overlay */}
      <div className={`dash-drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />

      {/* Drawer panel */}
      <div className={`dash-drawer${drawerOpen ? ' open' : ''}`}>
        {/* Drawer header */}
        <div style={{ padding: '1rem 1rem .75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.55rem .75rem', borderRadius: 8, background: 'var(--cream)', flex: 1, marginRight: '.75rem', minWidth: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {displayName[0].toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontSize: '.68rem', color: 'var(--jade)', fontWeight: 500 }}>{roleLabel}</div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 32, minHeight: 32, flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Drawer nav */}
        <nav style={{ flex: 1, padding: '.75rem .75rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => `dash-nav-link${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Drawer footer */}
        <div style={{ padding: '.75rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn-signout-dash" onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </div>
    </>
  )
}
