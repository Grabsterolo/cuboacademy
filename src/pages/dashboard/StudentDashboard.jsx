import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useNavigation } from '../../context/NavigationContext'
import { STUDENT_NAV } from '../../config/navigation'
import { supabase } from '../../lib/supabase'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

function StatCard({ value, label, icon, onClick }) {
  return (
    <div onClick={onClick} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '.85rem', transition: 'border-color .2s, box-shadow .2s', cursor: onClick ? 'pointer' : 'default' }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.borderColor = 'rgba(22,125,120,.3)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(23,26,28,.07)' } }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{ width: 40, height: 40, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--jade)' }}>{icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 400 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
      {action}
    </div>
  )
}

function EmptyCard({ icon, text, cta, onCtaClick }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '2.25rem 1.5rem', textAlign: 'center' }}>
      <div style={{ width: 44, height: 44, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .9rem', color: 'var(--jade)' }}>{icon}</div>
      <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: cta ? '1.1rem' : 0, lineHeight: 1.55, fontWeight: 300 }}>{text}</p>
      {cta && (
        <button onClick={onCtaClick} style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--jade)', background: 'transparent', border: '1px solid rgba(22,125,120,.3)', padding: '.45rem 1rem', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--sans)' }}>{cta}</button>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { profile, user } = useAuth()
  const { settings } = useSettings()
  const { navigate } = useNavigation()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'estudiante').split(' ')[0]
  const [enrollments, setEnrollments] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('enrollments')
        .select('id, status, progress_pct, enrolled_at, courses(id, title, cover_image_url, level, categories(name), profiles!instructor_id(full_name))')
        .eq('student_id', user.id)
        .order('enrolled_at', { ascending: false })
        .limit(4),
      supabase.from('announcements')
        .select('id, title, content, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
    ]).then(([enrRes, annRes]) => {
      if (!enrRes.error) setEnrollments(enrRes.data || [])
      if (!annRes.error) setAnnouncements(annRes.data || [])
      setLoading(false)
    })
  }, [user])

  const active = enrollments.filter(e => e.status !== 'completed')
  const completed = enrollments.filter(e => e.status === 'completed')

  const BOOK_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
  const CHECK_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  const CERT_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
  const STAR_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  const BELL_ICON = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

  return (
    <DashboardLayout navItems={STUDENT_NAV}>
      <style>{`
        @media (max-width: 768px) { .std-pad { padding: 1.25rem 1rem 2rem !important; } .std-stats { grid-template-columns: 1fr 1fr !important; } .std-main { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="std-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.3rem' }}>Bienvenido de vuelta</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Hola, {firstName}</h1>
          <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginTop: '.35rem', fontWeight: 300 }}>
            {settings.welcome_message || 'Continúa aprendiendo desde donde lo dejaste.'}
          </p>
        </div>

        {/* Stats row */}
        <div className="std-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.85rem', marginBottom: '2rem' }}>
          <StatCard value={active.length} label="Cursos activos" icon={BOOK_ICON} onClick={() => navigate('cursos')} />
          <StatCard value={completed.length} label="Completados" icon={CHECK_ICON} onClick={() => navigate('cursos')} />
          <StatCard value={0} label="Certificados" icon={CERT_ICON} onClick={() => navigate('certificados')} />
          <StatCard value={0} label="Logros" icon={STAR_ICON} onClick={() => navigate('logros')} />
        </div>

        {/* Main grid */}
        <div className="std-main" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'start' }}>

          {/* Left: Active courses */}
          <div>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Mis cursos activos</h2>
                <button onClick={() => navigate('cursos')} style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Ver todos →</button>
              </div>
              {loading ? (
                <div style={{ padding: '1.5rem' }}>
                  {[1,2].map(i => (
                    <div key={i} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                      <div style={{ width: 72, height: 52, background: 'var(--border)', borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem', width: '75%' }} />
                        <div style={{ height: 6, background: 'var(--border)', borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : active.length === 0 ? (
                <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .85rem', color: 'var(--jade)' }}>{BOOK_ICON}</div>
                  <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.55, fontWeight: 300 }}>
                    {settings.welcome_message || 'Explora el catálogo y empieza a aprender con formación diseñada por consultores activos.'}
                  </p>
                  <button onClick={() => navigate('courses')} style={{ fontSize: '.82rem', fontWeight: 600, color: 'white', background: 'var(--jade)', border: 'none', cursor: 'pointer', padding: '.55rem 1.25rem', borderRadius: 7, fontFamily: 'var(--sans)' }}>Explorar catálogo</button>
                </div>
              ) : (
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                  {active.map(e => {
                    const c = e.courses
                    if (!c) return null
                    const pct = e.progress_pct || 0
                    const initials = (c.profiles?.full_name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
                    return (
                      <div key={e.id} style={{ display: 'flex', gap: '.85rem', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('tienda')}>
                        <div style={{ width: 72, height: 52, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                          {c.cover_image_url && <img src={c.cover_image_url} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--carbon)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '.35rem' }}>{c.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.35rem' }}>
                            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--jade)', borderRadius: 2, transition: 'width .5s ease' }} />
                            </div>
                            <span style={{ fontSize: '.7rem', color: 'var(--text-2)', flexShrink: 0 }}>{pct}%</span>
                          </div>
                          <div style={{ fontSize: '.7rem', color: 'var(--text-2)', display: 'flex', gap: '.5rem' }}>
                            {c.categories?.name && <span>{c.categories.name}</span>}
                            {c.level && <><span>·</span><span>{LEVEL_LABEL[c.level] || c.level}</span></>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Completed courses */}
            {completed.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginTop: '1.25rem' }}>
                <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Cursos completados</h2>
                </div>
                <div style={{ padding: '.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  {completed.map(e => {
                    const c = e.courses
                    if (!c) return null
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{ width: 28, height: 28, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--jade)' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span style={{ fontSize: '.84rem', color: 'var(--carbon)', fontWeight: 500 }}>{c.title}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Comunicados */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Comunicados</h2>
                <button onClick={() => navigate('comunicados')} style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Ver todos →</button>
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

            {/* Logros */}
            <EmptyCard
              icon={STAR_ICON}
              text="Completa cursos y desafíos para ganar logros."
              cta="Ver mis logros"
              onCtaClick={() => navigate('logros')}
            />

            {/* Certificados */}
            <EmptyCard
              icon={CERT_ICON}
              text="Tus certificados aparecerán aquí al completar un curso."
              cta="Ver certificados"
              onCtaClick={() => navigate('certificados')}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
