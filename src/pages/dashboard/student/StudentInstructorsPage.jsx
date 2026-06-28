import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { STUDENT_NAV } from '../../../config/navigation'

const USERS_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

function Avatar({ name, url, size = 56 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return url
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(140deg,var(--jade),var(--jade-dark,#0d4a46))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: size * 0.32 + 'px', fontWeight: 700, color: 'white', fontFamily: 'var(--serif)' }}>{initials}</span>
      </div>
}

export default function StudentInstructorsPage() {
  const { user } = useAuth()
  const [instructors, setInstructors] = useState([]) // { profile, courseCount, courses[] }
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return

    supabase.from('enrollments')
      .select('course_id, courses(id, title, instructor_id, profiles!instructor_id(id, full_name, bio, avatar_url, profession, country))')
      .eq('student_id', user.id)
      .then(({ data }) => {
        const rows = data || []
        const map = {}

        rows.forEach(row => {
          const c = row.courses
          if (!c) return
          const p = c.profiles
          if (!p?.id) return

          if (!map[p.id]) {
            map[p.id] = { profile: p, courses: [] }
          }
          map[p.id].courses.push({ id: c.id, title: c.title })
        })

        setInstructors(Object.values(map))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  const q = search.toLowerCase()
  const filtered = instructors.filter(i =>
    !q ||
    (i.profile.full_name || '').toLowerCase().includes(q) ||
    (i.profile.profession || '').toLowerCase().includes(q) ||
    (i.profile.bio || '').toLowerCase().includes(q)
  )

  return (
    <DashboardLayout navItems={STUDENT_NAV}>
      <style>{`
        @media (max-width: 768px) { .sinst-pad { padding: 1.25rem 1rem 2rem !important; } .sinst-grid { grid-template-columns: 1fr !important; } }
        .sinst-card { background: white; border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: box-shadow .18s; }
        .sinst-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.09); }
      `}</style>

      <div className="sinst-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Instructores</h1>
        </div>

        {/* Search */}
        {!loading && instructors.length > 0 && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar instructor…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
                onFocus={e => e.target.style.borderColor = 'var(--jade)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="sinst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, height: 180, opacity: 1 - i * 0.18 }} />)}
          </div>
        ) : instructors.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', maxWidth: 420 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{USERS_ICON}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>Sin instructores aún</p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB', lineHeight: 1.6, fontWeight: 300 }}>Inscríbete en un curso para conocer a tu instructor.</p>
          </div>
        ) : (
          <>
            <div className="sinst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {(filtered.length > 0 ? filtered : instructors).map(({ profile, courses }) => (
                <div key={profile.id} className="sinst-card">
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Avatar name={profile.full_name} url={profile.avatar_url} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.25, marginBottom: '.2rem' }}>
                        {profile.full_name || 'Instructor'}
                      </div>
                      {profile.profession && (
                        <div style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '.25rem' }}>{profile.profession}</div>
                      )}
                      {profile.country && (
                        <div style={{ fontSize: '.74rem', color: 'var(--text-2)' }}>{profile.country}</div>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.65, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                      {profile.bio}
                    </p>
                  )}

                  <div>
                    <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.4rem' }}>
                      {courses.length === 1 ? 'Tu curso con este instructor' : `Tus ${courses.length} cursos con este instructor`}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                      {courses.map(c => (
                        <div key={c.id} style={{ fontSize: '.79rem', color: 'var(--carbon)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--jade)', flexShrink: 0 }} />
                          {c.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filtered.length === 0 && search && (
              <p style={{ fontSize: '.83rem', color: 'var(--text-2)', marginTop: '1rem' }}>Sin resultados para «{search}».</p>
            )}
            {instructors.length > 0 && (
              <div style={{ marginTop: '.85rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
                {filtered.length > 0 ? filtered.length : instructors.length} instructor{instructors.length !== 1 ? 'es' : ''} en tus cursos
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
