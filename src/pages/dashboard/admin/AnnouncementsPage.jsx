import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ADMIN_NAV } from '../../../config/navigation'

const TARGET_OPTIONS = [
  { value: 'all',        label: 'Todos',          color: '#3B7EF6', bg: 'rgba(59,126,246,.1)',   border: 'rgba(59,126,246,.25)' },
  { value: 'student',    label: 'Estudiantes',     color: '#8B5CF6', bg: 'rgba(139,92,246,.1)',   border: 'rgba(139,92,246,.25)' },
  { value: 'instructor', label: 'Instructores',    color: 'var(--jade)', bg: 'var(--jade-soft)', border: 'rgba(22,125,120,.25)' },
]

function targetInfo(val) {
  return TARGET_OPTIONS.find(o => o.value === val) || TARGET_OPTIONS[0]
}

function TargetBadge({ value }) {
  const t = targetInfo(value)
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, flexShrink: 0 }}>
      {t.label}
    </span>
  )
}

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetRole, setTargetRole] = useState('all')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') { closeCreate(); setDeleteTarget(null) } }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, target_role, created_at, is_active')
      .order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3200)
  }

  function closeCreate() {
    setShowCreate(false)
    setTitle('')
    setContent('')
    setTargetRole('all')
    setCreateError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setCreateError('Completa todos los campos.'); return }
    setSaving(true)
    setCreateError('')
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title: title.trim(), content: content.trim(), target_role: targetRole, created_by: profile?.id })
      .select()
      .single()
    setSaving(false)
    if (error) { setCreateError(error.message || 'Error al publicar.'); return }
    setItems(prev => [data, ...prev])
    showToast('Comunicado publicado correctamente.')
    closeCreate()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const { error } = await supabase.from('announcements').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    if (error) { showToast('Error al eliminar.'); }
    else {
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      showToast('Comunicado eliminado.')
    }
    setDeleteTarget(null)
  }

  const OVERLAY = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(23,26,28,.5)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  }
  const MODAL = {
    background: 'white', border: '1px solid var(--border)', borderRadius: 16,
    padding: '2.25rem', width: '100%', maxWidth: 480,
    position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)',
  }
  const INP = {
    width: '100%', padding: '.7rem .95rem', background: 'var(--cream)',
    border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)',
    fontSize: '16px', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box',
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <style>{`
        .ann-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .ann-tab-btn { padding: .38rem .85rem; border-radius: 7px; border: none; cursor: pointer; font-size: .82rem; font-weight: 600; font-family: var(--sans); transition: background .15s, color .15s; }
        .ann-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: var(--text-2); display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; min-width: 30px; min-height: 30px; }
        .ann-icon-btn:hover { background: rgba(220,38,38,.09); color: #dc2626; }
        .ann-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: var(--carbon); color: white; padding: .65rem 1.25rem; border-radius: 8px; font-size: .84rem; font-family: var(--sans); font-weight: 500; z-index: 400; white-space: nowrap; box-shadow: 0 4px 20px rgba(23,26,28,.2); pointer-events: none; }
        .ann-btn-pub { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: background .2s, opacity .2s; margin-top: .25rem; }
        .ann-btn-pub:hover { background: var(--jade-dark); }
        .ann-btn-pub:disabled { opacity: .6; cursor: not-allowed; }
        .ann-card:hover { box-shadow: 0 4px 18px rgba(23,26,28,.07) !important; }
        @media (max-width: 768px) { .ann-pad { padding: 1.25rem 1rem 2rem !important; } .ann-header { flex-direction: column !important; align-items: flex-start !important; } }
      `}</style>

      <div className="ann-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div className="ann-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1.1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.855rem', fontWeight: 600, fontFamily: 'var(--sans)', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo comunicado
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', height: 90, opacity: 1 - i * 0.18 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.3rem' }}>Sin comunicados</p>
            <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)' }}>Crea el primer comunicado para tus usuarios.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {items.map(item => (
              <div key={item.id} className="ann-card"
                style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', transition: 'box-shadow .18s' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap', marginBottom: '.45rem' }}>
                    <span style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--carbon)', fontFamily: 'var(--serif)' }}>{item.title}</span>
                    <TargetBadge value={item.target_role} />
                  </div>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.55, margin: 0, fontWeight: 300 }}>
                    {item.content.length > 120 ? item.content.slice(0, 120) + '…' : item.content}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '.72rem', color: '#B5B2AB', whiteSpace: 'nowrap' }}>
                    {new Date(item.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <button className="ann-icon-btn" onClick={() => setDeleteTarget(item)} title="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '.5rem', fontSize: '.75rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              {items.length} comunicado{items.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal: crear comunicado ── */}
      {showCreate && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) closeCreate() }}>
          <div style={MODAL}>
            <button onClick={closeCreate}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.5rem' }}>Nuevo comunicado</h2>

            <form onSubmit={handleCreate}>
              {createError && (
                <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.6rem .9rem', fontSize: '.8rem', marginBottom: '.9rem' }}>{createError}</div>
              )}

              <div style={{ marginBottom: '.85rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem', letterSpacing: '.03em' }}>Título</label>
                <input className="ann-inp" type="text" placeholder="Título del comunicado" value={title} onChange={e => setTitle(e.target.value)} required style={{ ...INP }} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem', letterSpacing: '.03em' }}>Mensaje</label>
                <textarea className="ann-inp" placeholder="Escribe el contenido del comunicado…" value={content} onChange={e => setContent(e.target.value)} required rows={5}
                  style={{ ...INP, resize: 'vertical', minHeight: 110, lineHeight: 1.55 }} />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.6rem', letterSpacing: '.03em' }}>Destinatarios</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {TARGET_OPTIONS.map(opt => {
                    const active = targetRole === opt.value
                    return (
                      <button key={opt.value} type="button" onClick={() => setTargetRole(opt.value)}
                        style={{ flex: 1, padding: '.6rem .5rem', borderRadius: 8, border: `1.5px solid ${active ? opt.border : 'var(--border)'}`, background: active ? opt.bg : 'white', color: active ? opt.color : 'var(--text-2)', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button type="submit" className="ann-btn-pub" disabled={saving}>
                {saving ? 'Publicando…' : 'Publicar comunicado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: confirmar eliminación ── */}
      {deleteTarget && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget && !deleteLoading) setDeleteTarget(null) }}>
          <div style={{ ...MODAL, maxWidth: 360 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(220,38,38,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', textAlign: 'center', marginBottom: '.5rem' }}>Eliminar comunicado</h2>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              ¿Eliminar <strong style={{ color: 'var(--carbon)' }}>"{deleteTarget.title}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
                style={{ flex: 1, padding: '.75rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                style={{ flex: 1, padding: '.75rem', background: '#dc2626', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)', opacity: deleteLoading ? .6 : 1 }}>
                {deleteLoading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="ann-toast">{toast}</div>}
    </DashboardLayout>
  )
}
