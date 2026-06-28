import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { ModalOverlay } from '../../components/ui/index'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const WA_NUMBER = '50688888888' // replace with real number

function BuyModal({ course, onClose }) {
  const waText = encodeURIComponent(`Hola, me interesa el curso "${course.title}" en Cubo Academy.`)
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem 2.5rem', width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(23,26,28,.18)', textAlign: 'center' }}>
        <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', color: 'var(--jade)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.5rem' }}>Pagos próximamente</h3>
        <p style={{ fontSize: '.84rem', color: 'var(--text-2)', lineHeight: 1.65, marginBottom: '1.5rem', fontWeight: 300 }}>
          Estamos integrando el sistema de pagos en línea. ¿Te interesa este curso? Escríbenos y te ayudamos.
        </p>
        <a href={`https://wa.me/${WA_NUMBER}?text=${waText}`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem', width: '100%', padding: '.85rem', background: '#25D366', border: 'none', borderRadius: 9, fontSize: '.95rem', fontWeight: 700, color: 'white', textDecoration: 'none', marginBottom: '.75rem', fontFamily: 'var(--sans)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          Contactar por WhatsApp
        </a>
        <button onClick={onClose}
          style={{ width: '100%', padding: '.75rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 9, fontSize: '.88rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          Cerrar
        </button>
      </div>
    </ModalOverlay>
  )
}

export default function CourseDetailPage() {
  const { params, navigate } = useNavigation()
  const slug = params?.slug
  const { user } = useAuth()

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [expanded, setExpanded] = useState(new Set())
  const [showBuyModal, setShowBuyModal] = useState(false)

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

      // Check enrollment
      if (user) {
        const { data: enr } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', c.id)
          .maybeSingle()
        setEnrolled(!!enr)
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
                <p style={{ fontSize: '.9rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, whiteSpace: 'pre-line' }}>{course.description}</p>
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
                  <Link to={`/dashboard/cursos/${course.id}/aprender`}
                    style={{ display: 'block', width: '100%', padding: '1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--serif)', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
                    Ir al curso →
                  </Link>
                ) : (
                  <button className="buy-btn" onClick={() => setShowBuyModal(true)}
                    style={{ background: 'var(--jade)', color: 'white' }}>
                    {isGratis ? 'Inscribirme gratis' : 'Inscribirme ahora'}
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
                  <Link to="/login" style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--jade)', textDecoration: 'none' }}>Inicia sesión →</Link>
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

      {showBuyModal && <BuyModal course={course} onClose={() => setShowBuyModal(false)} />}
    </>
  )
}
