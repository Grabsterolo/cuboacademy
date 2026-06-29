import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const USERS = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

function Avatar({ name, url, size = 38 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return url
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: size * 0.3 + 'px', fontWeight: 700, color: 'white', fontFamily: 'var(--serif)' }}>{initials}</span>
      </div>
}

export default function InstructorStudentsPage() {
  const { profile } = useAuth()
  const [rows, setRows] = useState([])       // { enrollment, student, courseTitle }
  const [courses, setCourses] = useState([]) // instructor courses for filter
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('courses').select('id, title').eq('instructor_id', profile.id)
      .then(async ({ data: cData }) => {
        const cList = cData || []
        setCourses(cList)
        if (!cList.length) { setLoading(false); return }

        const ids = cList.map(c => c.id)

        // enrollments
        const { data: enr } = await supabase
          .from('enrollments')
          .select('id, created_at, course_id, student_id')
          .in('course_id', ids)
          .order('created_at', { ascending: false })

        if (!enr?.length) { setLoading(false); return }

        // student profiles
        const studentIds = [...new Set(enr.map(e => e.student_id))]
        const { data: pData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', studentIds)

        const profileMap = Object.fromEntries((pData || []).map(p => [p.id, p]))
        const courseMap  = Object.fromEntries(cList.map(c => [c.id, c.title]))

        setRows(enr.map(e => ({
          id:          e.id,
          created_at:  e.created_at,
          course_id:   e.course_id,
          courseTitle: courseMap[e.course_id] || '—',
          student:     profileMap[e.student_id] || { full_name: 'Estudiante', email: '' },
        })))
        setLoading(false)
      })
  }, [profile?.id])

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    return (
      (!filterCourse || r.course_id === filterCourse) &&
      (!q || (r.student.full_name || '').toLowerCase().includes(q) || (r.student.email || '').toLowerCase().includes(q))
    )
  })

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .ist-pad { padding: 1.25rem 1rem 2rem !important; } }
        .ist-row { display: flex; align-items: center; gap: 1rem; padding: .85rem 1.25rem; border-bottom: 1px solid var(--border); transition: background .15s; }
        .ist-row:last-child { border-bottom: none; }
        .ist-row:hover { background: var(--cream); }
      `}</style>

      <div className="ist-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis estudiantes</h1>
        </div>

        {/* Stat chip */}
        {!loading && rows.length > 0 && (
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total inscritos', value: rows.length },
              { label: 'Cursos activos', value: courses.length },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.8rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        {!loading && rows.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar estudiante…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
                onFocus={e => e.target.style.borderColor = 'var(--jade)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            {courses.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.07em', textTransform: 'uppercase', flexShrink: 0 }}>Curso</span>
                <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
                  {[{ id: null, title: 'Todos' }, ...courses].map(c => {
                    const active = filterCourse === c.id
                    return (
                      <button key={String(c.id)} onClick={() => setFilterCourse(c.id)}
                        style={{ padding: '.27rem .7rem', borderRadius: 20, border: `1.5px solid ${active ? 'rgba(22,125,120,.4)' : 'var(--border)'}`, background: active ? 'var(--jade-soft)' : 'transparent', color: active ? 'var(--jade)' : 'var(--text-2)', fontSize: '.77rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.title}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 68, opacity: 1 - i * 0.18 }} />)}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{USERS}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>Sin estudiantes aún</p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>Cuando alguien se inscriba a tus cursos aparecerá aquí.</p>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.84rem' }}>Sin resultados para esta búsqueda.</div>
              ) : filtered.map(r => (
                <div key={r.id} className="ist-row">
                  <Avatar name={r.student.full_name || r.student.email} url={r.student.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.student.full_name || r.student.email || 'Estudiante'}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.courseTitle}</div>
                  </div>
                  <div style={{ fontSize: '.72rem', color: '#B5B2AB', flexShrink: 0 }}>
                    {new Date(r.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '.75rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
              {filtered.length} de {rows.length} estudiante{rows.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
