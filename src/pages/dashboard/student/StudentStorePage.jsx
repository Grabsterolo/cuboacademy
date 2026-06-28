import { useState, useEffect, useCallback } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const LEVEL_OPTS = ['', 'beginner', 'intermediate', 'advanced']
const LEVEL_NAMES = { '': 'Todos', beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const WL_KEY = 'cubo_wishlist' // localStorage key, stores array of course IDs

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WL_KEY) || '[]') } catch { return [] }
}
function saveWishlist(ids) {
  localStorage.setItem(WL_KEY, JSON.stringify(ids))
}

function CourseCard({ course, wishlistIds, onToggleWishlist }) {
  const { navigate } = useNavigation()
  const cover = course.cover_image_url
  const priceNum = Number(course.price)
  const price = !course.price || priceNum === 0 ? 'Gratis' : `$${priceNum.toFixed(2)}`
  const isGratis = !course.price || priceNum === 0
  const instructor = course.profiles?.full_name || '—'
  const category = course.categories?.name || ''
  const level = LEVEL_LABEL[course.level] || ''
  const inWishlist = wishlistIds.includes(course.id)

  return (
    <div className="s-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Wishlist button */}
      <button onClick={e => { e.stopPropagation(); onToggleWishlist(course.id) }} title={inWishlist ? 'Quitar de lista de deseos' : 'Agregar a lista de deseos'}
        style={{ position: 'absolute', top: 10, right: 10, zIndex: 2, background: inWishlist ? 'rgba(201,110,75,.9)' : 'rgba(0,0,0,.4)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background .18s' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={inWishlist ? 'white' : 'none'} stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </button>

      {/* Cover */}
      <div onClick={() => navigate('course-detail', { slug: course.slug })} style={{ height: 160, background: cover ? `url(${cover}) center/cover no-repeat` : 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(8,24,28,.65) 0%,transparent 55%)' }} />
        {level && <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '.64rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,.4)', color: 'white', backdropFilter: 'blur(4px)', letterSpacing: '.04em' }}>{level}</span>}
        <span style={{ position: 'absolute', bottom: 9, left: 10, fontSize: '.72rem', fontWeight: 700, color: 'white', background: isGratis ? 'rgba(22,125,120,.9)' : 'var(--jade)', padding: '2px 8px', borderRadius: 10 }}>{price}</span>
        {course.duration_hours && <span style={{ position: 'absolute', bottom: 9, right: 10, fontSize: '.67rem', color: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {course.duration_hours}h
        </span>}
      </div>

      {/* Body */}
      <div onClick={() => navigate('course-detail', { slug: course.slug })} style={{ padding: '.9rem 1rem 1rem', flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
        {category && <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '.3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{category}</div>}
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.35, flex: 1, marginBottom: '.5rem' }}>{course.title}</h3>
        <div style={{ fontSize: '.74rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {instructor}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ height: 160, background: 'var(--border)' }} />
      <div style={{ padding: '.9rem 1rem' }}>
        <div style={{ height: 10, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem' }} />
        <div style={{ height: 14, width: '85%', background: 'var(--border)', borderRadius: 4, marginBottom: '.35rem' }} />
        <div style={{ height: 10, width: '55%', background: 'var(--border)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// ─── Catalog tab ──────────────────────────────────────────────────────────────
function CatalogTab({ wishlistIds, onToggleWishlist }) {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')

  useEffect(() => {
    Promise.all([
      supabase.from('courses')
        .select('id, slug, title, cover_image_url, price, level, duration_hours, category_id, categories(name), profiles!instructor_id(full_name)')
        .eq('status', 'published')
        .order('created_at', { ascending: false }),
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
      <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap', marginBottom: '1.25rem', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
            style={{ position: 'absolute', left: '.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar cursos…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '.6rem .75rem .6rem 2.2rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        {/* Category select */}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ padding: '.6rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {/* Level select */}
        <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
          style={{ padding: '.6rem .85rem', borderRadius: 8, border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', fontSize: '.84rem', fontFamily: 'var(--sans)', cursor: 'pointer', outline: 'none' }}>
          {LEVEL_OPTS.map(v => <option key={v} value={v}>{LEVEL_NAMES[v]}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="st-grid"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)', fontSize: '.9rem' }}>
          No se encontraron cursos con esos filtros.
        </div>
      ) : (
        <div className="st-grid">
          {filtered.map(c => <CourseCard key={c.id} course={c} wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} />)}
        </div>
      )}
    </div>
  )
}

// ─── Wishlist tab ─────────────────────────────────────────────────────────────
function WishlistTab({ wishlistIds, onToggleWishlist }) {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!wishlistIds.length) { setCourses([]); return }
    setLoading(true)
    supabase.from('courses')
      .select('id, slug, title, cover_image_url, price, level, duration_hours, categories(name), profiles!instructor_id(full_name)')
      .in('id', wishlistIds)
      .eq('status', 'published')
      .then(({ data }) => { setCourses(data || []); setLoading(false) })
  }, [wishlistIds])

  if (!wishlistIds.length) return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 420 }}>
      <div style={{ width: 48, height: 48, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--jade)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Tu lista de deseos está vacía</h2>
      <p style={{ fontSize: '.84rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>Guarda cursos que te interesen desde el catálogo usando el ícono ❤</p>
    </div>
  )

  if (loading) return <div className="st-grid"><SkeletonCard /><SkeletonCard /></div>

  return (
    <div className="st-grid">
      {courses.map(c => <CourseCard key={c.id} course={c} wishlistIds={wishlistIds} onToggleWishlist={onToggleWishlist} />)}
    </div>
  )
}

// ─── Purchases tab ────────────────────────────────────────────────────────────
function PurchasesTab({ user }) {
  const { navigate } = useNavigation()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('orders')
      .select('id, amount, status, created_at, payment_provider, courses(id, slug, title, cover_image_url, categories(name))')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const STATUS_STYLE = {
    completed: { label: 'Pagado', bg: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' },
    pending:   { label: 'Pendiente', bg: '#FFF9E6', color: '#B45309', border: '1px solid #FBBF24' },
    failed:    { label: 'Fallido', bg: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
  }

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
      {[1,2].map(i => <div key={i} style={{ height: 72, background: 'white', border: '1px solid var(--border)', borderRadius: 10 }} />)}
    </div>
  )

  if (!orders.length) return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 420 }}>
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
        const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending
        const date = new Date(order.created_at).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })
        return (
          <div key={order.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {c?.cover_image_url && <div style={{ width: 52, height: 36, borderRadius: 6, background: `url(${c.cover_image_url}) center/cover no-repeat`, flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--carbon)', fontSize: '.9rem', marginBottom: '.2rem' }}>
                {c ? <span style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }} onClick={() => navigate('course-detail', { slug: c.slug })}>{c.title}</span> : `Orden ${order.id.slice(0,8)}`}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>{date} {order.payment_provider ? `· ${order.payment_provider}` : ''}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {order.amount && <span style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', color: 'var(--carbon)' }}>${Number(order.amount).toFixed(2)}</span>}
              <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color, border: st.border }}>{st.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function StudentStorePage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('catalog')
  const [wishlistIds, setWishlistIds] = useState(() => getWishlist())

  const toggleWishlist = useCallback((courseId) => {
    setWishlistIds(prev => {
      const next = prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
      saveWishlist(next)
      return next
    })
  }, [])

  const TABS = [
    { id: 'catalog', label: 'Catálogo' },
    { id: 'wishlist', label: `Lista de deseos${wishlistIds.length ? ` (${wishlistIds.length})` : ''}` },
    { id: 'purchases', label: 'Mis compras' },
  ]

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .st-pad { padding: 1.25rem 1rem 2rem !important; } .st-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 1100px) { .st-grid { grid-template-columns: repeat(2,1fr) !important; } }
        .st-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.1rem; }
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
        {tab === 'catalog' && <CatalogTab wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />}
        {tab === 'wishlist' && <WishlistTab wishlistIds={wishlistIds} onToggleWishlist={toggleWishlist} />}
        {tab === 'purchases' && <PurchasesTab user={user} />}
      </div>
    </DashboardLayout>
  )
}
