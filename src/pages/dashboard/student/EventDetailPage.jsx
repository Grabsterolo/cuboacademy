import { useEffect, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { sanitizeHtml } from '../../../lib/sanitizeHtml'
import { enrollCourse } from '../../../lib/enrollCourse'
import { googleCalendarUrl } from '../../../lib/googleCalendar'
import { formatEventLocation } from '../../../lib/eventLocation'
import { CourseReviews } from '../../../components/reviews/CourseReviews'
import { Avatar } from '../../../components/ui'
import { formatEventDateTime } from '../../../lib/formatDate'

const MODALITY_LABEL = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }

export default function EventDetailPage() {
  const { params, navigate } = useNavigation()
  const { user } = useAuth()
  const slug = params?.slug

  const [event, setEvent] = useState(null)
  const [enrollment, setEnrollment] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => { if (!slug) navigate('tienda', { tab: 'events' }) }, [slug])

  useEffect(() => {
    if (!slug || !user) return
    loadAll()
  }, [slug, user])

  async function loadAll() {
    setLoading(true)
    const { data: eventData } = await supabase.from('courses')
      .select('id, slug, title, description, cover_image_url, price, modality, event_start_at, event_end_at, country, city, location, capacity, has_certificate, category_id, categories(name), profiles!instructor_id(id, full_name, bio, avatar_url, profession)')
      .eq('slug', slug).eq('type', 'event').eq('status', 'published').maybeSingle()

    if (!eventData) { setLoading(false); return }
    setEvent(eventData)

    const { data: enrData } = await supabase.from('enrollments')
      .select('id, enrolled_at, completed_at')
      .eq('student_id', user.id).eq('course_id', eventData.id).maybeSingle()
    setEnrollment(enrData || null)

    if (!enrData) {
      const { data: orderData } = await supabase.from('orders')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', eventData.id)
        .eq('status', 'pending')
        .maybeSingle()
      setPendingOrder(!!orderData)
    }

    setLoading(false)
  }

  async function handleEnroll() {
    if (!event || !user || enrolling) return
    setEnrolling(true)
    setEnrollError('')
    const result = await enrollCourse({ userId: user.id, course: event })
    if (result.error) { setEnrollError(result.error); setEnrolling(false); return }
    if (result.enrolled) { setEnrollment(result.enrollment); setEnrolling(false); return }
    if (result.pendingOrder) setPendingOrder(true)
    setEnrolling(false)
  }

  const isFree = !event?.price || Number(event?.price) === 0
  const priceDisplay = isFree ? 'Gratis' : `$${Number(event?.price).toFixed(2)}`
  const isEnrolled = !!enrollment?.enrolled_at
  const modality = event ? MODALITY_LABEL[event.modality] || event.modality : ''
  const locationText = event ? formatEventLocation(event) : ''

  if (!slug) return null

  return (
    <DashboardLayout>
      <style>{`
        .edp-pad { padding: 2rem 2.5rem 3rem; }
        .edp-grid { display: grid; grid-template-columns: 1fr 340px; gap: 2rem; align-items: start; }
        @media (max-width: 900px) { .edp-grid { grid-template-columns: 1fr !important; } .edp-pad { padding: 1.25rem 1rem 2.5rem !important; } }
      `}</style>

      <div className="edp-pad">
        {/* Back */}
        <button onClick={() => navigate('tienda', { tab: 'events' })}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '1.25rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Tienda
        </button>

        {loading ? (
          <div className="edp-grid">
            <div>
              <div style={{ height: 340, background: 'var(--border)', borderRadius: 14, marginBottom: '1.5rem', opacity: .5 }} />
              <div style={{ height: 28, width: '70%', background: 'var(--border)', borderRadius: 6, marginBottom: '1rem', opacity: .4 }} />
              <div style={{ height: 16, width: '90%', background: 'var(--border)', borderRadius: 5, opacity: .3 }} />
            </div>
            <div style={{ height: 320, background: 'white', border: '1px solid var(--border)', borderRadius: 14, opacity: .5 }} />
          </div>
        ) : !event ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Evento no encontrado</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>El evento que buscas no existe o no está disponible.</p>
            <button onClick={() => navigate('tienda', { tab: 'events' })}
              style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ver eventos
            </button>
          </div>
        ) : (
          <div className="edp-grid">

            {/* ── Left: event info ── */}
            <div>
              {/* Cover */}
              <div style={{ width: '100%', height: 320, borderRadius: 14, marginBottom: '1.75rem', position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)' }}>
                {event.cover_image_url && <div style={{ position: 'absolute', inset: -12, backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(24px) brightness(.6)' }} />}
                {event.cover_image_url && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${event.cover_image_url})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />}
              </div>

              {/* Title + meta */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: '0 0 .75rem' }}>
                  {event.title}
                </h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1rem' }}>
                  {event.categories?.name && (
                    <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--jade)', background: 'var(--jade-soft)', padding: '4px 10px', borderRadius: 20 }}>
                      {event.categories.name}
                    </div>
                  )}
                  {modality && (
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', padding: '4px 10px', borderRadius: 20 }}>
                      {modality}
                    </div>
                  )}
                  {event.event_start_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {formatEventDateTime(event.event_start_at)}
                    </div>
                  )}
                  {locationText && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', color: 'var(--text-2)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {locationText}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.65rem' }}>Sobre el evento</div>
                  <div className="rich-html" style={{ fontSize: '.9rem', color: 'var(--carbon)', lineHeight: 1.85, fontWeight: 300 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }} />
                </div>
              )}

              {/* Instructor */}
              {event.profiles && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.4rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.85rem' }}>Presenta</div>
                  <div style={{ display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                    <Avatar name={event.profiles.full_name} url={event.profiles.avatar_url} size={44} fontScale={0.34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', fontSize: '.95rem', marginBottom: '.2rem' }}>
                        {event.profiles.full_name}
                      </div>
                      {event.profiles.profession && (
                        <div style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 600, marginBottom: '.35rem' }}>{event.profiles.profession}</div>
                      )}
                      {event.profiles.bio && (
                        <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0, fontWeight: 300, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {event.profiles.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews */}
              <CourseReviews courseId={event.id} currentUserId={user?.id} canReview={isEnrolled} />
            </div>

            {/* ── Right: purchase / ticket card ── */}
            <div style={{ position: 'sticky', top: '1.5rem' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 8px 40px rgba(23,26,28,.1)' }}>
                {/* Price header */}
                <div style={{ padding: '1.5rem 1.5rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: isFree ? '1.5rem' : '2rem', fontWeight: 700, color: isFree ? 'var(--jade)' : 'var(--carbon)', marginBottom: '.2rem' }}>
                    {priceDisplay}
                  </div>
                  {!isFree && <div style={{ fontSize: '.78rem', color: 'var(--text-2)' }}>Pago único · cupo por evento</div>}
                </div>

                <div style={{ padding: '1.25rem 1.5rem' }}>
                  {/* State: enrolled */}
                  {isEnrolled ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, marginBottom: '1rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize: '.84rem', fontWeight: 600, color: '#166534' }}>Ya estás inscrito en este evento</span>
                      </div>
                      {event.event_start_at && (
                        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.45rem', width: '100%', padding: '.85rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 10, fontSize: '.9rem', fontWeight: 700, textDecoration: 'none', boxSizing: 'border-box' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Agregar al calendario
                        </a>
                      )}
                      {event.has_certificate && (
                        <p style={{ fontSize: '.76rem', color: 'var(--text-2)', marginTop: '.9rem', lineHeight: 1.55 }}>
                          Tu certificado de participación aparecerá en <strong>Mis certificados</strong> una vez que se confirme tu asistencia al evento.
                        </p>
                      )}
                    </div>
                  ) : pendingOrder ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.55rem', padding: '.9rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 9, marginBottom: '1rem' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <div>
                          <div style={{ fontSize: '.84rem', fontWeight: 700, color: '#92400E', marginBottom: '.3rem' }}>Inscripción solicitada</div>
                          <div style={{ fontSize: '.77rem', color: '#B45309', lineHeight: 1.55 }}>Tu solicitud fue registrada. El equipo de Cubo Campus verificará el pago y confirmará tu cupo. Te notificaremos cuando esté listo.</div>
                        </div>
                      </div>
                      <button onClick={() => navigate('tienda', { tab: 'purchases' })}
                        style={{ width: '100%', padding: '.75rem', background: 'var(--cream)', color: 'var(--carbon)', border: '1px solid var(--border)', borderRadius: 10, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        Ver mis solicitudes →
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
                        {enrolling ? 'Procesando…' : isFree ? 'Inscribirse gratis' : `Solicitar inscripción — ${priceDisplay}`}
                      </button>

                      {/* Features list */}
                      <div style={{ marginTop: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
                        {[
                          event.event_start_at && formatEventDateTime(event.event_start_at),
                          modality && `Modalidad ${modality.toLowerCase()}`,
                          event.capacity && `Cupo limitado (${event.capacity} personas)`,
                          event.has_certificate ? 'Certificado de participación' : null,
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
