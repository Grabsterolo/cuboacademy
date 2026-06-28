import { useState, useEffect } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

function ProgressBar({ pct }) {
  const p = Math.min(100, Math.max(0, pct || 0))
  return (
    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginTop: '.5rem' }}>
      <div style={{ height: '100%', width: `${p}%`, background: p === 100 ? 'var(--jade)' : 'var(--jade)', borderRadius: 3, transition: 'width .6s ease' }} />
    </div>
  )
}

function Skel() {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ width: 100, height: 70, borderRadius: 8, background: 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, width: '30%', background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem' }} />
        <div style={{ height: 16, width: '80%', background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem' }} />
        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function StudentCoursesPage() {
  const { navigate } = useNavigation()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active') // 'active' | 'completed'

  useEffect(() => {
    if (!user) return
    supabase.from('enrollments')
      .select('id, status, progress_pct, enrolled_at, completed_at, course_id, courses(id, slug, title, cover_image_url, level, duration_hours, categories(name), profiles!instructor_id(full_name))')
      .eq('student_id', user.id)
      .order('enrolled_at', { ascending: false })
      .then(({ data }) => {
        setEnrollments(data || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const active = enrollments.filter(e => !e.completed_at && e.status !== 'completed')
  const completed = enrollments.filter(e => e.completed_at || e.status === 'completed')
  const shown = tab === 'active' ? active : completed

  const BOOK_ICON = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .sc-pad { padding: 1.25rem 1rem 2rem !important; } }
        .tab-btn { padding: .55rem 1.1rem; border: none; border-radius: 7px; cursor: pointer; font-size: .84rem; font-weight: 600; font-family: var(--sans); transition: all .15s; }
        .tab-btn.active { background: var(--jade); color: white; }
        .tab-btn:not(.active) { background: transparent; color: var(--text-2); }
        .tab-btn:not(.active):hover { background: var(--jade-soft); color: var(--jade); }
        .enr-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.1rem; display: flex; gap: 1rem; align-items: flex-start; transition: box-shadow .18s; }
        .enr-card:hover { box-shadow: 0 4px 16px rgba(23,26,28,.08); }
        .cont-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem 1rem; background: var(--jade); color: white; border: none; border-radius: 7px; font-size: .8rem; font-weight: 700; cursor: pointer; text-decoration: none; font-family: var(--sans); transition: opacity .2s; }
        .cont-btn:hover { opacity: .88; }
        .view-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem 1rem; background: var(--jade-soft); color: var(--jade-dark); border: 1px solid var(--jade-light); border-radius: 7px; font-size: .8rem; font-weight: 700; cursor: pointer; text-decoration: none; font-family: var(--sans); }
      `}</style>

      <div className="sc-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis cursos</h1>
          </div>
          <button onClick={() => navigate('tienda')}
            style={{ padding: '.6rem 1.1rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Explorar cursos
          </button>
        </div>

        {/* Stats strip */}
        {!loading && enrollments.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'En progreso', value: active.length, color: 'var(--jade)' },
              { label: 'Completados', value: completed.length, color: '#6B7280' },
              { label: 'Total inscripciones', value: enrollments.length, color: 'var(--carbon)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.75rem 1.25rem', display: 'flex', gap: '.6rem', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</span>
                <span style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '.35rem', marginBottom: '1.25rem', background: 'var(--cream)', padding: '.35rem', borderRadius: 9, width: 'fit-content' }}>
          <button className={`tab-btn ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
            En progreso {!loading && `(${active.length})`}
          </button>
          <button className={`tab-btn ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>
            Completados {!loading && `(${completed.length})`}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            <Skel /><Skel /><Skel />
          </div>
        ) : shown.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 440 }}>
            <div style={{ width: 48, height: 48, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--jade)' }}>{BOOK_ICON}</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {tab === 'active' ? 'Sin cursos en progreso' : 'Sin cursos completados'}
            </h2>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: '1.4rem', fontWeight: 300, lineHeight: 1.6 }}>
              {tab === 'active' ? 'Explora el catálogo y comienza tu aprendizaje.' : 'Sigue avanzando en tus cursos actuales para completarlos.'}
            </p>
            <button onClick={() => navigate('tienda')}
              style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--jade)', background: 'transparent', border: '1px solid rgba(22,125,120,.3)', padding: '.5rem 1.1rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ir a la tienda
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {shown.map(enr => {
              const c = enr.courses
              if (!c) return null
              const pct = enr.progress_pct || 0
              const cover = c.cover_image_url
              const level = LEVEL_LABEL[c.level] || ''
              const category = c.categories?.name || ''
              const instructor = c.profiles?.full_name || ''
              const isCompleted = tab === 'completed'

              return (
                <div key={enr.id} className="enr-card">
                  {/* Thumbnail */}
                  <div style={{ width: 110, height: 75, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: cover ? `url(${cover}) center/cover no-repeat` : 'linear-gradient(140deg,#0d3840,#082830)' }} />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '.3rem' }}>
                      {category && <span style={{ fontSize: '.64rem', fontWeight: 700, color: 'var(--jade)', letterSpacing: '.05em', textTransform: 'uppercase' }}>{category}</span>}
                      {level && <span style={{ fontSize: '.64rem', color: 'var(--text-2)', background: 'var(--cream)', padding: '1px 7px', borderRadius: 10 }}>{level}</span>}
                    </div>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.97rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.3, marginBottom: '.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</h3>
                    {instructor && <p style={{ fontSize: '.74rem', color: 'var(--text-2)', marginBottom: '.5rem' }}>{instructor}</p>}

                    <ProgressBar pct={pct} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.45rem' }}>
                      <span style={{ fontSize: '.72rem', color: isCompleted ? 'var(--jade)' : 'var(--text-2)', fontWeight: isCompleted ? 600 : 400 }}>
                        {isCompleted ? '✓ Completado' : `${Math.round(pct)}% completado`}
                      </span>
                      {isCompleted ? (
                        <button onClick={() => navigate('aprender', { courseId: c.id })} className="view-btn">Ver curso</button>
                      ) : (
                        <button onClick={() => navigate('aprender', { courseId: c.id })} className="cont-btn">
                          Continuar
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
