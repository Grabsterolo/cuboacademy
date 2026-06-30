import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import { useNavigation } from '../../context/NavigationContext'

const BELL_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  return `hace ${days} d`
}

export default function NotificationBell({ dark }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { navigate } = useNavigation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleItemClick(n) {
    if (!n.is_read) markAsRead(n.id)
    setOpen(false)
    if (n.screen) navigate(n.screen, n.params || {})
  }

  const iconColor = dark ? 'rgba(255,255,255,.7)' : 'var(--text-2)'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Notificaciones"
        style={{ position: 'relative', background: 'none', border: dark ? '1px solid rgba(255,255,255,.15)' : '1px solid var(--border)', borderRadius: 7, padding: '7px 9px', cursor: 'pointer', color: iconColor, display: 'flex', alignItems: 'center' }}>
        {BELL_ICON}
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, padding: '0 3px', borderRadius: 8, background: '#e74c3c', color: 'white', fontSize: '.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sans)' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: '120%', right: 0, width: 340, maxHeight: 420, overflowY: 'auto', background: 'white', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 36px rgba(23,26,28,.16)', zIndex: 500 }}>
          <div style={{ padding: '.85rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)' }}>Notificaciones</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>
                Marcar todas leídas
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--text-2)', fontWeight: 300 }}>Sin notificaciones</p>
            </div>
          ) : (
            <div>
              {notifications.map(n => (
                <div key={n.id} onClick={() => handleItemClick(n)}
                  style={{ padding: '.75rem 1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: n.is_read ? 'transparent' : 'var(--jade-soft)', display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.is_read ? 'transparent' : 'var(--jade)', marginTop: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.15rem' }}>{n.title}</div>
                    {n.message && <div style={{ fontSize: '.76rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.4, marginBottom: '.25rem' }}>{n.message}</div>}
                    <div style={{ fontSize: '.68rem', color: '#B5B2AB' }}>{timeAgo(n.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
