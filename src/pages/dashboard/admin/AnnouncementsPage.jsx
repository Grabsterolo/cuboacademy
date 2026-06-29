import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../context/AuthContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

// ── Tipos de comunicado ─────────────────────────────────────────────────────
const TYPES = [
  {
    value: 'general',
    label: 'Aviso general',
    color: '#71807E',
    bg: 'rgba(113,128,126,.1)',
    border: 'rgba(113,128,126,.25)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    value: 'news',
    label: 'Novedad',
    color: 'var(--jade)',
    bg: 'var(--jade-soft)',
    border: 'rgba(22,125,120,.3)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    value: 'maintenance',
    label: 'Mantenimiento',
    color: '#D97706',
    bg: 'rgba(217,119,6,.1)',
    border: 'rgba(217,119,6,.3)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
  },
  {
    value: 'event',
    label: 'Evento',
    color: '#3B7EF6',
    bg: 'rgba(59,126,246,.1)',
    border: 'rgba(59,126,246,.3)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
]

// ── Destinatarios ───────────────────────────────────────────────────────────
const TARGETS = [
  {
    value: 'all',
    label: 'Todos',
    desc: 'Estudiantes e instructores',
    color: '#3B7EF6',
    bg: 'rgba(59,126,246,.08)',
    border: 'rgba(59,126,246,.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    value: 'student',
    label: 'Estudiantes',
    desc: 'Solo estudiantes',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,.08)',
    border: 'rgba(139,92,246,.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    value: 'instructor',
    label: 'Instructores',
    desc: 'Solo instructores',
    color: 'var(--jade)',
    bg: 'var(--jade-soft)',
    border: 'rgba(22,125,120,.3)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
        <line x1="12" y1="14" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
      </svg>
    ),
  },
]

function typeInfo(val)   { return TYPES.find(t => t.value === val)   || TYPES[0] }
function targetInfo(val) { return TARGETS.find(t => t.value === val) || TARGETS[0] }

function TypeBadge({ value }) {
  const t = typeInfo(value)
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, flexShrink: 0 }}>
      {t.label}
    </span>
  )
}

