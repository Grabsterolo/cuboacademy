import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { supabase } from '../../lib/supabase'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const STATUS_STYLE = {
  published: { label: 'Publicado',  bg: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' },
  draft:     { label: 'Borrador',   bg: '#F5F5F0',           color: '#9B9894',          border: '1px solid var(--border)' },
  pending:   { label: 'En revisión',bg: '#FFF7ED',           color: '#C2410C',          border: '1px solid #FED7AA' },
  archived:  { label: 'Archivado',  bg: '#FEF2F2',           color: '#B91C1C',          border: '1px solid #FECACA' },
}

function StatCard({ value, label, icon, accent }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
      <div style={{ width: 40, height: 40, background: accent ? 'rgba(201,110,75,.1)' : 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: accent ? 'var(--terra)' : 'var(--jade)' }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '.2rem' }}>{label}</div>
      </div>
    </div>
  )
}

export default function InstructorDashboard() {
  const { profile, user } = useAuth()
  const { navigate } = useNavigation()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'instructor').split(' ')[0]
  const [courses, setCourses] = useState([])
  const [studentCounts, setStudentCounts] = useState({})
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    Promise.all([
      supabase.from('courses')
        .select('id, title, cover_image_url, level, status, categories(name), created_at')
        .eq('instructor_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase.from('announcements')
        .select('id, title, content, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
    ]).then(async ([cRes, aRes]) => {
      const ownCourses = cRes.data || []
      setCourses(ownCourses)
      if (!aRes.error) setAnnouncements(aRes.data || [])

      // Try to get student counts per course
      if (ownCourses.length > 0) {
        const ids = ownCourses.map(c => c.id)
        const { data: counts, error } = await supabase
          .from('enrollments')
          .select('course_id')
          .in('course_id', ids)
        if (!error && counts) {
          const map = {}
          counts.forEach(r => { map[r.course_id] = (map[r.course_id] || 0) + 1 })
          setStudentCounts(map)
        }
      }
      setLoading(false)
    })
  }, [profile?.id])

  const published = courses.filter(c => c.status === 'published')
  const drafts = courses.filter(c => c.status === 'draft')
  const totalStudents = Object.values(studentCounts).reduce((s, n) => s + n, 0)

  const COURSE_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  const USERS_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  const DRAFT_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  const BELL_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .inst-pad { padding: 1.25rem 1rem 2rem !important; } .inst-stats { grid-template-columns: 1fr 1fr !important; } .inst-main { grid-template-columns: 1fr !important; } }
        .course-row { display: flex; align-items: center; gap: .85rem; padding: .9rem 1.25rem; border-bottom: 1px solid var(--border); transition: background .15s; cursor: pointer; }
        .course-row:last-child { border-bottom: none; }
        .course-row:hover { background: var(--cream); }
      `}</style>
      <div className="inst-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.3rem' }}>Panel de instructor</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Hola, {firstName}</h1>
          </div>
          <button onClick={() => navigate('curso-form', { courseId: null })} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.65rem 1.25rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 600, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Crear curso
          </button>
        </div>

        {/* Stats */}
        <div className="inst-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.85rem', marginBottom: '2rem' }}>
          <StatCard value={published.length} label="Cursos publicados" icon={COURSE_ICON} />
          <StatCard value={drafts.length} label="Borradores" icon={DRAFT_ICON} />
          <StatCard value={totalStudents} label="Estudiantes totales" icon={USERS_ICON} accent />
        </div>

        {/* Main grid */}
        <div className="inst-main" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

          {/* Courses list */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Mis cursos</h2>
              <button onClick={() => navigate('cursos')} style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Gestionar →</button>
            </div>

            {loading ? (
              <div style={{ padding: '1.25rem' }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '.85rem', alignItems: 'center' }}>
                    <div style={{ width: 60, height: 44, background: 'var(--border)', borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, background: 'var(--border)', borderRadius: 4, marginBottom: '.4rem', width: '70%' }} />
                      <div style={{ height: 11, background: 'var(--border)', borderRadius: 4, width: '45%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--jade)' }}>{COURSE_ICON}</div>
                <p style={{ fontSize: '.86rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.25rem', fontWeight: 300, maxWidth: 300, margin: '0 auto 1.25rem' }}>
                  Comparte tu experiencia consultiva con profesionales que quieren aprender desde la práctica real.
                </p>
                <button onClick={() => navigate('curso-form', { courseId: null })} style={{ display: 'inline-block', padding: '.7rem 1.5rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  Crear mi primer curso
                </button>
              </div>
            ) : (
              courses.map(c => {
                const ss = STATUS_STYLE[c.status] || STATUS_STYLE.draft
                const count = studentCounts[c.id] || 0
                return (
                  <div key={c.id} className="course-row" onClick={() => navigate('curso-estructura', { courseId: c.id })}>
                    <div style={{ width: 60, height: 44, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                      {c.cover_image_url && <img src={c.cover_image_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--carbon)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '.25rem' }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                        {c.categories?.name && <span style={{ fontSize: '.7rem', color: 'var(--text-2)' }}>{c.categories.name}</span>}
                        {c.level && <><span style={{ fontSize: '.68rem', color: 'var(--border)' }}>·</span><span style={{ fontSize: '.7rem', color: 'var(--text-2)' }}>{LEVEL_LABEL[c.level] || c.level}</span></>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                      {count > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.75rem', color: 'var(--text-2)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                          {count}
                        </div>
                      )}
                      <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: ss.bg, color: ss.color, border: ss.border }}>{ss.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Right: Announcements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Comunicados</h2>
                <button onClick={() => navigate('comunicados')} style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Ver →</button>
              </div>
              {announcements.length === 0 ? (
                <div style={{ padding: '1.75rem 1.25rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--jade)', margin: '0 auto .6rem', width: 36, height: 36, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{BELL_ICON}</div>
                  <p style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 300 }}>Sin comunicados recientes</p>
                </div>
              ) : (
                <div style={{ padding: '.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {announcements.map(a => (
                    <div key={a.id} style={{ paddingBottom: '.6rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.2rem' }}>{a.title}</div>
                      <div style={{ fontSize: '.76rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.4 }}>{(a.content || '').slice(0, 80)}{(a.content || '').length > 80 ? '…' : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Accesos rápidos</h2>
              </div>
              <div style={{ padding: '.5rem .75rem' }}>
                {[
                  { label: 'Mis estudiantes', key: 'estudiantes', icon: USERS_ICON },
                  { label: 'Evaluaciones',    key: 'evaluaciones', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
                  { label: 'Reportes',        key: 'reportes',     icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
                  { label: 'Configuración',   key: 'configuracion', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
                ].map(item => (
                  <button key={item.key} onClick={() => navigate(item.key)} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .5rem', borderRadius: 7, color: 'var(--text-2)', width: '100%', background: 'transparent', border: 'none', fontSize: '.84rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background .15s, color .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--jade-soft)'; e.currentTarget.style.color = 'var(--jade)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)' }}>
                    <span style={{ opacity: .7 }}>{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
