import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useNavigation } from '../../context/NavigationContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { ADMIN_NAV, INSTRUCTOR_NAV, STUDENT_NAV } from '../../config/navigation'

const LOGO = (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
    <rect x="1.5" y="1.5" width="29" height="29" rx="4" stroke="#167D78" strokeWidth="1.5" fill="none"/>
    <rect x="7" y="7" width="18" height="18" rx="1" fill="#167D78" fillOpacity=".1"/>
    <rect x="11.5" y="11.5" width="9" height="9" rx="1" fill="#167D78"/>
  </svg>
)

function NavItem({ item, active, onClick }) {
  return (
    <button
      onClick={() => onClick(item.key)}
      style={{
        display: 'flex', alignItems: 'center', gap: '.65rem',
        padding: '.55rem .9rem', borderRadius: 8,
        color: active ? 'var(--jade)' : 'rgba(255,255,255,.6)',
        background: active ? 'rgba(22,125,120,.18)' : 'transparent',
        border: 'none', width: '100%', textAlign: 'left',
        fontFamily: 'var(--sans)', fontSize: '.855rem',
        fontWeight: active ? 600 : 400,
        cursor: 'pointer', transition: 'background .18s, color .18s',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.9)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,.6)' } }}
    >
      <span style={{ flexShrink: 0, opacity: active ? 1 : .7 }}>{item.icon}</span>
      {item.label}
    </button>
  )
}

export default function Sidebar({ drawerOpen, onCloseDrawer }) {
  const { user, profile, signOut } = useAuth()
  const { settings } = useSettings()
  const { section, navigate, exitPortal } = useNavigation()
  const isMobile = useIsMobile()

  const navItems = profile?.role === 'admin' ? ADMIN_NAV
    : profile?.role === 'instructor' ? INSTRUCTOR_NAV
    : STUDENT_NAV

  const platformName = settings?.platform_name || 'Cubo Academy'
  const spIdx = platformName.indexOf(' ')
  const namePart1 = spIdx > -1 ? platformName.slice(0, spIdx) + ' ' : platformName
  const namePart2 = spIdx > -1 ? platformName.slice(spIdx + 1) : ''
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Usuario'
  const roleLabel = profile?.role === 'instructor' ? 'Instructor' : profile?.role === 'admin' ? 'Administrador' : 'Estudiante'
  const avatar = profile?.avatar_url

  async function handleSignOut() {
    await signOut()
    exitPortal()
  }

  function handleNav(key) {
    navigate(key)
    if (isMobile) onCloseDrawer?.()
  }

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '1.4rem 1.1rem .75rem' }}>
        <button onClick={() => navigate('landing')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          {LOGO}
          <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700 }}>
            <span style={{ color: 'rgba(255,255,255,.9)' }}>{namePart1}</span>
            {namePart2 && <span style={{ color: 'var(--jade)' }}>{namePart2}</span>}
          </span>
        </button>
        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '1rem 0 .25rem' }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '.25rem .5rem', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {navItems.map(item => (
          <NavItem key={item.key} item={item} active={section === item.key} onClick={handleNav} />
        ))}
      </nav>

      {/* User card + logout */}
      <div style={{ padding: '.75rem .75rem 1rem', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .75rem', borderRadius: 9, background: 'rgba(255,255,255,.06)', marginBottom: '.6rem', cursor: 'pointer' }}
          onClick={() => { if (profile?.role !== 'admin') handleNav('perfil') }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: avatar ? 'transparent' : 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '.75rem', fontWeight: 700, color: 'white', flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(255,255,255,.12)' }}>
            {avatar ? <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : displayName[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'rgba(255,255,255,.9)', fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: '.68rem', color: 'var(--jade)', fontWeight: 500 }}>{roleLabel}</div>
          </div>
        </div>
        <button onClick={handleSignOut}
          style={{ width: '100%', padding: '.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,.12)', borderRadius: 7, fontSize: '.8rem', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color .2s, color .2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,.5)'; e.currentTarget.style.color = '#FCA5A5' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(255,255,255,.5)' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        <div onClick={onCloseDrawer}
          style={{ display: drawerOpen ? 'block' : 'none', position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} />
        {/* Drawer */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 272, zIndex: 201,
          background: 'var(--jade-dark)', transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .28s cubic-bezier(.4,0,.2,1)',
          boxShadow: '4px 0 32px rgba(0,0,0,.35)',
          borderRight: '1px solid rgba(255,255,255,.07)',
        }}>
          {/* Close button */}
          <button onClick={onCloseDrawer}
            style={{ position: 'absolute', top: '1rem', right: '.75rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,.5)', padding: 6, display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          {sidebarContent}
        </aside>
      </>
    )
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--jade-dark)',
      borderRight: '1px solid rgba(255,255,255,.07)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
      flexShrink: 0,
    }}>
      {sidebarContent}
    </aside>
  )
}
