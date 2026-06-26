import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const navItems = [
  { label: 'Panel general',  path: '/dashboard',               icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: 'Usuarios',       path: '/dashboard/usuarios',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos',         path: '/dashboard/cursos',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Categorías',     path: '/dashboard/categorias',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: 'Órdenes',        path: '/dashboard/ordenes',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Certificados',   path: '/dashboard/certificados',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { label: 'Reportes',       path: '/dashboard/reportes',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Configuración',  path: '/dashboard/configuracion', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const STATUS_META = {
  draft:     { label: 'Borrador',  bg: 'rgba(113,128,126,.1)', color: 'var(--text-2)', border: '1px solid rgba(113,128,126,.2)' },
  published: { label: 'Publicado', bg: 'rgba(22,125,120,.1)',  color: 'var(--jade)',   border: '1px solid rgba(22,125,120,.22)' },
  archived:  { label: 'Archivado', bg: 'rgba(217,169,88,.12)', color: '#A87F2A',       border: '1px solid rgba(217,169,88,.3)' },
}
const LEVEL_META = {
  beginner:     { label: 'Básico',     bg: 'rgba(59,130,246,.1)',  color: '#3B7EF6', border: '1px solid rgba(59,130,246,.25)' },
  intermediate: { label: 'Intermedio', bg: 'rgba(139,92,246,.1)',  color: '#7C3AED', border: '1px solid rgba(139,92,246,.25)' },
  advanced:     { label: 'Avanzado',   bg: 'rgba(239,68,68,.1)',   color: '#DC2626', border: '1px solid rgba(239,68,68,.25)' },
}
const STATUS_TABS = [
  { label: 'Todos',     value: null },
  { label: 'Borrador',  value: 'draft' },
  { label: 'Publicado', value: 'published' },
  { label: 'Archivado', value: 'archived' },
]

function LevelBadge({ level }) {
  const m = LEVEL_META[level]
  if (!m) return null
  return <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: m.bg, color: m.color, border: m.border, whiteSpace: 'nowrap' }}>{m.label}</span>
}

