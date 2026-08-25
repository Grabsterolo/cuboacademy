import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import { useCourseRatingSummaries, RatingBadge } from '../../../components/reviews/CourseReviews'
import { STATUS_TONE } from '../../../components/ui'
import { formatDateLong, formatEventDateTime } from '../../../lib/formatDate'
import { PaymentInstructions } from '../../../components/payment/PaymentInstructions'
import { orderReference, paymentProviderLabel } from '../../../lib/paymentInfo'
import { runQuery } from '../../../lib/db'
import { useOwnedCourses } from '../../../lib/useOwnedCourses'
import { ErrorState } from '../../../components/ui/ErrorState'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const LEVEL_OPTS = ['', 'beginner', 'intermediate', 'advanced']
const LEVEL_NAMES = { '': 'Todos', beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const MODALITY_LABEL = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }
const MODALITY_OPTS = ['', 'presencial', 'virtual', 'hibrido']
const MODALITY_NAMES = { '': 'Todas', presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }
// Las órdenes pendientes no llevan `hint`: en su lugar se muestra el panel
// completo de instrucciones de pago, que es lo que el estudiante necesita para
// poder avanzar. Un aviso de "esperando confirmación" no le decía cómo pagar.
const ORDER_STATUS_STYLE = {
  completed: { label: 'Pagado',      hint: null, ...STATUS_TONE.success },
  pending:   { label: 'En revisión', hint: null, ...STATUS_TONE.warning },
  failed:    { label: 'Rechazada',   hint: null, ...STATUS_TONE.danger },
}

