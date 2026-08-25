import { useState, useEffect } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { formatEventDateTime } from '../../../lib/formatDate'
import { runQuery } from '../../../lib/db'
import { ErrorState } from '../../../components/ui/ErrorState'

const MODALITY_LABEL = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }
const TABS = [
  { value: 'upcoming', label: 'Próximos' },
  { value: 'past',     label: 'Pasados' },
]

const CALENDAR = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

export default function StudentEventsPage() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadErr, setLoadErr] = useState(null)
  const [tab, setTab]                 = useState('upcoming')
  const [search, setSearch]           = useState('')

  useEffect(() => {
    if (!user) return
    runQuery(
      supabase.from('enrollments')
        .select('id, enrolled_at, completed_at, course_id, courses!inner(id, slug, title, cover_image_url, modality, event_start_at, location, categories(name), profiles!instructor_id(full_name))')
        .eq('student_id', user.id)
        .eq('courses.type', 'event')
        .order('enrolled_at', { ascending: false }),
      'StudentEventsPage: mis eventos',
    ).then(({ data, error }) => { setLoadErr(error); setEnrollments(data || []); setLoading(false) })
  }, [user])

  const now = Date.now()
  const upcoming = enrollments.filter(e => !e.courses?.event_start_at || new Date(e.courses.event_start_at).getTime() >= now)
  const past     = enrollments.filter(e => e.courses?.event_start_at && new Date(e.courses.event_start_at).getTime() < now)
  const base     = tab === 'upcoming' ? upcoming : past

  const q = search.toLowerCase()
  const shown = base.filter(e => {
    if (!q) return true
    const c = e.courses
    return (c?.title || '').toLowerCase().includes(q) ||
           (c?.categories?.name || '').toLowerCase().includes(q) ||
           (c?.profiles?.full_name || '').toLowerCase().includes(q)
  })

  const stats = [
    { label: 'Próximos',            value: upcoming.length },
    { label: 'Pasados',             value: past.length },
    { label: 'Total inscripciones', value: enrollments.length },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .se-pad { padding: 1.25rem 1rem 2rem !important; } .se-stats { grid-template-columns: 1fr 1fr !important; } }
        .se-card { background: white; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 1rem; padding: .9rem 1.25rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .se-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.08); border-color: rgba(22,125,120,.2); }
        .se-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .se-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade-ink); }
      `}</style>

      <div className="se-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis eventos</h1>
          </div>
          <button onClick={() => navigate('tienda', { tab: 'events' })}
            style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1.2rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.865rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Explorar eventos
          </button>
        </div>

        {/* Stats */}
        {!loading && enrollments.length > 0 && (
          <div className="se-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1.75rem' }}>
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
            <input type="text" placeholder="Buscar por título, categoría o instructor…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.value} onClick={() => setTab(t.value)} className={`se-tab${tab === t.value ? ' active' : ''}`}>
                {t.label} {!loading && `(${t.value === 'upcoming' ? upcoming.length : past.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 90, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : loadErr ? (
          <ErrorState
            title="No pudimos cargar tus eventos"
            description="Falló la consulta. Si tienes eventos inscritos, siguen ahí — es la lista la que no cargó."
            error={loadErr}
            onRetry={() => window.location.reload()}
          />
        ) : shown.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{CALENDAR}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {tab === 'upcoming' ? 'Sin eventos próximos' : 'Sin eventos pasados'}
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--text-3)', marginBottom: enrollments.length === 0 ? '1.5rem' : 0 }}>
              {tab === 'upcoming' ? 'Explora el catálogo y reserva tu cupo.' : 'Aquí aparecerán los eventos a los que ya asististe.'}
            </p>
            {enrollments.length === 0 && (
              <button onClick={() => navigate('tienda', { tab: 'events' })}
                style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Explorar eventos
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {shown.map(enr => {
                const c = enr.courses
                if (!c) return null
                const goToDetail = () => navigate('evento-detalle', { slug: c.slug })
                return (
                  <div key={enr.id} className="se-card" onClick={goToDetail} role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetail() } }}>
                    {/* Thumbnail */}
                    <div style={{ width: 64, height: 54, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                      {c.cover_image_url && <img src={c.cover_image_url} alt={c.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.22rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
                        {c.categories?.name && <span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{c.categories.name}</span>}
                        {c.modality && <><span style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{MODALITY_LABEL[c.modality] || c.modality}</span></>}
                        {c.event_start_at && <><span style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{formatEventDateTime(c.event_start_at)}</span></>}
                      </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0, alignSelf: 'center' }}>
                      {enr.completed_at && (
                        <span style={{ fontSize: '.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: 'var(--jade-soft)', color: 'var(--jade-ink)', border: '1px solid rgba(22,125,120,.25)' }}>✓ Asististe</span>
                      )}
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
              {shown.length} de {enrollments.length} inscripci{enrollments.length !== 1 ? 'ones' : 'ón'}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