function IconBtn({ onClick, title, danger, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 6, color: danger ? '#DC2626' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, minHeight: 28, transition: 'background .15s, color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,.09)' : 'var(--jade-soft)'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--jade)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--text-2)' }}>
      {children}
    </button>
  )
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(null)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => { loadCourses() }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setConfirmDelete(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function loadCourses() {
    setLoading(true)
    const { data } = await supabase
      .from('courses')
      .select('id, title, slug, cover_image_url, price, level, status, created_at, profiles!instructor_id(full_name), categories!category_id(name)')
      .order('created_at', { ascending: false })
    if (data) setCourses(data)
    setLoading(false)
  }

  async function handleStatusChange(id, newStatus) {
    const prev = courses.find(c => c.id === id)
    setCourses(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c))
    const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id)
    if (error) setCourses(cs => cs.map(c => c.id === id ? prev : c))
  }

  async function handleDelete(id) {
    setConfirmDelete(null)
    setCourses(cs => cs.filter(c => c.id !== id))
    await supabase.from('courses').delete().eq('id', id)
  }

  const filtered = courses.filter(c => {
    if (activeTab && c.status !== activeTab) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      (c.title || '').toLowerCase().includes(q) ||
      (c.profiles?.full_name || '').toLowerCase().includes(q) ||
      (c.categories?.name || '').toLowerCase().includes(q)
    )
  })

  return (
    <DashboardLayout navItems={navItems}>
      <style>{`
        .cp-tab { padding: .38rem .9rem; border-radius: 6px; border: none; cursor: pointer; font-size: .82rem; font-weight: 500; font-family: var(--sans); transition: background .15s, color .15s; white-space: nowrap; }
        .cp-course-card { background: white; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: box-shadow .18s; }
        .cp-course-card:hover { box-shadow: 0 4px 18px rgba(23,26,28,.08); }
        .cp-status-sel { width: 130px; padding: .35rem .6rem; background: var(--cream); border: 1px solid var(--border); border-radius: 6px; color: var(--carbon); font-size: .78rem; font-weight: 500; font-family: var(--sans); outline: none; cursor: pointer; }
        .cp-status-sel:focus { border-color: var(--jade); }
        @media (max-width: 768px) {
          .cp-pad { padding: 1.25rem 1rem 2rem !important; }
          .cp-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .cp-search { max-width: 100% !important; }
          .cp-tabs { overflow-x: auto !important; scrollbar-width: none; }
          .cp-tabs::-webkit-scrollbar { display: none; }
          .cp-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="cp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Cursos</h1>
          </div>
          <button onClick={() => navigate('/dashboard/cursos/nuevo')}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1.1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.855rem', fontWeight: 600, fontFamily: 'var(--sans)', cursor: 'pointer', transition: 'background .2s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--jade)'}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo curso
          </button>
        </div>

        {/* Toolbar */}
        <div className="cp-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="cp-search" style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar cursos..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.6rem .75rem .6rem 2rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <div className="cp-tabs" style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
            {STATUS_TABS.map(tab => (
              <button key={tab.label} className="cp-tab" onClick={() => setActiveTab(tab.value)}
                style={{ background: activeTab === tab.value ? 'var(--jade-soft)' : 'transparent', color: activeTab === tab.value ? 'var(--jade)' : 'var(--text-2)' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>Cargando cursos…</div>
        ) : courses.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.45rem' }}>Todavía no hay cursos</h2>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: '1.5rem', maxWidth: 320, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>Crea el primer curso de la plataforma y empieza a construir el catálogo.</p>
            <button onClick={() => navigate('/dashboard/cursos/nuevo')}
              style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Crear primer curso
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>No se encontraron cursos.</div>
        ) : (
          <>
            <div className="cp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {filtered.map(c => {
                const sm = STATUS_META[c.status] || STATUS_META.draft
                return (
                  <div key={c.id} className="cp-course-card">
                    {/* Cover image */}
                    {c.cover_image_url ? (
                      <img src={c.cover_image_url} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block', borderBottom: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ width: '100%', height: 140, background: 'var(--jade-soft)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                      </div>
                    )}

                    {/* Body */}
                    <div style={{ padding: '1.1rem 1.2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                      {/* Title */}
                      <div>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.3 }}>{c.title}</div>
                        {c.slug && <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginTop: 2 }}>{c.slug}</div>}
                      </div>

                      {/* Meta row */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                        {c.profiles?.full_name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: 'var(--text-2)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            {c.profiles.full_name}
                          </div>
                        )}
                        {c.categories?.name && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: 'var(--text-2)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/></svg>
                            {c.categories.name}
                          </div>
                        )}
                      </div>

                      {/* Badges row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
                        <LevelBadge level={c.level} />
                        <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: sm.bg, color: sm.color, border: sm.border }}>{sm.label}</span>
                      </div>

                      {/* Footer: price + status select + actions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '.6rem', borderTop: '1px solid var(--border)' }}>
                        <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', fontFamily: 'var(--serif)' }}>
                          {c.price != null ? `$${Number(c.price).toFixed(2)}` : 'Gratis'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          {/* Inline status select */}
                          <select className="cp-status-sel" value={c.status || 'draft'}
                            onChange={e => handleStatusChange(c.id, e.target.value)}>
                            <option value="draft">Borrador</option>
                            <option value="published">Publicado</option>
                            <option value="archived">Archivado</option>
                          </select>

                          {/* Edit */}
                          <IconBtn title="Editar curso" onClick={() => navigate(`/dashboard/cursos/${c.id}/editar`)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </IconBtn>

                          {/* Delete */}
                          {confirmDelete === c.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => handleDelete(c.id)} style={{ fontSize: '.72rem', fontWeight: 700, color: '#DC2626', background: 'rgba(239,68,68,.09)', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Sí</button>
                              <button onClick={() => setConfirmDelete(null)} style={{ fontSize: '.72rem', color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>No</button>
                            </div>
                          ) : (
                            <IconBtn title="Eliminar curso" danger onClick={() => setConfirmDelete(c.id)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </IconBtn>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '.75rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              {filtered.length} curso{filtered.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