function TargetBadge({ value }) {
  const t = targetInfo(value)
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}`, flexShrink: 0 }}>
      {t.label}
    </span>
  )
}

const MAX_CHARS = 800

export default function AnnouncementsPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [annType, setAnnType] = useState('general')
  const [targetRole, setTargetRole] = useState('all')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Read modal
  const [readItem, setReadItem] = useState(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(null)
  const [filterTarget, setFilterTarget] = useState(null)

  useEffect(() => { load() }, [])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') { closeCreate(); setDeleteTarget(null); setReadItem(null) } }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('id, title, content, type, target_role, created_at')
      .order('created_at', { ascending: false })
    if (data) setItems(data)
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3200) }

  function closeCreate() {
    setShowCreate(false); setTitle(''); setContent('')
    setAnnType('general'); setTargetRole('all'); setCreateError('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) { setCreateError('Completa todos los campos.'); return }
    setSaving(true); setCreateError('')
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title: title.trim(), content: content.trim(), type: annType, target_role: targetRole, created_by: profile?.id })
      .select().single()
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
    if (error) showToast('Error al eliminar.')
    else { setItems(prev => prev.filter(i => i.id !== deleteTarget.id)); showToast('Comunicado eliminado.') }
    setDeleteTarget(null)
  }

  const filtered = items.filter(item => {
    const q = search.toLowerCase()
    return (
      (!filterType   || item.type        === filterType) &&
      (!filterTarget || item.target_role === filterTarget) &&
      (!q || item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q))
    )
  })

  const OVERLAY = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(23,26,28,.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }

  return (
    <DashboardLayout>
      <style>{`
        .ann-inp { width: 100%; padding: .75rem 1rem; background: var(--cream); border: 1.5px solid var(--border); border-radius: 9px; color: var(--carbon); font-size: .93rem; outline: none; font-family: var(--sans); box-sizing: border-box; transition: border-color .18s, background .18s; }
        .ann-inp:focus { border-color: var(--jade); background: white; }
        .ann-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: var(--text-2); display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; min-width: 30px; min-height: 30px; }
        .ann-icon-btn:hover { background: rgba(220,38,38,.09); color: #dc2626; }
        .ann-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: var(--carbon); color: white; padding: .65rem 1.25rem; border-radius: 8px; font-size: .84rem; font-family: var(--sans); font-weight: 500; z-index: 400; white-space: nowrap; box-shadow: 0 4px 20px rgba(23,26,28,.2); pointer-events: none; }
        .ann-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.15rem 1.35rem; display: flex; align-items: flex-start; gap: 1rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .ann-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.07); border-color: rgba(22,125,120,.25); }
        .type-opt { flex: 1; display: flex; flex-direction: column; align-items: center; gap: .45rem; padding: .9rem .5rem; border-radius: 10px; border: 1.5px solid var(--border); background: white; cursor: pointer; transition: all .15s; font-size: .75rem; font-weight: 600; font-family: var(--sans); color: var(--text-2); }
        .type-opt:hover { border-color: var(--jade); color: var(--carbon); }
        .target-opt { flex: 1; display: flex; align-items: center; gap: .6rem; padding: .75rem .9rem; border-radius: 9px; border: 1.5px solid var(--border); background: white; cursor: pointer; transition: all .15s; font-family: var(--sans); }
        .target-opt:hover { border-color: var(--jade); }
        .ann-pub-btn { width: 100%; padding: .95rem; background: var(--jade); color: white; border: none; border-radius: 10px; font-size: .93rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: background .2s, opacity .2s; }
        .ann-pub-btn:hover { background: var(--jade-dark); }
        .ann-pub-btn:disabled { opacity: .55; cursor: not-allowed; }
        .section-label { font-size: .72rem; font-weight: 700; color: var(--text-2); letter-spacing: .07em; text-transform: uppercase; margin-bottom: .6rem; }
        @media (max-width: 768px) {
          .ann-pad { padding: 1.25rem 1rem 2rem !important; }
          .ann-header-row { flex-direction: column !important; align-items: flex-start !important; }
          .type-grid { flex-wrap: wrap !important; }
          .type-opt { min-width: calc(50% - .25rem); }
          .target-grid { flex-direction: column !important; }
        }
      `}</style>

      <div className="ann-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div className="ann-header-row" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.55rem 1.15rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.855rem', fontWeight: 600, fontFamily: 'var(--sans)', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo comunicado
          </button>
        </div>

        {/* ── Filtros ── */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {/* Búsqueda */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar comunicado…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.58rem .85rem .58rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '.85rem 0' }} />

          {/* Tipo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.6rem' }}>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.07em', textTransform: 'uppercase', width: 88, flexShrink: 0 }}>Tipo</span>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
              {[{ value: null, label: 'Todos' }, ...TYPES.map(t => ({ value: t.value, label: t.label }))].map(opt => {
                const active = filterType === opt.value
                const t = opt.value ? typeInfo(opt.value) : null
                return (
                  <button key={String(opt.value)} onClick={() => setFilterType(opt.value)}
                    style={{ padding: '.27rem .7rem', borderRadius: 20, border: `1.5px solid ${active ? (t?.border || 'rgba(22,125,120,.4)') : 'var(--border)'}`, background: active ? (t?.bg || 'var(--jade-soft)') : 'transparent', color: active ? (t?.color || 'var(--jade)') : 'var(--text-2)', fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Destinatario */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.07em', textTransform: 'uppercase', width: 88, flexShrink: 0 }}>Destinatario</span>
            <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
              {[{ value: null, label: 'Todos' }, ...TARGETS.map(t => ({ value: t.value, label: t.label }))].map(opt => {
                const active = filterTarget === opt.value
                const tgt = opt.value ? targetInfo(opt.value) : null
                return (
                  <button key={String(opt.value)} onClick={() => setFilterTarget(opt.value)}
                    style={{ padding: '.27rem .7rem', borderRadius: 20, border: `1.5px solid ${active ? (tgt?.border || 'rgba(22,125,120,.4)') : 'var(--border)'}`, background: active ? (tgt?.bg || 'var(--jade-soft)') : 'transparent', color: active ? (tgt?.color || 'var(--jade)') : 'var(--text-2)', fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 90, opacity: 1 - i * 0.18 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', color: 'var(--jade)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.3rem' }}>
              {items.length === 0 ? 'Sin comunicados' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)' }}>
              {items.length === 0 ? 'Crea el primer comunicado para tus usuarios.' : 'Prueba con otros filtros o términos de búsqueda.'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              {filtered.map(item => (
                <div key={item.id} className="ann-card" onClick={() => setReadItem(item)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', flexWrap: 'wrap', marginBottom: '.45rem' }}>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)' }}>{item.title}</span>
                      <TypeBadge value={item.type} />
                      <TargetBadge value={item.target_role} />
                    </div>
                    <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.55, margin: 0, fontWeight: 300 }}>
                      {item.content.length > 130 ? item.content.slice(0, 130) + '…' : item.content}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '.72rem', color: '#B5B2AB', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <button className="ann-icon-btn" onClick={e => { e.stopPropagation(); setDeleteTarget(item) }} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: '.75rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              {filtered.length} de {items.length} comunicado{items.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: crear comunicado ── */}
      {showCreate && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) closeCreate() }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(23,26,28,.22)', position: 'relative' }}>

            {/* Modal header */}
            <div style={{ padding: '1.75rem 2rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '18px 18px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <div style={{ width: 38, height: 38, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <div>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Nuevo comunicado</h2>
                  <p style={{ fontSize: '.75rem', color: 'var(--text-2)', margin: 0, marginTop: '.1rem' }}>Completa los campos para publicar</p>
                </div>
              </div>
              <button onClick={closeCreate}
                style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} style={{ padding: '1.75rem 2rem 2rem' }}>
              {createError && (
                <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 8, padding: '.65rem 1rem', fontSize: '.82rem', marginBottom: '1.25rem' }}>{createError}</div>
              )}

              {/* Título */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="section-label">Título</p>
                <input className="ann-inp" type="text" placeholder="Escribe el título del comunicado…" value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} />
              </div>

              {/* Tipo de comunicado */}
              <div style={{ marginBottom: '1.25rem' }}>
                <p className="section-label">Tipo de comunicado</p>
                <div className="type-grid" style={{ display: 'flex', gap: '.5rem' }}>
                  {TYPES.map(t => {
                    const active = annType === t.value
                    return (
                      <button key={t.value} type="button" className="type-opt"
                        onClick={() => setAnnType(t.value)}
                        style={{ border: `1.5px solid ${active ? t.border : 'var(--border)'}`, background: active ? t.bg : 'white', color: active ? t.color : 'var(--text-2)' }}>
                        <span style={{ color: active ? t.color : 'var(--text-2)' }}>{t.icon}</span>
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Mensaje */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                  <p className="section-label" style={{ margin: 0 }}>Mensaje</p>
                  <span style={{ fontSize: '.7rem', color: content.length > MAX_CHARS * 0.9 ? '#D97706' : '#B5B2AB', fontFamily: 'var(--sans)' }}>{content.length}/{MAX_CHARS}</span>
                </div>
                <textarea className="ann-inp" placeholder="Escribe el contenido del comunicado aquí…" value={content} onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))} required rows={6}
                  style={{ resize: 'vertical', minHeight: 130, lineHeight: 1.6 }} />
              </div>

              {/* Destinatarios */}
              <div style={{ marginBottom: '1.75rem' }}>
                <p className="section-label">Destinatarios</p>
                <div className="target-grid" style={{ display: 'flex', gap: '.5rem' }}>
                  {TARGETS.map(t => {
                    const active = targetRole === t.value
                    return (
                      <button key={t.value} type="button" className="target-opt"
                        onClick={() => setTargetRole(t.value)}
                        style={{ border: `1.5px solid ${active ? t.border : 'var(--border)'}`, background: active ? t.bg : 'white' }}>
                        <span style={{ width: 32, height: 32, borderRadius: 8, background: active ? t.bg : 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? t.color : 'var(--text-2)', flexShrink: 0, border: `1px solid ${active ? t.border : 'var(--border)'}` }}>{t.icon}</span>
                        <div>
                          <div style={{ fontSize: '.82rem', fontWeight: 700, color: active ? t.color : 'var(--carbon)', fontFamily: 'var(--sans)' }}>{t.label}</div>
                          <div style={{ fontSize: '.7rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>{t.desc}</div>
                        </div>
                        {active && (
                          <svg style={{ marginLeft: 'auto', flexShrink: 0, color: t.color }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="ann-pub-btn" disabled={saving}>
                {saving ? 'Publicando…' : 'Publicar comunicado'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: leer comunicado ── */}
      {readItem && (() => {
        const t = typeInfo(readItem.type)
        const tgt = targetInfo(readItem.target_role)
        return (
          <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) setReadItem(null) }}>
            <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(23,26,28,.28)', overflow: 'hidden' }}>

              {/* Barra de acento */}
              <div style={{ height: 5, background: t.color, flexShrink: 0 }} />

              {/* Cabecera */}
              <div style={{ padding: '1.75rem 2rem 1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: t.bg, border: `1.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color, flexShrink: 0 }}>
                    <span style={{ transform: 'scale(1.3)', display: 'flex' }}>{t.icon}</span>
                  </div>
                  <button onClick={() => setReadItem(null)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap', marginBottom: '.85rem' }}>
                  <TypeBadge value={readItem.type} />
                  <TargetBadge value={readItem.target_role} />
                </div>

                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.28, margin: '0 0 1.25rem' }}>{readItem.title}</h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem .85rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 9 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: '.78rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', fontWeight: 500 }}>
                      {new Date(readItem.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem .85rem', background: tgt.bg, border: `1px solid ${tgt.border}`, borderRadius: 9 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tgt.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: '.78rem', color: tgt.color, fontFamily: 'var(--sans)', fontWeight: 600 }}>{tgt.label}</span>
                  </div>
                </div>
              </div>

              {/* Separador */}
              <div style={{ height: 1, background: 'var(--border)', margin: '0 2rem', flexShrink: 0 }} />

              {/* Contenido */}
              <div style={{ padding: '1.75rem 2rem 2.25rem', overflowY: 'auto' }}>
                <p style={{ fontSize: '.96rem', color: 'var(--carbon)', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 300 }}>{readItem.content}</p>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Modal: confirmar eliminación ── */}
      {deleteTarget && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget && !deleteLoading) setDeleteTarget(null) }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2.25rem', width: '100%', maxWidth: 360, boxShadow: '0 24px 60px rgba(23,26,28,.2)' }}>
            <div style={{ width: 48, height: 48, background: 'rgba(220,38,38,.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', textAlign: 'center', marginBottom: '.5rem' }}>Eliminar comunicado</h2>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              ¿Eliminar <strong style={{ color: 'var(--carbon)' }}>"{deleteTarget.title}"</strong>?<br />Esta acción no se puede deshacer.
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
