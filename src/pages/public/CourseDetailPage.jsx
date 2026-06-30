import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { sanitizeHtml } from '../../lib/sanitizeHtml'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

export default function CourseDetailPage() {
  const { params, navigate } = useNavigation()
  const slug = params?.slug
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: c, error } = await supabase
        .from('courses')
        .select('*, categories(name), profiles!instructor_id(full_name, bio, avatar_url)')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !c) { setNotFound(true); setLoading(false); return }
      setCourse(c)

      // Load modules + lessons
      const { data: mods } = await supabase
        .from('modules')
        .select('*, lessons(id, title, duration_mins, is_free_preview, order_index)')
        .eq('course_id', c.id)
        .order('order_index', { ascending: true })
        .order('order_index', { ascending: true, foreignTable: 'lessons' })
      setModules((mods || []).map(m => ({ ...m, lessons: m.lessons || [] })))

      // Open first module
      if (mods?.length) setExpanded(new Set([mods[0].id]))

      // Check enrollment and pending orders
      if (user) {
        const { data: enr } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', c.id)
          .maybeSingle()
        setEnrolled(!!enr)

        if (!enr) {
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('student_id', user.id)
            .eq('course_id', c.id)
            .eq('status', 'pending')
            .maybeSingle()
          setPendingOrder(!!order)
        }
      }

      setLoading(false)
    }
    load()
  }, [slug, user])

  function toggleModule(id) {
    setExpanded(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  async function handleEnroll() {
    if (!user || !course) return
    setEnrolling(true)
    const priceNum = Number(course.price)
    const isGratisCourse = !course.price || priceNum === 0

    if (isGratisCourse) {
      const { error } = await supabase.from('enrollments').insert({
        student_id: user.id,
        course_id: course.id,
        enrolled_at: new Date().toISOString(),
      })
      if (!error) {
        setEnrolled(true)
        navigate('aprender', { courseId: course.id })
        return
      }
    } else {
      const { error } = await supabase.from('orders').insert({
        student_id: user.id,
        course_id: course.id,
        amount: priceNum,
        status: 'pending',
      })
      if (!error) setPendingOrder(true)
    }
    setEnrolling(false)
  }

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const totalMins = modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + (l.duration_mins || 0), 0), 0)

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Cargando...</div>
  )
  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 5%' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.5rem' }}>Curso no encontrado</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>Este curso no existe o ya no está disponible.</p>
      <button onClick={() => navigate('courses')} style={{ padding: '.7rem 1.5rem', background: 'var(--jade)', color: 'white', borderRadius: 9, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Ver catálogo</button>
    </div>
  )

  const priceNum = Number(course.price)
  const priceLabel = !course.price || priceNum === 0 ? 'Gratis' : `$${priceNum.toFixed(2)}`
  const isGratis = !course.price || priceNum === 0
  const level = LEVEL_LABEL[course.level] || course.level
  const instructor = course.profiles
  const instructorInitials = (instructor?.full_name || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()

  return (
    <>
      <style>{`
        .dtl-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; align-items: start; }
        .mod-row { display: flex; align-items: center; justify-content: space-between; padding: .9rem 1.1rem; cursor: pointer; user-select: none; transition: background .15s; }
        .mod-row:hover { background: var(--jade-soft); }
        .les-row { display: flex; align-items: center; justify-content: space-between; padding: .55rem 1.1rem .55rem 2rem; border-top: 1px solid var(--border); }
        .buy-btn { width: 100%; padding: 1rem; border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: var(--serif); transition: opacity .2s; }
        .buy-btn:hover { opacity: .88; }
        @media (max-width: 860px) { .dtl-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* Hero */}
      <div style={{ minHeight: 340, background: course.cover_image_url ? `url(${course.cover_image_url}) center/cover no-repeat` : 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', position: 'relative', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(8,24,28,.88) 0%,rgba(8,24,28,.4) 60%,transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem 5%', width: '100%', boxSizing: 'border-box' }}>
          <nav style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.6)', marginBottom: '1rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 'inherit', padding: 0 }}>Inicio</button>
            <span>›</span>
            <button onClick={() => navigate('courses')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 'inherit', padding: 0 }}>Cursos</button>
            <span>›</span>
            <span style={{ color: 'rgba(255,255,255,.9)' }}>{course.title}</span>
          </nav>
          {course.categories?.name && (
            <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade-light)', marginBottom: '.6rem', display: 'block' }}>{course.categories.name}</span>
          )}
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '1rem', maxWidth: 700 }}>{course.title}</h1>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.82rem', color: 'rgba(255,255,255,.75)' }}>
            {level && <span style={{ background: 'rgba(255,255,255,.12)', padding: '3px 10px', borderRadius: 20 }}>{level}</span>}
            {course.duration_hours && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>{course.duration_hours}h de contenido</span>}
            {totalLessons > 0 && <span>{totalLessons} lección{totalLessons !== 1 ? 'es' : ''}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'var(--cream)', padding: '2.5rem 5% 4rem' }}>
        <div className="dtl-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Description */}
            {course.description && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.85rem' }}>Descripción del curso</h2>
                <div style={{ fontSize: '.9rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
              </div>
            )}

            {/* Instructor card */}
            {instructor && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1rem' }}>Tu instructor</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {instructor.avatar_url
                    ? <img src={instructor.avatar_url} alt={instructor.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
                    : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{instructorInitials}</div>
                  }
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.3rem' }}>{instructor.full_name}</div>
                    {instructor.bio && <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 300 }}>{instructor.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Modules accordion */}
            {modules.length > 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '1.1rem 1.75rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '.5rem' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)' }}>Contenido del curso</h2>
                  <span style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>{modules.length} módulo{modules.length !== 1 ? 's' : ''} · {totalLessons} lección{totalLessons !== 1 ? 'es' : ''}{totalMins > 0 ? ` · ${Math.round(totalMins / 60 * 10) / 10}h` : ''}</span>
                </div>
                {modules.map((mod, i) => {
                  const open = expanded.has(mod.id)
                  return (
                    <div key={mod.id} style={{ borderBottom: i < modules.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div className="mod-row" onClick={() => toggleModule(mod.id)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round"
                            style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: '.92rem', fontWeight: 700, color: 'var(--carbon)' }}>{mod.title}</span>
                        </div>
                        <span style={{ fontSize: '.74rem', color: 'var(--text-2)', flexShrink: 0, marginLeft: '.5rem' }}>{mod.lessons.length} lección{mod.lessons.length !== 1 ? 'es' : ''}</span>
                      </div>
                      {open && mod.lessons.map(les => (
                        <div key={les.id} className="les-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                            {les.is_free_preview
                              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            }
                            <span style={{ fontSize: '.84rem', color: les.is_free_preview ? 'var(--carbon)' : 'var(--text-2)' }}>{les.title}</span>
                            {les.is_free_preview && <span style={{ fontSize: '.64rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10, background: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' }}>Preview</span>}
                          </div>
                          {les.duration_mins && <span style={{ fontSize: '.72rem', color: 'var(--text-2)', flexShrink: 0, marginLeft: '.5rem' }}>{les.duration_mins} min</span>}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right column — sticky price card */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(23,26,28,.08)' }}>
              {/* Price */}
              <div style={{ padding: '1.5rem 1.5rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.15rem' }}>{priceLabel}</div>
                {!isGratis && <p style={{ fontSize: '.76rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>Pago único · Acceso de por vida</p>}
                {isGratis && <p style={{ fontSize: '.76rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '1.25rem' }}>Sin costo · Acceso inmediato</p>}

                {enrolled ? (
                  <button onClick={() => navigate('aprender', { courseId: course.id })}
                    style={{ display: 'block', width: '100%', padding: '1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--serif)', textAlign: 'center', boxSizing: 'border-box' }}>
                    Ir al curso →
                  </button>
                ) : pendingOrder ? (
                  <div style={{ background: '#FFF9E6', border: '1px solid #FBBF24', borderRadius: 10, padding: '.9rem 1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '.82rem', color: '#B45309', fontWeight: 600, marginBottom: '.25rem' }}>Pago pendiente de confirmación</p>
                    <p style={{ fontSize: '.75rem', color: '#92400E', lineHeight: 1.5 }}>Tu solicitud fue recibida. Un administrador confirmará tu pago pronto.</p>
                  </div>
                ) : !user ? (
                  <button className="buy-btn" onClick={() => navigate('login')}
                    style={{ background: 'var(--jade)', color: 'white' }}>
                    {isGratis ? 'Inscribirme gratis' : 'Inscribirme ahora'}
                  </button>
                ) : (
                  <button className="buy-btn" onClick={handleEnroll} disabled={enrolling}
                    style={{ background: 'var(--jade)', color: 'white', opacity: enrolling ? .7 : 1 }}>
                    {enrolling ? 'Procesando…' : isGratis ? 'Inscribirme gratis' : 'Inscribirme ahora'}
                  </button>
                )}
              </div>

              {/* Details list */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '1.1rem 1.5rem' }}>
                <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#9B9894', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '.75rem' }}>Este curso incluye</p>
                {[
                  course.duration_hours && `${course.duration_hours} horas de contenido en video`,
                  totalLessons > 0 && `${totalLessons} lección${totalLessons !== 1 ? 'es' : ''}`,
                  level && `Nivel ${level.toLowerCase()}`,
                  'Acceso de por vida',
                  'Certificado de finalización',
                ].filter(Boolean).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', fontSize: '.82rem', color: 'var(--carbon)', marginBottom: '.45rem', fontWeight: 300 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {item}
                  </div>
                ))}
              </div>

              {/* Not enrolled CTA to login */}
              {!user && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.5rem', background: 'var(--cream)', textAlign: 'center' }}>
                  <p style={{ fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '.5rem' }}>¿Ya tienes una cuenta?</p>
                  <button onClick={() => navigate('login')} style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--jade)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}>Inicia sesión →</button>
                </div>
              )}
            </div>

            {/* Back link */}
            <button onClick={() => navigate('courses')}
              style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', padding: '.25rem 0', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver al catálogo
            </button>
          </div>
        </div>
      </div>

    </>
  )
}
