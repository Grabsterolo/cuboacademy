import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'

const STATUS = {
  published: { label: 'Publicado', bg: 'var(--jade-soft)', color: 'var(--jade)',  border: 'rgba(22,125,120,.25)' },
  draft:     { label: 'Borrador',  bg: '#F5F5F0',          color: '#9B9894',      border: 'var(--border)' },
  archived:  { label: 'Archivado', bg: '#FEF2F2',          color: '#B91C1C',      border: '#FECACA' },
}
const LEVEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const TABS  = [
  { value: null,        label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'draft',     label: 'Borradores' },
  { value: 'archived',  label: 'Archivados' },
]

const BOOK = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>

export default function InstructorCoursesPage() {
  const { profile } = useAuth()
  const { navigate } = useNavigation()
  const [courses, setCourses] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    supabase.from('courses')
      .select('id, title, cover_image_url, level, status, categories(name), created_at')
      .eq('instructor_id', profile.id)
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const list = data || []
        setCourses(list)
        if (list.length > 0) {
          const ids = list.map(c => c.id)
          const { data: enr } = await supabase.from('enrollments').select('course_id').in('course_id', ids)
          const map = {}
          ;(enr || []).forEach(r => { map[r.course_id] = (map[r.course_id] || 0) + 1 })
          setCounts(map)
        }
        setLoading(false)
      })
  }, [profile?.id])

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    return (
      (!tab || c.status === tab) &&
      (!q || c.title.toLowerCase().includes(q) || c.categories?.name?.toLowerCase().includes(q))
    )
  })

  const totalStudents = Object.values(counts).reduce((s, n) => s + n, 0)
  const stats = [
    { label: 'Total cursos',    value: courses.length },
    { label: 'Publicados',      value: courses.filter(c => c.status === 'published').length },
    { label: 'Borradores',      value: courses.filter(c => c.status === 'draft').length },
    { label: 'Estudiantes',     value: totalStudents },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .ic-pad { padding: 1.25rem 1rem 2rem !important; } .ic-stats { grid-template-columns: 1fr 1fr !important; } }
        .ic-card { background: white; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 1rem; padding: .9rem 1.25rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .ic-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.08); border-color: rgba(22,125,120,.2); }
        .ic-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .ic-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade); }
      `}</style>

      <div className="ic-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis cursos</h1>
          </div>
          <button onClick={() => navigate('curso-wizard')}
            style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1.2rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.865rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo curso
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="ic-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.75rem' }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.25rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar por título o categoría…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={String(t.value)} onClick={() => setTab(t.value)} className={`ic-tab${tab === t.value ? ' active' : ''}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 82, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', maxWidth: 440 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{BOOK}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {courses.length === 0 ? 'Aún no tienes cursos' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB', marginBottom: courses.length === 0 ? '1.5rem' : 0 }}>
              {courses.length === 0 ? 'Crea tu primer curso y comparte tu conocimiento.' : 'Prueba con otros filtros o términos.'}
            </p>
            {courses.length === 0 && (
              <button onClick={() => navigate('curso-wizard')}
                style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Crear mi primer curso
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {filtered.map(c => {
                const st = STATUS[c.status] || STATUS.draft
                const n  = counts[c.id] || 0
                return (
                  <div key={c.id} className="ic-card" onClick={() => navigate('curso-estructura', { courseId: c.id })}>
                    <div style={{ width: 64, height: 48, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                      {c.cover_image_url && <img src={c.cover_image_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.28rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
                        {c.categories?.name && <span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{c.categories.name}</span>}
                        {c.level && <><span style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{LEVEL[c.level] || c.level}</span></>}
                        <span style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span>
                        <span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{new Date(c.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0 }}>
                      {n > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--text-2)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          {n}
                        </div>
                      )}
                      <span style={{ fontSize: '.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
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
    </DashboardLayout>
  )
}
