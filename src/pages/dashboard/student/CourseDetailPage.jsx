import { useEffect, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { sanitizeHtml } from '../../../lib/sanitizeHtml'

const LEVEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

function Avatar({ name, url, size = 40 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return url
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(140deg,var(--jade),var(--jade-dark,#0d4a46))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: size * 0.34 + 'px', fontWeight: 700, color: 'white', fontFamily: 'var(--serif)' }}>{initials}</span>
      </div>
}

export default function CourseDetailPage() {
  const { params, navigate } = useNavigation()
  const { user } = useAuth()
  const slug = params?.slug

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollment, setEnrollment] = useState(null) // null=not-enrolled, object=enrolled
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')
  const [expandedMods, setExpandedMods] = useState(new Set())

  useEffect(() => { if (!slug) navigate('tienda') }, [slug])

  useEffect(() => {
    if (!slug || !user) return
    loadAll()
  }, [slug, user])

  async function loadAll() {
    setLoading(true)
    const [{ data: courseData }, { data: modsData }] = await Promise.all([
      supabase.from('courses')
        .select('id, slug, title, description, cover_image_url, price, level, duration_hours, category_id, categories(name), profiles!instructor_id(id, full_name, bio, avatar_url, profession)')
        .eq('slug', slug).eq('status', 'published').maybeSingle(),
      supabase.from('courses').select('id').eq('slug', slug).eq('status', 'published').maybeSingle()
        .then(({ data: c }) => c
          ? supabase.from('modules')
              .select('id, title, order_index, lessons(id, title, duration_mins, is_free_preview, order_index)')
              .eq('course_id', c.id)
              .order('order_index', { ascending: true })
              .order('order_index', { ascending: true, foreignTable: 'lessons' })
          : { data: [] }
        ),
    ])

    if (!courseData) { setLoading(false); return }
    setCourse(courseData)
    const mods = (modsData?.data || []).map(m => ({ ...m, lessons: m.lessons || [] }))
    setModules(mods)
    if (mods.length > 0) setExpandedMods(new Set([mods[0].id]))

    // Check existing enrollment
    const { data: enrData } = await supabase.from('enrollments')
      .select('id, enrolled_at, completed_at')
      .eq('student_id', user.id).eq('course_id', courseData.id).maybeSingle()
    setEnrollment(enrData || null)
    setLoading(false)
  }

  async function handleEnroll() {
    if (!course || !user || enrolling) return
    setEnrolling(true)
    setEnrollError('')

    const isFree = !course.price || Number(course.price) === 0

    if (isFree) {
      // Direct enrollment — no payment needed
      const { data: enr, error } = await supabase.from('enrollments')
        .insert({ student_id: user.id, course_id: course.id, enrolled_at: new Date().toISOString() })
        .select('id, enrolled_at, completed_at').single()
      if (error) { setEnrollError('No se pudo completar la inscripción. Intenta de nuevo.'); setEnrolling(false); return }
      setEnrolling(false)
      navigate('aprender', { courseId: course.id })
    } else {
      // Paid: create pending order and show confirmation message
      const { error } = await supabase.from('orders')
        .insert({ student_id: user.id, course_id: course.id, amount: course.price, status: 'pending' })
      if (error) { setEnrollError('No se pudo crear la orden. Intenta de nuevo.'); setEnrolling(false); return }
      setEnrolling(false)
      // Show pending state by refetching
      const { data: enrNew } = await supabase.from('enrollments')
        .select('id, enrolled_at, completed_at')
        .eq('student_id', user.id).eq('course_id', course.id).maybeSingle()
      // Check if trigger auto-enrolled already
      setEnrollment(enrNew || { status: 'pending_payment' })
    }
  }

  function toggleMod(id) {
    setExpandedMods(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const totalLessons = modules.flatMap(m => m.lessons).length
  const totalDuration = modules.flatMap(m => m.lessons).reduce((acc, l) => acc + (l.duration_mins || 0), 0)
  const isFree = !course?.price || Number(course?.price) === 0
  const priceDisplay = isFree ? 'Gratis' : `$${Number(course?.price).toFixed(2)}`
  const isEnrolled = enrollment && enrollment.status !== 'pending_payment' && enrollment.enrolled_at
  const isPendingPayment = enrollment?.status === 'pending_payment'

  if (!slug) return null

  return (
    <DashboardLayout>
      <style>{`
        .cdp-pad { padding: 2rem 2.5rem 3rem; }
        .cdp-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }
        .cdp-mod-row { display: flex; align-items: center; gap: .6rem; padding: .75rem 1rem; cursor: pointer; transition: background .15s; user-select: none; -webkit-user-select: none; }
        .cdp-mod-row:hover { background: var(--cream); }
        .cdp-les-row { display: flex; align-items: center; gap: .55rem; padding: .55rem 1rem .55rem 2.5rem; border-top: 1px solid var(--border); }
        @media (max-width: 900px) { .cdp-grid { grid-template-columns: 1fr !important; } .cdp-pad { padding: 1.25rem 1rem 2.5rem !important; } }
      `}</style>

      <div className="cdp-pad">
        {/* Back */}
        <button onClick={() => navigate('tienda')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Tienda
        </button>

        {loading ? (
          <div className="cdp-grid">
            <div>
              <div style={{ height: 340, background: 'var(--border)', borderRadius: 14, marginBottom: '1.5rem', opacity: .5 }} />
              <div style={{ height: 28, width: '70%', background: 'var(--border)', borderRadius: 6, marginBottom: '1rem', opacity: .4 }} />
              <div style={{ height: 16, width: '90%', background: 'var(--border)', borderRadius: 5, opacity: .3 }} />
            </div>
            <div style={{ height: 320, background: 'white', border: '1px solid var(--border)', borderRadius: 14, opacity: .5 }} />
          </div>
        ) : !course ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Curso no encontrado</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>El curso que buscas no existe o no está disponible.</p>
            <button onClick={() => navigate('tienda')}
              style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ver catálogo
            </button>
          </div>
        ) : (
          <div className="cdp-grid">

            {/* ── Left: course info ── */}
            <div>
              {/* Cover */}
              <div style={{ width: '100%', height: 320, borderRadius: 14, background: course.cover_image_url ? `url(${course.cover_image_url}) center/cover no-repeat` : 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', position: 'relative', marginBottom: '1.75rem', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(8,24,28,.7) 0%,transparent 55%)' }} />
                {course.categories?.name && (
                  <span style={{ position: 'absolute', top: 14, left: 14, fontSize: '.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.45)', color: 'white', backdropFilter: 'blur(6px)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                    {course.categories.name}
                  </span>
                )}
                {course.level && (
                  <span style={{ position: 'absolute', top: 14, left: course.categories?.name ? 'auto' : 14, right: course.categories?.name ? 14 : 'auto', fontSize: '.68rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,.45)', color: 'white', backdropFilter: 'blur(6px)' }}>
                    {LEVEL[course.level] || course.level}
                  </span>
                )}
              </div>

              {/* Title + meta */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: '0 0 .75rem' }}>
                  {course.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1rem' }}>
                  {totalLessons > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                      {totalLessons} lecciones
                    </div>
                  )}
                  {(totalDuration > 0 || course.duration_hours) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {totalDuration > 0 ? `${Math.round(totalDuration / 60 * 10) / 10}h` : `${course.duration_hours}h`}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {course.description && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.65rem' }}>Sobre el curso</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--carbon)', lineHeight: 1.85, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(course.description) }} />
                </div>
              )}

              {/* Instructor */}
              {course.profiles && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.85rem' }}>Instructor</div>
                  <div style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                    <Avatar name={course.profiles.full_name} url={course.profiles.avatar_url} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', fontSize: '.95rem', marginBottom: '.2rem' }}>
                        {course.profiles.full_name}
                      </div>
                      {course.profiles.profession && (
                        <div style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '.35rem' }}>{course.profiles.profession}</div>
                      )}
                      {course.profiles.bio && (
                        <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {course.profiles.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum */}
              {modules.length > 0 && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Contenido del curso</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)' }}>{modules.length} módulos · {totalLessons} lecciones</div>
                  </div>
                  {modules.map((mod, mi) => {
                    const isOpen = expandedMods.has(mod.id)
                    return (
                      <div key={mod.id} style={{ borderBottom: mi < modules.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div className="cdp-mod-row" onClick={() => toggleMod(mod.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
                            style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--carbon)' }}>{mod.title}</div>
                            <div style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '.1rem' }}>{mod.lessons.length} lecciones</div>
                          </div>
                        </div>
                        {isOpen && mod.lessons.map(les => (
                          <div key={les.id} className="cdp-les-row">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
                              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="var(--jade)" stroke="none"/>
                            </svg>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '.82rem', color: 'var(--carbon)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{les.title}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                              {les.is_free_preview && (
                                <span style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light,rgba(22,125,120,.18))', padding: '1px 6px', borderRadius: 8 }}>Free</span>
                              )}
                              {les.duration_mins != null && (
                                <span style={{ fontSize: '.7rem', color: 'var(--text-2)' }}>{les.duration_mins} min</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Right: purchase card ── */}
            <div style={{ position: 'sticky', top: '1.5rem' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(23,26,28,.1)' }}>
                {/* Price header */}
                <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: isFree ? '1.5rem' : '2rem', fontWeight: 700, color: isFree ? 'var(--jade)' : 'var(--carbon)', marginBottom: '.2rem' }}>
                    {priceDisplay}
                  </div>
                  {!isFree && <div style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>Pago único · acceso de por vida</div>}
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {/* State: enrolled */}
                  {isEnrolled ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, marginBottom: '1rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: '.84rem', fontWeight: 600, color: '#166534' }}>Ya estás inscrito en este curso</span>
                      </div>
                      <button onClick={() => navigate('aprender', { courseId: course.id })}
                        style={{ width: '100%', padding: '.85rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 10, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-dark,#0d4a46)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--jade)'}>
                        {enrollment?.completed_at ? 'Ver curso completado →' : 'Continuar curso →'}
                      </button>
                    </div>
                  ) : isPendingPayment ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', padding: '.85rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, marginBottom: '1rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <div>
                          <div style={{ fontSize: '.84rem', fontWeight: 600, color: '#92400E', marginBottom: '.25rem' }}>Orden pendiente de confirmación</div>
                          <div style={{ fontSize: '.78rem', color: '#B45309', lineHeight: 1.5 }}>Tu orden fue creada. En cuanto se confirme el pago, el curso aparecerá en tu lista.</div>
                        </div>
                      </div>
                      <button onClick={() => navigate('cursos')}
                        style={{ width: '100%', padding: '.75rem', background: 'var(--cream)', color: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        Ver mis cursos
                      </button>
                    </div>
                  ) : (
                    <div>
                      {enrollError && (
                        <div style={{ padding: '.65rem .9rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: '.8rem', color: '#B91C1C', marginBottom: '.85rem' }}>
                          {enrollError}
                        </div>
                      )}
                      <button onClick={handleEnroll} disabled={enrolling}
                        style={{ width: '100%', padding: '.85rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 10, fontSize: '.95rem', fontWeight: 700, cursor: enrolling ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: enrolling ? .7 : 1, transition: 'background .2s' }}
                        onMouseEnter={e => !enrolling && (e.currentTarget.style.background = 'var(--jade-dark,#0d4a46)')}
                        onMouseLeave={e => !enrolling && (e.currentTarget.style.background = 'var(--jade)')}>
                        {enrolling ? 'Procesando…' : isFree ? 'Inscribirse gratis' : `Comprar — ${priceDisplay}`}
                      </button>

                      {/* Features list */}
                      <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                        {[
                          'Acceso completo al contenido',
                          'Recursos descargables',
                          isFree ? null : 'Acceso de por vida',
                          'Certificado al completar',
                        ].filter(Boolean).map(item => (
                          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: 'var(--text-2)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
