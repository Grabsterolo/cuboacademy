import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'
import { STATUS_TONE, IconBtn } from '../../../components/ui'
import { formatEventDateTime } from '../../../lib/formatDate'
import { runQuery } from '../../../lib/db'

const STATUS = {
  published: { label: 'Publicado',   ...STATUS_TONE.success },
  pending:   { label: 'En revisión', ...STATUS_TONE.warning },
  draft:     { label: 'Borrador',    ...STATUS_TONE.neutral },
  archived:  { label: 'Archivado',   ...STATUS_TONE.danger },
}
const MODALITY_LABEL = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }
const TABS  = [
  { value: null,        label: 'Todos' },
  { value: 'published', label: 'Publicados' },
  { value: 'pending',   label: 'En revisión' },
  { value: 'draft',     label: 'Borradores' },
  { value: 'archived',  label: 'Archivados' },
]

const CALENDAR = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

export default function InstructorEventsPage() {
  const { profile } = useAuth()
  const { navigate } = useNavigation()
  const [events, setEvents] = useState([])
  const [counts, setCounts] = useState({})
  const [totalStudents, setTotalStudents] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile?.id) return
    setLoading(true)
    supabase.from('courses')
      .select('id, title, cover_image_url, modality, event_start_at, status, admin_notes, categories(name), created_at')
      .eq('instructor_id', profile.id)
      .eq('type', 'event')
      .order('created_at', { ascending: false })
      .then(async ({ data }) => {
        const list = data || []
        setEvents(list)
        if (list.length > 0) {
          const ids = list.map(e => e.id)
          const { data: enr } = await runQuery(
            supabase.from('enrollments').select('course_id, student_id').in('course_id', ids),
            'InstructorEventsPage: consulta 1',
          )
          const map = {}
          ;(enr || []).forEach(r => { map[r.course_id] = (map[r.course_id] || 0) + 1 })
          setCounts(map)
          setTotalStudents(new Set((enr || []).map(r => r.student_id)).size)
        }
        setLoading(false)
      })
  }, [profile?.id])

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    return (
      (!tab || e.status === tab) &&
      (!q || e.title.toLowerCase().includes(q) || e.categories?.name?.toLowerCase().includes(q))
    )
  })

  const stats = [
    { label: 'Total eventos',   value: events.length },
    { label: 'Publicados',      value: events.filter(e => e.status === 'published').length },
    { label: 'Borradores',      value: events.filter(e => e.status === 'draft').length },
    { label: 'Inscritos',       value: totalStudents },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .ie-pad { padding: 1.25rem 1rem 2rem !important; } .ie-stats { grid-template-columns: 1fr 1fr !important; } }
        .ie-card { background: white; border: 1px solid var(--border); border-radius: 12px; display: flex; align-items: center; gap: 1rem; padding: .9rem 1.25rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .ie-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.08); border-color: rgba(22,125,120,.2); }
        .ie-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .ie-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade-ink); }
      `}</style>

      <div className="ie-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis eventos</h1>
          </div>
          <button onClick={() => navigate('evento-wizard')}
            style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1.2rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.865rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo evento
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="ie-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.75rem', marginBottom: '1.75rem' }}>
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
              style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .18s' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={String(t.value)} onClick={() => setTab(t.value)} className={`ie-tab${tab === t.value ? ' active' : ''}`}>
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
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{CALENDAR}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {events.length === 0 ? 'Aún no tienes eventos' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: '.82rem', color: 'var(--text-3)', marginBottom: events.length === 0 ? '1.5rem' : 0 }}>
              {events.length === 0 ? 'Crea tu primer evento y compártelo con tus estudiantes.' : 'Prueba con otros filtros o términos.'}
            </p>
            {events.length === 0 && (
              <button onClick={() => navigate('evento-wizard')}
                style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Crear mi primer evento
              </button>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
              {filtered.map(e => {
                const st = STATUS[e.status] || STATUS.draft
                const n  = counts[e.id] || 0
                return (
                  <div key={e.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="ie-card" onClick={() => navigate('evento-wizard', { eventId: e.id })}>
                    <div style={{ width: 64, height: 48, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                      {e.cover_image_url && <img src={e.cover_image_url} alt={e.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.28rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexWrap: 'wrap' }}>
                        {e.categories?.name && <span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{e.categories.name}</span>}
                        {e.modality && <><span aria-hidden="true" style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{MODALITY_LABEL[e.modality] || e.modality}</span></>}
                        {e.event_start_at && <><span aria-hidden="true" style={{ color: 'var(--border)', fontSize: '.71rem' }}>·</span><span style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>{formatEventDateTime(e.event_start_at)}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', flexShrink: 0 }}>
                      {n > 0 && (
                        <IconBtn title="Ver asistencia" onClick={ev => { ev.stopPropagation(); navigate('evento-asistencia', { eventId: e.id }) }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--text-2)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            {n}
                          </div>
                        </IconBtn>
                      )}
                      <span style={{ fontSize: '.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 10, background: st.bg, color: st.color, border: st.border }}>{st.label}</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                  {e.status === 'draft' && e.admin_notes && (
                    <div style={{ margin: '.4rem 0 0', padding: '.65rem .9rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '.78rem', color: '#B91C1C' }}>
                      <strong>El admin rechazó este evento:</strong> {e.admin_notes}
                    </div>
                  )}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
              {filtered.length} de {events.length} evento{events.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
