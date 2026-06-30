import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { ACHIEVEMENTS } from '../../../utils/achievements'

const STAR_ICON  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const BOOK_ICON  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
const CERT_ICON  = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
const FLAME_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14.5c-2.5 0-4.5-2-4.5-4.5 0-4 4.5-7 4.5-7s4.5 3 4.5 7c0 2.5-2 4.5-4.5 4.5z"/></svg>
const LOCK_ICON  = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>

const ICON_BY_ID = { primer_paso: STAR_ICON, curioso: BOOK_ICON, dedicado: FLAME_ICON, maestro: CERT_ICON }

function buildAchievements(enrollments) {
  // completed_at non-null means the course was completed
  const completedCount = enrollments.filter(e => !!e.completed_at).length
  const n = enrollments.length
  const c = completedCount

  return ACHIEVEMENTS.map(a => ({
    id: a.id,
    icon: ICON_BY_ID[a.id],
    title: a.title,
    desc: a.desc(n, c),
    unlocked: a.check(n, c),
    req: a.req,
  }))
}

const FUTURE = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Mentor', desc: 'Recomienda un curso a otro estudiante.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    title: 'Reseñador', desc: 'Deja una reseña en un curso completado.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    title: 'Constante', desc: 'Estudia 7 días seguidos.',
  },
]

export default function StudentAchievementsPage() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('enrollments')
      .select('id, enrolled_at, completed_at')
      .eq('student_id', user.id)
      .then(({ data, error }) => {
        if (!error) setEnrollments(data || [])
        setLoading(false)
      })
  }, [user])

  const achievements   = buildAchievements(enrollments)
  const unlocked       = achievements.filter(a => a.unlocked).length
  const completedCount = enrollments.filter(e => !!e.completed_at).length

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .ach-pad { padding: 1.25rem 1rem 2rem !important; } .ach-grid { grid-template-columns: 1fr 1fr !important; } .ach-future { grid-template-columns: 1fr !important; } }
        .ach-badge { background: white; border: 1px solid var(--border); border-radius: 14px; padding: 1.4rem 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: .75rem; transition: box-shadow .18s; }
        .ach-badge:hover { box-shadow: 0 4px 16px rgba(23,26,28,.08); }
        .ach-badge.locked { opacity: .5; filter: grayscale(1); }
        .ach-feat { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; gap: 1rem; align-items: flex-start; }
      `}</style>

      <div className="ach-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mis logros</h1>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.85rem' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, height: 160, opacity: 1 - i * 0.18 }} />)}
          </div>
        ) : (
          <>
            {/* Summary bar */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.5rem', marginBottom: '1.75rem', display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>
                  {unlocked}<span style={{ fontSize: '1.1rem', color: 'var(--text-2)' }}>/{achievements.length}</span>
                </div>
                <div style={{ fontSize: '.73rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>Logros desbloqueados</div>
              </div>
              <div style={{ height: 38, width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{enrollments.length}</div>
                <div style={{ fontSize: '.73rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>Cursos inscritos</div>
              </div>
              <div style={{ height: 38, width: 1, background: 'var(--border)' }} />
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{completedCount}</div>
                <div style={{ fontSize: '.73rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>Cursos completados</div>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-2)', fontWeight: 500 }}>Progreso general</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 700 }}>{Math.round((unlocked / achievements.length) * 100)}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(unlocked / achievements.length) * 100}%`, background: 'var(--jade)', borderRadius: 4, transition: 'width .6s ease' }} />
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="ach-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.85rem', marginBottom: '2rem' }}>
              {achievements.map(a => (
                <div key={a.id} className={`ach-badge ${a.unlocked ? '' : 'locked'}`}>
                  <div style={{ width: 56, height: 56, background: a.unlocked ? 'var(--jade-soft)' : 'var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.unlocked ? 'var(--jade)' : 'var(--text-2)', position: 'relative' }}>
                    {a.icon}
                    {a.unlocked && (
                      <div style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, background: 'var(--jade)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.2rem' }}>{a.title}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)', lineHeight: 1.5, fontWeight: 300 }}>
                      {a.unlocked ? a.desc : a.req}
                    </div>
                  </div>
                  {a.unlocked && (
                    <span style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--jade)', background: 'var(--jade-soft)', padding: '3px 10px', borderRadius: 20 }}>
                      ¡Desbloqueado!
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Próximamente */}
            <div style={{ marginBottom: '.85rem' }}>
              <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.5rem', margin: 0 }}>
                {LOCK_ICON} Logros próximamente
              </p>
            </div>
            <div className="ach-future" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.85rem' }}>
              {FUTURE.map(f => (
                <div key={f.title} className="ach-feat">
                  <div style={{ width: 44, height: 44, background: 'var(--cream)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B5B2AB', flexShrink: 0, border: '1px dashed var(--border)' }}>{f.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: '#B5B2AB', marginBottom: '.2rem' }}>{f.title}</div>
                    <div style={{ fontSize: '.77rem', color: '#C8C5BE', lineHeight: 1.55, fontWeight: 300 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
