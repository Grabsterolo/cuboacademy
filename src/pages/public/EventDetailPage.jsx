import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { sanitizeHtml } from '../../lib/sanitizeHtml'
import { enrollCourse } from '../../lib/enrollCourse'
import { CourseReviews } from '../../components/reviews/CourseReviews'
import { formatEventDateTime } from '../../lib/formatDate'
import { googleCalendarUrl } from '../../lib/googleCalendar'
import { formatEventLocation } from '../../lib/eventLocation'

const MODALITY_LABEL = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }

export default function EventDetailPage() {
  const { params, navigate } = useNavigation()
  const slug = params?.slug
  const { user } = useAuth()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [pendingOrder, setPendingOrder] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: e, error } = await supabase
        .from('courses')
        .select('*, categories(name), profiles!instructor_id(full_name, bio, avatar_url)')
        .eq('slug', slug)
        .eq('type', 'event')
        .eq('status', 'published')
        .single()

      if (error || !e) { setNotFound(true); setLoading(false); return }
      setEvent(e)

      if (user) {
        const { data: enr } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', e.id)
          .maybeSingle()
        setEnrolled(!!enr)

        if (!enr) {
          const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('student_id', user.id)
            .eq('course_id', e.id)
            .eq('status', 'pending')
            .maybeSingle()
          setPendingOrder(!!order)
        }
      }

      setLoading(false)
    }
    load()
  }, [slug, user])

  async function handleEnroll() {
    if (!user || !event) return
    setEnrolling(true)
    setEnrollError('')
    const result = await enrollCourse({ userId: user.id, course: event })
    if (result.error) { setEnrollError(result.error); setEnrolling(false); return }
    if (result.enrolled) { setEnrolled(true); setEnrolling(false); return }
    if (result.pendingOrder) setPendingOrder(true)
    setEnrolling(false)
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Cargando...</div>
  )
  if (notFound) return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 5%' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.5rem' }}>Evento no encontrado</h2>
      <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem' }}>Este evento no existe o ya no está disponible.</p>
      <button onClick={() => navigate('events')} style={{ padding: '.7rem 1.5rem', background: 'var(--jade)', color: 'white', borderRadius: 9, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Ver eventos</button>
    </div>
  )

  const priceNum = Number(event.price)
  const priceLabel = !event.price || priceNum === 0 ? 'Gratis' : `$${priceNum.toFixed(2)}`
  const isGratis = !event.price || priceNum === 0
  const modality = MODALITY_LABEL[event.modality] || event.modality
  const locationText = formatEventLocation(event)
  const instructor = event.profiles
  const instructorInitials = (instructor?.full_name || '').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()

  return (
    <>
      <style>{`
        .dtl-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2.5rem; align-items: start; }
        .buy-btn { width: 100%; padding: 1rem; border: none; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: var(--serif); transition: opacity .2s; }
        .buy-btn:hover { opacity: .88; }
        @media (max-width: 860px) { .dtl-grid { grid-template-columns: 1fr !important; } }
        /* The sharp cover layer competes with the overlaid title on narrow screens — a
           "contain"-fit image and full-width text end up sharing the same horizontal
           space instead of sitting side by side like they do on desktop. Below the
           image, the blurred backdrop + gradient scrim alone is what keeps the title
           readable, regardless of what's in the source image. */
        .hero-sharp-img { height: 340px; }
        @media (max-width: 640px) { .hero-sharp-img { display: none; } }
      `}</style>

      {/* Hero */}
      <div style={{ minHeight: 340, position: 'relative', display: 'flex', alignItems: 'flex-end', overflow: 'hidden', background: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)' }}>
        {event.cover_image_url && <div style={{ position: 'absolute', inset: -12, backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(.6)' }} />}
        {event.cover_image_url && <div className="hero-sharp-img" style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(8,24,28,.88) 0%,rgba(8,24,28,.4) 60%,transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '2.5rem 5%', width: '100%', boxSizing: 'border-box' }}>
          <nav style={{ fontSize: '.76rem', color: 'rgba(255,255,255,.6)', marginBottom: '1rem', display: 'flex', gap: '.4rem', alignItems: 'center' }}>
            <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 'inherit', padding: 0 }}>Inicio</button>
            <span>›</span>
            <button onClick={() => navigate('events')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 'inherit', padding: 0 }}>Eventos</button>
            <span>›</span>
            <span style={{ color: 'rgba(255,255,255,.9)' }}>{event.title}</span>
          </nav>
          {event.categories?.name && (
            <span style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade-light)', marginBottom: '.6rem', display: 'block' }}>{event.categories.name}</span>
          )}
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '1rem', maxWidth: 700 }}>{event.title}</h1>
          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '.82rem', color: 'rgba(255,255,255,.75)' }}>
            {modality && <span style={{ background: 'rgba(255,255,255,.12)', padding: '3px 10px', borderRadius: 20 }}>{modality}</span>}
            {event.event_start_at && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{formatEventDateTime(event.event_start_at)}</span>}
            {locationText && <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{locationText}</span>}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ background: 'var(--cream)', padding: '2.5rem 5% 4rem' }}>
        <div className="dtl-grid">

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Description */}
            {event.description && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.85rem' }}>Descripción del evento</h2>
                <div className="rich-html" style={{ fontSize: '.9rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }} />
              </div>
            )}

            {/* Instructor card */}
            {instructor && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1rem' }}>Presenta</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {instructor.avatar_url
                    ? <img loading="lazy" src={instructor.avatar_url} alt={instructor.full_name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
                    : <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{instructorInitials}</div>
                  }
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.3rem' }}>{instructor.full_name}</div>
                    {instructor.bio && <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 300 }}>{instructor.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <CourseReviews courseId={event.id} currentUserId={user?.id} canReview={enrolled} />
          </div>

          {/* Right column — sticky price card */}
          <div style={{ position: 'sticky', top: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(23,26,28,.08)' }}>
              {/* Price */}
              <div style={{ padding: '1.5rem 1.5rem 1.1rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.15rem' }}>{priceLabel}</div>
                {!isGratis && <p style={{ fontSize: '.76rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>Pago único · Cupo por evento</p>}
                {isGratis && <p style={{ fontSize: '.76rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '1.25rem' }}>Sin costo · Cupo confirmado al inscribirte</p>}

                {enrolled ? (
                  <div style={{ background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', borderRadius: 10, padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.6rem' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>
                      <span style={{ fontSize: '.84rem', fontWeight: 700, color: 'var(--jade-dark)' }}>Ya estás inscrito</span>
                    </div>
                    {event.event_start_at && (
                      <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', fontWeight: 600, color: 'var(--jade)', textDecoration: 'none' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Agregar al calendario →
                      </a>
                    )}
                  </div>
                ) : pendingOrder ? (
                  <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{ fontSize: '.84rem', fontWeight: 700, color: '#92400E' }}>Inscripción solicitada</span>
                    </div>
                    <p style={{ fontSize: '.76rem', color: '#B45309', lineHeight: 1.55, margin: 0 }}>Tu solicitud fue registrada. El equipo de Cubo Campus verificará el pago y confirmará tu cupo. Te notificaremos cuando esté listo.</p>
                  </div>
                ) : !user ? (
                  <button className="buy-btn" onClick={() => navigate('login')}
                    style={{ background: 'var(--jade)', color: 'white' }}>
                    {isGratis ? 'Inscribirme gratis' : 'Solicitar inscripción'}
                  </button>
                ) : (
                  <>
                    {enrollError && <p style={{ fontSize: '.78rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 7, padding: '.5rem .75rem', marginBottom: '.75rem' }}>{enrollError}</p>}
                    <button className="buy-btn" onClick={handleEnroll} disabled={enrolling}
                      style={{ background: 'var(--jade)', color: 'white', opacity: enrolling ? .7 : 1 }}>
                      {enrolling ? 'Procesando…' : isGratis ? 'Inscribirme gratis' : 'Solicitar inscripción'}
                    </button>
                  </>
                )}
              </div>

              {/* Details list */}
              <div style={{ borderTop: '1px solid var(--border)', padding: '1.1rem 1.5rem' }}>
                <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#9B9894', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '.75rem' }}>Este evento incluye</p>
                {[
                  event.event_start_at && formatEventDateTime(event.event_start_at),
                  modality && `Modalidad ${modality.toLowerCase()}`,
                  formatEventLocation(event),
                  event.capacity && `Cupo limitado (${event.capacity} personas)`,
                  event.has_certificate && 'Certificado de participación',
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
            <button onClick={() => navigate('events')}
              style={{ marginTop: '1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', padding: '.25rem 0', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Volver a eventos
            </button>
          </div>
        </div>
      </div>

    </>
  )
}
