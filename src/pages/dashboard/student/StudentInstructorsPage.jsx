import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { ModalOverlay, Avatar } from '../../../components/ui'

const USERS_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>

const SOCIAL_ICONS = {
  linkedin: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>,
  website: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  twitter: <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.9 6.3L18.9 2zm-1.2 18h1.9L6.4 3.9H4.4L17.7 20z"/></svg>,
}

function InstructorModal({ instructor, onClose }) {
  const { profile, courses } = instructor

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 30px 80px rgba(23,26,28,.25)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.75rem 2rem', position: 'relative' }}>
          <button onClick={onClose} aria-label="Cerrar"
            style={{ position: 'absolute', top: '1.1rem', right: '1.1rem', background: 'var(--cream)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div style={{ display: 'flex', gap: '1.1rem', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
            <Avatar name={profile.full_name} url={profile.avatar_url} size={72} />
            <div style={{ flex: 1, minWidth: 0, paddingTop: '.2rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, marginBottom: '.3rem' }}>
                {profile.full_name || 'Instructor'}
              </div>
              {profile.profession && (
                <div style={{ fontSize: '.85rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '.2rem' }}>
                  {profile.profession}{profile.specialty ? ` · ${profile.specialty}` : ''}
                </div>
              )}
              <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', fontSize: '.78rem', color: 'var(--text-2)' }}>
                {profile.current_company && <span>{profile.current_company}</span>}
                {profile.current_company && profile.country && <span>·</span>}
                {profile.country && <span>{profile.country}</span>}
                {profile.years_experience != null && (
                  <>{(profile.current_company || profile.country) && <span>·</span>}<span>{profile.years_experience} años de experiencia</span></>
                )}
              </div>
            </div>
          </div>

          {(profile.linkedin_url || profile.website_url || profile.twitter_url) && (
            <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1.25rem' }}>
              {[
                ['linkedin', profile.linkedin_url],
                ['website', profile.website_url],
                ['twitter', profile.twitter_url],
              ].filter(([, url]) => url).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--jade-soft)', color: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  {SOCIAL_ICONS[key]}
                </a>
              ))}
            </div>
          )}

          {profile.bio && (
            <p style={{ fontSize: '.87rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, margin: '0 0 1.5rem' }}>
              {profile.bio}
            </p>
          )}

          <div>
            <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.55rem' }}>
              {courses.length === 1 ? 'Tu curso con este instructor' : `Tus ${courses.length} cursos con este instructor`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {courses.map(c => (
                <div key={c.id} style={{ fontSize: '.84rem', color: 'var(--carbon)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.5rem .7rem', background: 'var(--cream)', borderRadius: 8 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--jade)', flexShrink: 0 }} />
                  {c.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  )
}

export default function StudentInstructorsPage() {
  const { user } = useAuth()
  const [instructors, setInstructors] = useState([]) // { profile, courseCount, courses[] }
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    if (!user) return

    supabase.from('enrollments')
      .select('course_id, courses(id, title, instructor_id, profiles!instructor_id(id, full_name, bio, avatar_url, profession, country, specialty, years_experience, current_company, linkedin_url, website_url, twitter_url))')
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
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .sinst-pad { padding: 1.25rem 1rem 2rem !important; } .sinst-grid { grid-template-columns: 1fr !important; } }
        .sinst-card { background: white; border: 1px solid var(--border); border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; transition: box-shadow .18s, transform .18s; cursor: pointer; }
        .sinst-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.09); transform: translateY(-2px); }
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
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{USERS_ICON}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>Sin instructores aún</p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB', lineHeight: 1.6, fontWeight: 300 }}>Inscríbete en un curso para conocer a tu instructor.</p>
          </div>
        ) : (
          <>
            <div className="sinst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {(filtered.length > 0 ? filtered : instructors).map(instructor => {
                const { profile, courses } = instructor
                return (
                <div key={profile.id} className="sinst-card" role="button" tabIndex={0}
                  onClick={() => setSelected(instructor)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(instructor) } }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <Avatar name={profile.full_name} url={profile.avatar_url} size={56} />
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
                )
              })}
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

      {selected && <InstructorModal instructor={selected} onClose={() => setSelected(null)} />}
    </DashboardLayout>
  )
}
