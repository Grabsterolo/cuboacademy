import { useEffect, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { IconBtn, Toast } from '../../../components/ui'
import { VisibilityBadge } from '../../../components/dashboard/VisibilityBadge'

const STATUS_LABEL = {
  draft: 'Borrador', pending: 'En revisión', published: 'Publicado', archived: 'Archivado',
}
const LEVEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const TABS = [
  { value: null,        label: 'Todos' },
  { value: 'pending',   label: 'En revisión' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft',     label: 'Borradores' },
  { value: 'archived',  label: 'Archivados' },
]

const BOOK = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>

// Plain native dropdown, one consistent visual style for every status —
// no per-word color coding (that read as noisy/confusing next to the
// other badges in the row).
function StatusSelect({ status, onChange }) {
  return (
    <select value={status} onChange={e => onChange(e.target.value)}
      title={status === 'published' ? 'Para despublicar, elige Borrador o Archivado' : 'Publicar requiere revisar el curso — usa "Ver detalle"'}
      style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', padding: '5px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'white', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
      {Object.entries(STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value} disabled={value === 'published' && status !== 'published'}>
          {label}
        </option>
      ))}
    </select>
  )
}

export default function CoursesPage() {
  const { navigate } = useNavigation()
  const [courses,       setCourses]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState(null)
  const [search,        setSearch]        = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [toast,         setToast]         = useState('')
  const [topCourseId,   setTopCourseId]   = useState(null)

  useEffect(() => { load() }, [])
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') setConfirmDelete(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function load() {
    setLoading(true)
    // Top-seller is computed server-side (get_top_selling_course RPC) instead
    // of fetching every completed order to the browser just to count them.
    const [{ data }, { data: topId }] = await Promise.all([
      supabase
        .from('courses')
        .select('id, title, cover_image_url, price, level, status, visibility, created_at, profiles!instructor_id(full_name), categories!category_id(name)')
        .eq('type', 'course')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.rpc('get_top_selling_course'),
    ])
    setCourses(data || [])
    if (topId) setTopCourseId(topId)
    setLoading(false)
  }

  async function handleStatusChange(id, newStatus) {
    const prev = courses.find(c => c.id === id)
    if (prev?.status === 'published' && newStatus !== 'published') {
      const ok = window.confirm(`"${prev.title}" está publicado. ¿Seguro que quieres cambiarlo a "${STATUS_LABEL[newStatus] || newStatus}"? Dejará de verse en el catálogo.`)
      if (!ok) return
    }
    setCourses(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c))
    const { error } = await supabase.from('courses').update({ status: newStatus }).eq('id', id)
    if (error) setCourses(cs => cs.map(c => c.id === id ? prev : c))
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  async function handleDelete(id) {
    setConfirmDelete(null)
    const prev = courses
    setCourses(cs => cs.filter(c => c.id !== id))
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) {
      setCourses(prev)
      const isOrdersConflict = error.code === '23503'
      showToast(isOrdersConflict
        ? 'No se pudo eliminar: el curso tiene órdenes de compra asociadas.'
        : 'Error al eliminar: ' + (error.message || 'inténtalo de nuevo.'))
    }
  }

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    return (
      (!tab || c.status === tab) &&
      (!q || (c.title || '').toLowerCase().includes(q) ||
             (c.profiles?.full_name || '').toLowerCase().includes(q) ||
             (c.categories?.name || '').toLowerCase().includes(q))
    )
  })

  const stats = [
    { label: 'Total cursos',  value: courses.length },
    { label: 'En revisión',   value: courses.filter(c => c.status === 'pending').length },
    { label: 'Publicados',    value: courses.filter(c => c.status === 'published').length },
    { label: 'Borradores',    value: courses.filter(c => c.status === 'draft').length },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .cp-pad { padding: 1.25rem 1rem 2rem !important; } .cp-stats { grid-template-columns: 1fr 1fr !important; } .cp-tabs { overflow-x: auto; scrollbar-width: none; } .cp-tabs::-webkit-scrollbar { display: none; } }
        .cp-card { background: white; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 1rem; padding: .9rem 1.25rem; transition: box-shadow .18s, border-color .18s; }
        .cp-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.08); border-color: rgba(22,125,120,.2); }
        .cp-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .cp-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade-ink); }
      `}</style>

      <div className="cp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Cursos</h1>
          </div>
          <button onClick={() => navigate('curso-wizard')}
            style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1.2rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.865rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo curso
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="cp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.75rem' }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.25rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar por título, instructor o categoría…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div className="cp-tabs" style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={String(t.value)} onClick={() => setTab(t.value)} className={`cp-tab${tab === t.value ? ' active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 82, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{BOOK}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {courses.length === 0 ? 'Todavía no hay cursos' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--text-3)', marginBottom: courses.length === 0 ? '1.5rem' : 0 }}>
              {courses.length === 0 ? 'Crea el primer curso de la plataforma.' : 'Prueba con otros filtros o términos.'}
            </p>
            {courses.length === 0 && (
              <button onClick={() => navigate('curso-wizard')}
                style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Crear primer curso
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {filtered.map(c => {
                return (
                  <div key={c.id} className="cp-card">
                    {/* Thumbnail */}
                    <div style={{ width: 64, height: 48, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                      {c.cover_image_url && <img src={c.cover_image_url} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '.28rem' }}>
                        <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                        <VisibilityBadge visibility={c.visibility} />
                        {c.id === topCourseId && (
                          <span title="El curso con más órdenes completadas" style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '.65rem', fontWeight: 700, color: '#8F5A0B', background: '#F5E9D3', border: '1px solid #EAD6A8', borderRadius: 8, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.9L22 9.8l-5.5 4.9L18 22l-6-3.6L6 22l1.5-7.3L2 9.8l7.1-.9L12 2z"/></svg>
                            Más vendido
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
                        {c.profiles?.full_name && <span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{c.profiles.full_name}</span>}
                        {c.categories?.name && <><span aria-hidden="true" style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{c.categories.name}</span></>}
                        {c.level && <><span aria-hidden="true" style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{LEVEL[c.level] || c.level}</span></>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      <StatusSelect status={c.status} onChange={v => handleStatusChange(c.id, v)} />

                      {c.status !== 'published' && c.status !== 'archived' && (
                        <button onClick={() => navigate('curso-revision', { courseId: c.id })} title="Abrir detalle del curso"
                          style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '4px 10px', background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 6, color: '#A16207', fontSize: '.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', whiteSpace: 'nowrap' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          Ver detalle
                        </button>
                      )}

                      <IconBtn title="Editar curso" onClick={() => navigate('curso-wizard', { courseId: c.id })}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </IconBtn>

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
                )
              })}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
              {filtered.length} de {courses.length} curso{courses.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      <Toast message={toast} />
    </DashboardLayout>
  )
}
