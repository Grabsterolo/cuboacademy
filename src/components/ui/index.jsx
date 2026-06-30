import { useEffect, useState } from 'react'

// ─── FieldLabel ───────────────────────────────────────────────────────────────
// Simple label used by CategoriesPage and UsersPage forms.
export function FieldLabel({ children }) {
  return (
    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>
      {children}
    </label>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────
// Full field wrapper: outer div with margin, label, optional hint, children.
export function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</label>
      {hint && <p style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '-.2rem', marginBottom: '.4rem' }}>{hint}</p>}
      {children}
    </div>
  )
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
// Loading placeholder. Props match the local `Skel` used in GeneralPage.
export function Skeleton({ w = '100%', h = 18, r = 6, mb = 0 }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: 'var(--border)', marginBottom: mb }} />
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ label, bg, color, border }) {
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color, border }}>
      {label}
    </span>
  )
}

// ─── IconBtn ──────────────────────────────────────────────────────────────────
export function IconBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: danger ? '#DC2626' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, minHeight: 28, transition: 'background .15s, color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,.09)' : 'var(--jade-soft)'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--jade)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--text-2)' }}>
      {children}
    </button>
  )
}

// ─── ModalOverlay ─────────────────────────────────────────────────────────────
export function ModalOverlay({ onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(23,26,28,.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {children}
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ title, description, onConfirm, onCancel, loading, danger = true }) {
  return (
    <ModalOverlay onClose={onCancel}>
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem 2.25rem', width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(23,26,28,.18)', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, background: danger ? '#fef2f0' : 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          {danger ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.45rem' }}>{title}</h3>
        {description && <p style={{ fontSize: '.84rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.5rem', fontWeight: 300 }}>{description}</p>}
        <div style={{ display: 'flex', gap: '.75rem' }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: '.75rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, padding: '.75rem', background: danger ? '#e74c3c' : 'var(--jade)', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: loading ? .6 : 1 }}>
            {loading ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', background: 'var(--carbon)', color: 'white', padding: '.65rem 1.25rem', borderRadius: 8, fontSize: '.84rem', fontFamily: 'var(--sans)', fontWeight: 500, zIndex: 400, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(23,26,28,.2)', pointerEvents: 'none' }}>
      {message}
    </div>
  )
}
