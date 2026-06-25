import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function DashboardLayout({ navItems, children }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = profile?.role === 'instructor' ? 'Instructor' : profile?.role === 'admin' ? 'Administrador' : 'Estudiante'

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
        @media (max-width: 768px) {
          .dash-sidebar {
            width: 100%; min-height: unset; height: auto; position: sticky;
            flex-direction: row; border-right: none; border-bottom: 1px solid var(--border);
          }
          .dash-sidebar-top, .dash-sidebar-bottom { display: none !important; }
          .dash-sidebar-nav {
            flex-direction: row !important; padding: .5rem .75rem !important;
            overflow-x: auto; -webkit-overflow-scrolling: touch; gap: .25rem !important;
            scrollbar-width: none;
          }
          .dash-sidebar-nav::-webkit-scrollbar { display: none; }
          .dash-nav-link { white-space: nowrap; padding: .5rem .85rem; font-size: .8rem; }
          .dash-content { margin-left: 0; }
        }
      `}</style>

      <div style={{ display: 'flex' }}>
        <aside className="dash-sidebar">
          {/* Logo */}
          <div className="dash-sidebar-top" style={{ padding: '1.4rem 1.25rem .75rem' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
                <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
                <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
              </svg>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '.92rem', fontWeight: 700 }}>
                <span style={{ color: 'var(--carbon)' }}>Cubo </span>
                <span style={{ color: 'var(--jade)' }}>Academy</span>
              </span>
            </Link>
            <div style={{ height: 1, background: 'var(--border)', margin: '1.1rem 0 .25rem' }} />
          </div>

          {/* Nav */}
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

          {/* User + signout */}
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
    </>
  )
}
