import { useState, useEffect } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { supabase } from '../../lib/supabase'

const LEVEL_OPTS = [
  { value: '', label: 'Todos los niveles' },
  { value: 'beginner', label: 'Básico' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
]
const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

function CourseCard({ course }) {
  const { navigate } = useNavigation()
  const cover = course.cover_image_url
  const priceNum = Number(course.price)
  const price = !course.price || priceNum === 0 ? 'Gratis' : `$${priceNum.toFixed(2)}`
  const isGratis = !course.price || priceNum === 0
  const instructor = course.profiles?.full_name || '—'
  const category = course.categories?.name || ''
  const level = LEVEL_LABEL[course.level] || ''

  return (
    <div className="pub-card" onClick={() => navigate('course-detail', { slug: course.slug })}
      style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 170, background: cover ? `url(${cover}) center/cover no-repeat` : 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(8,24,28,.65) 0%,transparent 55%)' }} />
        {level && <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '.64rem', fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,.4)', color: 'white', backdropFilter: 'blur(4px)', letterSpacing: '.04em' }}>{level}</span>}
        <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: isGratis ? 'rgba(22,125,120,.9)' : 'var(--jade)', color: 'white' }}>{price}</span>
        {course.duration_hours && (
          <span style={{ position: 'absolute', bottom: 9, left: 10, fontSize: '.68rem', color: 'rgba(255,255,255,.8)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {course.duration_hours}h
          </span>
        )}
      </div>
      <div style={{ padding: '1rem 1.1rem 1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {category && <div style={{ fontSize: '.66rem', fontWeight: 700, color: 'var(--jade)', marginBottom: '.3rem', letterSpacing: '.06em', textTransform: 'uppercase' }}>{category}</div>}
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.97rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.35, flex: 1, marginBottom: '.6rem' }}>{course.title}</h3>
        <div style={{ fontSize: '.75rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
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
      <div style={{ height: 170, background: 'var(--border)' }} />
      <div style={{ padding: '1rem 1.1rem 1.2rem' }}>
        <div style={{ height: 10, width: '40%', background: 'var(--border)', borderRadius: 4, marginBottom: '.6rem' }} />
        <div style={{ height: 14, width: '90%', background: 'var(--border)', borderRadius: 4, marginBottom: '.35rem' }} />
        <div style={{ height: 14, width: '70%', background: 'var(--border)', borderRadius: 4, marginBottom: '.8rem' }} />
        <div style={{ height: 10, width: '50%', background: 'var(--border)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

export default function CourseCatalogPage() {
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

  const clearFilters = () => { setSearch(''); setCatFilter(''); setLevelFilter('') }
  const hasFilters = search || catFilter || levelFilter

  return (
    <>
      <style>{`
        .pub-card { transition: transform .2s, box-shadow .2s; }
        .pub-card:hover { transform: translateY(-4px); box-shadow: 0 10px 32px rgba(23,26,28,.1); }
        .cat-pill { border: 1px solid var(--border); border-radius: 20px; padding: .35rem .9rem; font-size: .78rem; font-weight: 500; cursor: pointer; transition: all .18s; white-space: nowrap; font-family: var(--sans); }
        .cat-pill.active { background: var(--jade); color: white; border-color: var(--jade); }
        .cat-pill:not(.active) { background: white; color: var(--carbon); }
        .cat-pill:not(.active):hover { background: var(--jade-soft); border-color: var(--jade-light); color: var(--jade); }
        .srch-inp:focus { border-color: var(--jade) !important; outline: none; }
        @media (max-width: 900px) { .cat-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 600px) { .cat-grid { grid-template-columns: 1fr !important; } .cat-pills { flex-wrap: wrap !important; } }
      `}</style>

      {/* Hero bar */}
      <div style={{ background: 'var(--jade-dark)', padding: '4.5rem 5% 3rem', color: 'white' }}>
        <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--jade-light)', marginBottom: '.5rem', opacity: .85 }}>Cubo Academy</p>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1.5rem' }}>Catálogo de cursos</h1>
        {/* Search */}
        <div style={{ maxWidth: 520, position: 'relative' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="srch-inp" type="text" placeholder="Busca por título, instructor o categoría…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '.85rem 1rem .85rem 2.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.1)', color: 'white', fontSize: '.95rem', fontFamily: 'var(--sans)', boxSizing: 'border-box', backdropFilter: 'blur(4px)' }} />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '1rem 5%', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'nowrap', minWidth: 'max-content' }} className="cat-pills">
          {/* Category pills */}
          <button className={`cat-pill ${!catFilter ? 'active' : ''}`} onClick={() => setCatFilter('')}>Todas las categorías</button>
          {categories.map(cat => (
            <button key={cat.id} className={`cat-pill ${catFilter === cat.id ? 'active' : ''}`} onClick={() => setCatFilter(catFilter === cat.id ? '' : cat.id)}>{cat.name}</button>
          ))}

          {/* Divider */}
          {categories.length > 0 && <span style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 .25rem', flexShrink: 0 }} />}

          {/* Level pills */}
          {LEVEL_OPTS.slice(1).map(opt => (
            <button key={opt.value} className={`cat-pill ${levelFilter === opt.value ? 'active' : ''}`}
              onClick={() => setLevelFilter(levelFilter === opt.value ? '' : opt.value)}>{opt.label}</button>
          ))}

          {hasFilters && (
            <button onClick={clearFilters}
              style={{ marginLeft: '.5rem', background: 'none', border: 'none', fontSize: '.78rem', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)', padding: '.35rem .5rem', borderRadius: 6, whiteSpace: 'nowrap' }}>
              × Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ background: 'var(--cream)', minHeight: '60vh', padding: '2.5rem 5% 4rem' }}>
        {/* Result count */}
        {!loading && (
          <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>
            {filtered.length === 0 ? 'Ningún curso encontrado' : `${filtered.length} curso${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`}
            {hasFilters && ' con los filtros actuales'}
          </p>
        )}

        {loading ? (
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ width: 52, height: 52, background: 'white', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-2)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>No encontramos cursos</h3>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginBottom: '1.25rem', fontWeight: 300 }}>Prueba con otros términos o quita algún filtro.</p>
            <button onClick={clearFilters}
              style={{ padding: '.6rem 1.4rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ver todos los cursos
            </button>
          </div>
        ) : (
          <div className="cat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {filtered.map(c => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </div>
    </>
  )
}
