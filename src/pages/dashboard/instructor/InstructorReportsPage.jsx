import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const STATUS_STYLE = {
  published: { label: 'Publicado', bg: 'var(--jade-soft)', color: 'var(--jade)',  border: 'rgba(22,125,120,.25)' },
  draft:     { label: 'Borrador',  bg: '#F5F5F0',          color: '#9B9894',      border: 'var(--border)' },
  archived:  { label: 'Archivado', bg: '#FEF2F2',          color: '#B91C1C',      border: '#FECACA' },
}
const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function StatCard({ value, label, icon, sub }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', gap: '.9rem' }}>
      <div style={{ width: 42, height: 42, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>{label}</div>
        {sub != null && <div style={{ fontSize: '.68rem', color: '#B5B2AB', marginTop: '.1rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function InstructorReportsPage() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [counts, setCounts] = useState({})
  const [monthlyEnr, setMonthlyEnr] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('courses')
      .select('id, title, status, level, categories(name), created_at')
      .eq('instructor_id', profile.id)
      .order('created_at', { ascending: false })
      .then(async ({ data: cData }) => {
        const list = cData || []
        setCourses(list)
        if (!list.length) { setLoading(false); return }

        const ids = list.map(c => c.id)
        const { data: enr } = await supabase
          .from('enrollments')
          .select('course_id, created_at')
          .in('course_id', ids)

        const map = {}
        const monthly = {}
        ;(enr || []).forEach(r => {
          map[r.course_id] = (map[r.course_id] || 0) + 1
          const d = new Date(r.created_at)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthly[key] = (monthly[key] || 0) + 1
        })
        setCounts(map)

        const now = new Date()
        setMonthlyEnr(Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          return { key, label: MONTHS_ES[d.getMonth()], value: monthly[key] || 0 }
        }))
        setLoading(false)
      })
  }, [profile?.id])

  const totalStudents = Object.values(counts).reduce((s, n) => s + n, 0)
  const published     = courses.filter(c => c.status === 'published')
  const maxMonthly    = Math.max(...monthlyEnr.map(m => m.value), 1)
  const sorted        = [...courses].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))

  const COURSE_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  const USERS_ICON  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  const CHECK_ICON  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .rp-pad { padding: 1.25rem 1rem 2rem !important; } .rp-stats { grid-template-columns: 1fr 1fr !important; } .rp-main { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="rp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Reportes</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 90, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : (
          <>
            <div className="rp-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.85rem', marginBottom: '1.75rem' }}>
              <StatCard value={courses.length}   label="Cursos creados"    icon={COURSE_ICON} sub={`${published.length} publicado${published.length !== 1 ? 's' : ''}`} />
              <StatCard value={totalStudents}    label="Estudiantes totales" icon={USERS_ICON} sub={courses.length ? `${(totalStudents / courses.length).toFixed(1)} prom./curso` : null} />
              <StatCard value={published.length} label="Cursos activos"    icon={CHECK_ICON} />
            </div>

            <div className="rp-main" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

              {/* Gráfico de inscripciones */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Inscripciones — últimos 6 meses</h2>
                </div>
                <div style={{ padding: '1.5rem 1.35rem' }}>
                  {monthlyEnr.every(m => m.value === 0) ? (
                    <p style={{ fontSize: '.82rem', color: '#B5B2AB', textAlign: 'center', padding: '1.5rem 0' }}>Sin inscripciones aún.</p>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 120 }}>
                      {monthlyEnr.map(m => (
                        <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
                          <span style={{ fontSize: '.68rem', color: 'var(--text-2)', fontWeight: 500 }}>{m.value || ''}</span>
                          <div style={{ width: '100%', background: m.value > 0 ? 'var(--jade)' : 'var(--border)', borderRadius: '4px 4px 0 0', height: `${Math.max((m.value / maxMonthly) * 88, m.value > 0 ? 8 : 2)}px`, opacity: m.value > 0 ? 1 : 0.35 }} />
                          <span style={{ fontSize: '.68rem', color: 'var(--text-2)' }}>{m.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cursos por rendimiento */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '1.1rem 1.35rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Cursos por estudiantes</h2>
                </div>
                {courses.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#B5B2AB', fontSize: '.82rem' }}>Sin cursos aún.</div>
                ) : sorted.map((c, i) => {
                  const st  = STATUS_STYLE[c.status] || STATUS_STYLE.draft
                  const n   = counts[c.id] || 0
                  const pct = totalStudents > 0 ? (n / totalStudents) * 100 : 0
                  return (
                    <div key={c.id} style={{ padding: '.85rem 1.35rem', borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                        <span style={{ fontSize: '.83rem', fontWeight: 600, color: 'var(--carbon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '.75rem' }}>{c.title}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-2)' }}>{n} est.</span>
                          <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 8, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                        </div>
                      </div>
                      <div style={{ height: 5, background: 'var(--cream)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--jade)', borderRadius: 4, minWidth: n > 0 ? 6 : 0 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
