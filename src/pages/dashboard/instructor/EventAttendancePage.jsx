import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useNavigation } from '../../../context/NavigationContext'
import { Avatar, Toast } from '../../../components/ui'
import { markEventAttendance } from '../../../lib/markEventAttendance'
import { formatDateShort, formatEventDateTime } from '../../../lib/formatDate'
import { formatEventLocation } from '../../../lib/eventLocation'

const USERS = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

export default function EventAttendancePage() {
  const { params, navigate } = useNavigation()
  const eventId = params?.eventId
  const [event, setEvent] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)
  const [toast, setToast] = useState('')

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => { if (!eventId) navigate('eventos') }, [eventId])

  useEffect(() => {
    if (!eventId) return
    load()
  }, [eventId])

  async function load() {
    setLoading(true)
    const [{ data: eventData }, { data: enr }] = await Promise.all([
      supabase.from('courses').select('id, title, event_start_at, country, city, location').eq('id', eventId).eq('type', 'event').maybeSingle(),
      supabase.from('enrollments')
        .select('id, enrolled_at, completed_at, student_id, profiles!student_id(full_name, email, avatar_url)')
        .eq('course_id', eventId)
        .order('enrolled_at', { ascending: false }),
    ])
    setEvent(eventData)
    setRows(enr || [])
    setLoading(false)
  }

  async function toggleAttendance(row) {
    if (processing) return
    setProcessing(row.id)
    const attended = !row.completed_at
    const result = await markEventAttendance({ enrollmentId: row.id, attended })
    if (result.error) {
      showToast(result.error)
    } else {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, completed_at: result.enrollment.completed_at } : r))
    }
    setProcessing(null)
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    return !q || (r.profiles?.full_name || '').toLowerCase().includes(q) || (r.profiles?.email || '').toLowerCase().includes(q)
  })
  const attendedCount = rows.filter(r => r.completed_at).length

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .eap-pad { padding: 1.25rem 1rem 2rem !important; } }
        .eap-row { display: flex; align-items: center; gap: 1rem; padding: .85rem 1.25rem; border-bottom: 1px solid var(--border); transition: background .15s; }
        .eap-row:last-child { border-bottom: none; }
        .eap-row:hover { background: var(--cream); }
      `}</style>

      <div className="eap-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <button onClick={() => navigate('eventos')}
          style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', padding: 0, marginBottom: '1.1rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a eventos
        </button>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Asistencia</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>{event?.title || 'Evento'}</h1>
          {event?.event_start_at && (
            <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginTop: '.4rem' }}>
              {formatEventDateTime(event.event_start_at)}{formatEventLocation(event) && ` · ${formatEventLocation(event)}`}
            </p>
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Inscritos', value: rows.length },
              { label: 'Asistencia marcada', value: attendedCount },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.8rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Buscar estudiante…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', maxWidth: 320, padding: '.55rem .85rem .55rem 2.1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }} />
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 68, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{USERS}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>Sin inscritos aún</p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>Cuando alguien se inscriba a este evento aparecerá aquí.</p>
          </div>
        ) : (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.84rem' }}>Sin resultados para esta búsqueda.</div>
            ) : filtered.map(r => {
              const isProc = processing === r.id
              return (
                <div key={r.id} className="eap-row">
                  <Avatar name={r.profiles?.full_name || r.profiles?.email} url={r.profiles?.avatar_url} size={38} gradient={false} fontScale={0.3} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.profiles?.full_name || r.profiles?.email || 'Estudiante'}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)' }}>Inscrito el {formatDateShort(r.enrolled_at)}</div>
                  </div>
                  <button onClick={() => toggleAttendance(r)} disabled={isProc}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .85rem', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, cursor: isProc ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isProc ? .6 : 1, flexShrink: 0, border: r.completed_at ? '1.5px solid rgba(22,125,120,.4)' : '1.5px solid var(--border)', background: r.completed_at ? 'var(--jade-soft)' : 'white', color: r.completed_at ? 'var(--jade)' : 'var(--text-2)' }}>
                    {r.completed_at
                      ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Asistió</>
                      : 'Marcar asistencia'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Toast message={toast} />
    </DashboardLayout>
  )
}