function CourseCard({ course, wishlistIds, onToggleWishlist, rating, owned, pending }) {
  const { navigate } = useNavigation()
  const isEvent = course.type === 'event'
  const cover = course.cover_image_url
  const priceNum = Number(course.price)
  const price = !course.price || priceNum === 0 ? 'Gratis' : `$${priceNum.toFixed(2)}`
  const isGratis = !course.price || priceNum === 0
  const instructor = course.profiles?.full_name || '—'
  const category = course.categories?.name || ''
  const level = isEvent ? (MODALITY_LABEL[course.modality] || '') : (LEVEL_LABEL[course.level] || '')
  const inWishlist = wishlistIds.includes(course.id)

  const goToDetail = () => navigate(isEvent ? 'evento-detalle' : 'curso-detalle', { slug: course.slug })

  return (
    <div className="s-card" role="button" tabIndex={0} onClick={goToDetail}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToDetail() } }}
      style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', cursor: 'pointer' }}>
      {/* Wishlist button */}
      <button onClick={e => { e.stopPropagation(); onToggleWishlist(course.id) }} title={inWishlist ? 'Quitar de lista de deseos' : 'Agregar a lista de deseos'}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: inWishlist ? 'rgba(201,110,75,.9)' : 'rgba(0,0,0,.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background .18s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={inWishlist ? 'white' : 'none'} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {/* Cover */}
      <div style={{ aspectRatio: '1 / 1', position: 'relative', overflow: 'hidden', background: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', flexShrink: 0 }}>
        {cover && <div style={{ position: 'absolute', inset: -12, backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px) brightness(.6)' }} />}
        {cover && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${cover})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} />}
      </div>

      {/* Body */}
      <div style={{ padding: '.9rem 1rem 1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
          {level && <span style={{ fontSize: '.64rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', padding: '3px 8px', borderRadius: 20 }}>{level}</span>}
          {isEvent ? (course.event_start_at && (
            <span style={{ fontSize: '.72rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {formatEventDateTime(course.event_start_at)}
            </span>
          )) : (course.duration_hours && (
            <span style={{ fontSize: '.72rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {course.duration_hours}h
            </span>
          ))}
        </div>
        {category && <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '.3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{category}</div>}
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.35, flex: 1, marginBottom: '.5rem' }}>{course.title}</h3>
        {rating?.count > 0 && <div style={{ marginBottom: '.35rem' }}><RatingBadge avg={rating.avg} count={rating.count} /></div>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.3rem' }}>
          <div style={{ fontSize: '.74rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.3rem', minWidth: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{instructor}</span>
          </div>
          {/* El precio solo tiene sentido si todavía se puede comprar. A quien
              ya lo pagó, verlo otra vez con etiqueta de precio es desconcertante
              — y con una solicitud en revisión, invita a duplicarla. */}
          {owned ? (
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid rgba(22,125,120,.25)', padding: '2px 8px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>
              Ya lo tienes
            </span>
          ) : pending ? (
            <span style={{ fontSize: '.68rem', fontWeight: 700, color: '#B45309', background: '#FFFBEB', border: '1px solid #FDE68A', padding: '2px 8px', borderRadius: 20, flexShrink: 0, whiteSpace: 'nowrap' }}>
              En revisión
            </span>
          ) : (
            <span style={{ fontSize: '.78rem', fontWeight: 700, color: isGratis ? 'var(--jade)' : 'var(--carbon)', flexShrink: 0 }}>{price}</span>
          )}
        </div>

        {owned && (
          <button
            onClick={e => {
              e.stopPropagation()
              // Un curso se retoma en el reproductor; un evento no tiene
              // lecciones, así que su sitio es la ficha con fecha y ubicación.
              if (isEvent) navigate('evento-detalle', { slug: course.slug })
              else navigate('aprender', { courseId: course.id })
            }}
            style={{ marginTop: '.6rem', width: '100%', padding: '.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            {isEvent ? 'Ver evento' : 'Ir al curso'}
          </button>
        )}
        {pending && (
          <button
            onClick={e => { e.stopPropagation(); navigate('tienda', { tab: 'purchases' }) }}
            style={{ marginTop: '.6rem', width: '100%', padding: '.5rem', background: 'white', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
            Ver mi solicitud
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Separa lo que el estudiante puede comprar de lo que ya tiene.
 *
 * Lo adquirido no se oculta —sigue siendo útil llegar a ello desde aquí— pero
 * baja a su propia sección, para que el catálogo de arriba sea de verdad «lo
 * que puedes comprar» y no una mezcla donde hay que leer cada tarjeta.
 */
function StoreGrid({ items, owned, pending, wishlistIds, onToggleWishlist, ratings, emptyText }) {
  const available = items.filter(c => !owned.has(c.id))
  const inLibrary = items.filter(c => owned.has(c.id))

  if (items.length === 0) {
    return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)', fontSize: '.9rem' }}>{emptyText}</div>
  }

  const card = c => (
    <CourseCard key={c.id} course={c} wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist}
      rating={ratings[c.id]} owned={owned.has(c.id)} pending={pending.has(c.id)} />
  )

  return (
    <>
      {available.length > 0 && <div className="st-grid">{available.map(card)}</div>}

      {inLibrary.length > 0 && (
        <div style={{ marginTop: available.length > 0 ? '2.25rem' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Tu biblioteca</h2>
            <span style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>
              {inLibrary.length} {inLibrary.length === 1 ? 'ya adquirido' : 'ya adquiridos'}
            </span>
          </div>
          <div className="st-grid">{inLibrary.map(card)}</div>
        </div>
      )}

      {available.length === 0 && inLibrary.length > 0 && (
        <p style={{ fontSize: '.82rem', color: 'var(--text-2)', textAlign: 'center', marginTop: '1.5rem' }}>
          No hay nada nuevo para ti con estos filtros — ya tienes todo lo que coincide.
        </p>
      )}
    </>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ aspectRatio: '1 / 1', background: 'var(--border)' }} />
      <div style={{ padding: '.9rem 1rem' }}>
        <div style={{ height: 10, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem' }} />
        <div style={{ height: 14, width: '85%', background: 'var(--border)', borderRadius: 4, marginBottom: '.35rem' }} />
        <div style={{ height: 10, width: '55%', background: 'var(--border)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Catalog tab ──────────────────────────────────────────────────────────────
function CatalogTab({ wishlistIds, onToggleWishlist, owned, pending }) {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const ratings = useCourseRatingSummaries(courses.map(c => c.id))

  useEffect(() => {
    Promise.all([
      supabase.from('courses')
        .select('id, slug, title, cover_image_url, price, level, duration_hours, category_id, categories(name), profiles!instructor_id(full_name)')
        .eq('type', 'course')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('categories').select('id, name').order('name'),
    ]).then(([{ data: c }, { data: cats }]) => {
      setCourses(c || [])
      setCategories(cats || [])
      setLoading(false)
    })
  }, [])

  const filtered = courses.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.title.toLowerCase().includes(q) ||
      (c.profiles?.full_name || '').toLowerCase().includes(q) ||
      (c.categories?.name || '').toLowerCase().includes(q)
    const matchCat = !catFilter || c.category_id === catFilter
    const matchLevel = !levelFilter || c.level === levelFilter
    return matchSearch && matchCat && matchLevel
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar cursos…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
            onFocus={e => e.target.style.borderColor = 'var(--jade)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          style={{ padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          {LEVEL_OPTS.map(v => <option key={v} value={v}>{LEVEL_NAMES[v]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="st-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <StoreGrid items={filtered} owned={owned} pending={pending}
          wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} ratings={ratings}
          emptyText="No se encontraron cursos con esos filtros." />
      )}
    </div>
  )
}

// ─── Events tab ───────────────────────────────────────────────────────────────
function EventsTab({ wishlistIds, onToggleWishlist, owned, pending }) {
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalityFilter, setModalityFilter] = useState('')
  const ratings = useCourseRatingSummaries(events.map(e => e.id))

  useEffect(() => {
    Promise.all([
      supabase.from('courses')
        .select('id, slug, title, cover_image_url, price, type, modality, event_start_at, category_id, categories(name), profiles!instructor_id(full_name)')
        .eq('type', 'event')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('event_start_at', { ascending: true })
        .limit(500),
      supabase.from('categories').select('id, name').order('name'),
    ]).then(([{ data: e }, { data: cats }]) => {
      setEvents(e || [])
      setCategories(cats || [])
      setLoading(false)
    })
  }, [])

  const filtered = events.filter(e => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      e.title.toLowerCase().includes(q) ||
      (e.profiles?.full_name || '').toLowerCase().includes(q) ||
      (e.categories?.name || '').toLowerCase().includes(q)
    const matchCat = !catFilter || e.category_id === catFilter
    const matchModality = !modalityFilter || e.modality === modalityFilter
    return matchSearch && matchCat && matchModality
  })

  return (
    <div>
      {/* Filters */}
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar eventos…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
            onFocus={e => e.target.style.borderColor = 'var(--jade)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={modalityFilter} onChange={e => setModalityFilter(e.target.value)}
          style={{ padding: '.55rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          {MODALITY_OPTS.map(v => <option key={v} value={v}>{MODALITY_NAMES[v]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="st-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <StoreGrid items={filtered} owned={owned} pending={pending}
          wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} ratings={ratings}
          emptyText="No se encontraron eventos con esos filtros." />
      )}
    </div>
  )
}

// ─── Wishlist tab ─────────────────────────────────────────────────────────────
function WishlistTab({ wishlistIds, onToggleWishlist, owned, pending }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    if (!wishlistIds.length) { setCourses([]); return }
    setLoading(true)
    runQuery(
      supabase.from('courses')
        .select('id, slug, title, cover_image_url, price, type, level, duration_hours, modality, event_start_at, categories(name), profiles!instructor_id(full_name)')
        .in('id', wishlistIds)
        .eq('status', 'published'),
      'StudentStorePage: lista de deseos',
    ).then(({ data, error }) => { setLoadErr(error); setCourses(data || []); setLoading(false) })
  }, [wishlistIds])

  if (loadErr) return (
    <ErrorState
      title="No pudimos cargar tu lista de deseos"
      description="Falló la consulta, así que puede haber cursos guardados que no se están mostrando."
      error={loadErr}
      onRetry={() => window.location.reload()}
    />
  )

  if (!wishlistIds.length) return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--jade)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Tu lista de deseos está vacía</h2>
      <p style={{ fontSize: '.84rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>Guarda cursos que te interesen desde el catálogo usando el ícono ❤</p>
    </div>
  )

  if (loading) return <div className="st-grid"><SkeletonCard /><SkeletonCard /></div>

  return (
    <StoreGrid items={courses} owned={owned} pending={pending}
      wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} ratings={{}}
      emptyText="Tu lista de deseos está vacía." />
  )
}

// ─── Purchases tab ────────────────────────────────────────────────────────────
function PurchasesTab({ user }) {
  const { navigate } = useNavigation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    if (!user) return
    runQuery(
      supabase.from('orders')
        .select('id, amount, currency, status, created_at, payment_provider, provider_order_id, courses(id, slug, title, cover_image_url, type, categories(name))')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false }),
      'StudentStorePage: mis compras',
    ).then(({ data, error }) => { setLoadErr(error); setOrders(data || []); setLoading(false) })
  }, [user])


  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
      {[1,2].map(i => <div key={i} style={{ height: 72, background: 'white', border: '1px solid var(--border)', borderRadius: 10 }} />)}
    </div>
  )

  if (loadErr) return (
    <ErrorState
      title="No pudimos cargar tus compras"
      description="Falló la consulta. Si hiciste una solicitud de inscripción, sigue registrada — es esta lista la que no cargó."
      error={loadErr}
      onRetry={() => window.location.reload()}
    />
  )

  if (!orders.length) return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
      <div style={{ width: 48, height: 48, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--jade)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Sin compras aún</h2>
      <p style={{ fontSize: '.84rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>Aquí aparecerá el historial de tus compras cuando realices tu primera inscripción.</p>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
      {orders.map(order => {
        const c = order.courses
        const st = ORDER_STATUS_STYLE[order.status] || ORDER_STATUS_STYLE.pending
        const date = formatDateLong(order.created_at)
        return (
          <div key={order.id} style={{ background: 'white', border: `1px solid ${order.status === 'pending' ? '#FDE68A' : 'var(--border)'}`, borderRadius: 10, padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {c?.cover_image_url && <div style={{ width: 52, height: 36, borderRadius: 6, background: `url(${c.cover_image_url}) center/cover no-repeat`, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', fontSize: '.9rem', marginBottom: '.2rem' }}>
                  {c ? <span style={{ cursor: 'pointer', color: 'inherit' }} onClick={() => navigate(c.type === 'event' ? 'evento-detalle' : 'curso-detalle', { slug: c.slug })}>{c.title}</span> : `Orden ${order.id.slice(0,8)}`}
                </div>
                {/* El medio de pago va con etiqueta legible, nunca el valor del
                    enum: el recibo llegó a imprimir «paypal» tal cual, un medio
                    que ni siquiera existe en la plataforma. Solo se muestra en
                    órdenes ya pagadas — en una pendiente todavía no se sabe. */}
                <div style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>
                  {date} · Ref. {orderReference(order.id)}
                  {order.status === 'completed' && order.payment_provider && (
                    <> · {paymentProviderLabel(order.payment_provider)}</>
                  )}
                  {order.status === 'completed' && order.provider_order_id && (
                    <> · Comprobante {order.provider_order_id}</>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {order.amount && <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', color: 'var(--carbon)' }}>${Number(order.amount).toFixed(2)}</span>}
                <span style={{ fontSize: '.68rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, border: st.border, whiteSpace: 'nowrap' }}>{st.label}</span>
              </div>
            </div>
            {st.hint && (
              <div style={{ marginTop: '.6rem', paddingTop: '.6rem', borderTop: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span style={{ fontSize: '.73rem', color: '#B45309' }}>{st.hint}</span>
              </div>
            )}
            {order.status === 'pending' && (
              <div style={{ marginTop: '.75rem' }}>
                <PaymentInstructions order={order} compact />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentStorePage() {
  const { user } = useAuth()
  // Cruce con lo que el estudiante ya tiene: sin esto la tienda le ofrece
  // comprar de nuevo un curso que ya pagó y completó.
  const { owned, pending } = useOwnedCourses(user)
  const { params } = useNavigation()
  const [tab, setTab] = useState(params?.tab || 'catalog')
  const [wishlistIds, setWishlistIds] = useState([])

  useEffect(() => {
    if (!user) return
    runQuery(
      supabase.from('wishlist_items').select('course_id').eq('student_id', user.id),
      'StudentStorePage: ids de lista de deseos',
    ).then(({ data }) => setWishlistIds((data || []).map(r => r.course_id)))
  }, [user])

  const toggleWishlist = useCallback((courseId) => {
    if (!user) return
    setWishlistIds(prev => {
      const inWishlist = prev.includes(courseId)
      if (inWishlist) {
        supabase.from('wishlist_items').delete().eq('student_id', user.id).eq('course_id', courseId).then()
        return prev.filter(id => id !== courseId)
      }
      supabase.from('wishlist_items').insert({ student_id: user.id, course_id: courseId }).then()
      return [...prev, courseId]
    })
  }, [user])

  const TABS = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'events', label: 'Eventos' },
    { id: 'wishlist', label: `Lista de deseos${wishlistIds.length ? ` (${wishlistIds.length})` : ''}` },
    { id: 'purchases', label: 'Mis compras' },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .st-pad { padding: 1.25rem 1rem 2rem !important; } .st-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 1300px) { .st-grid { grid-template-columns: repeat(3,1fr) !important; } }
        @media (max-width: 1000px) { .st-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .st-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.1rem; }
        .s-card { transition: transform .2s, box-shadow .2s; }
        .s-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(23,26,28,.09); }
        .st-tab { padding: .55rem 1.1rem; border: none; border-radius: 7px; cursor: pointer; font-size: .84rem; font-weight: 600; font-family: var(--sans); transition: all .15s; white-space: nowrap; }
        .st-tab.active { background: var(--jade); color: white; }
        .st-tab:not(.active) { background: transparent; color: var(--text-2); }
        .st-tab:not(.active):hover { background: var(--jade-soft); color: var(--jade); }
      `}</style>

      <div className="st-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Tienda</h1>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '.3rem', marginBottom: '1.5rem', background: 'var(--cream)', padding: '.35rem', borderRadius: 9, width: 'fit-content', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t.id} className={`st-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'catalog' && <CatalogTab wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} owned={owned} pending={pending} />}
        {tab === 'events' && <EventsTab wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} owned={owned} pending={pending} />}
        {tab === 'wishlist' && <WishlistTab wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} owned={owned} pending={pending} />}
        {tab === 'purchases' && <PurchasesTab user={user} />}
      </div>
    </DashboardLayout>
  )
}
