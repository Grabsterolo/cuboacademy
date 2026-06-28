import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { STUDENT_NAV } from '../../../config/navigation'

const TYPES = {
  general: {
    label: 'Aviso general', color: '#71807E',
    bg: 'rgba(113,128,126,.1)', border: 'rgba(113,128,126,.25)',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  },
  news: {
    label: 'Novedad', color: 'var(--jade)',
    bg: 'var(--jade-soft)', border: 'rgba(22,125,120,.25)',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  maintenance: {
    label: 'Mantenimiento', color: '#D97706',
    bg: 'rgba(217,119,6,.1)', border: 'rgba(217,119,6,.25)',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  },
  event: {
    label: 'Evento', color: '#3B7EF6',
    bg: 'rgba(59,126,246,.1)', border: 'rgba(59,126,246,.25)',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
}

function typeInfo(val) { return TYPES[val] || TYPES.general }

function TypeBadge({ value }) {
  const t = typeInfo(value)
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: t.bg, color: t.color, border: `1px solid ${t.border}` }}>
      {t.label}
    </span>
  )
}

const TYPE_FILTERS = [
  { value: null,          label: 'Todos' },
  { value: 'general',     label: 'Aviso' },
  { value: 'news',        label: 'Novedad' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'event',       label: 'Evento' },
]

const BELL = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const OVERLAY = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(23,26,28,.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }

export default function StudentAnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [readItem, setReadItem] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState(null)

  useEffect(() => {
    supabase.from('announcements').select('id, title, content, type, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') setReadItem(null) }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [])

  return (
    <DashboardLayout navItems={STUDENT_NAV}>
      <style>{`
        @media (max-width: 768px) { .ann-s-pad { padding: 1.25rem 1rem 2rem !important; } .ann-s-filters { flex-wrap: wrap !important; } }
        .ann-s-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.35rem 1.5rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .ann-s-card:hover { box-shadow: 0 4px 18px rgba(23,26,28,.07); border-color: rgba(22,125,120,.25); }
        .ann-filter-pill { padding: .3rem .75rem; border-radius: 20px; font-size: .78rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; }
      `}</style>

      <div className="ann-s-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
        </div>

        {/* Filtros */}
        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem', marginBottom: '1.4rem' }}>
            <div style={{ position: 'relative', maxWidth: 340 }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar comunicado…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 9, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
                onFocus={e => e.target.style.borderColor = 'var(--jade)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
            <div className="ann-s-filters" style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--text-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginRight: '.2rem' }}>Tipo</span>
              {TYPE_FILTERS.map(opt => {
                const active = filterType === opt.value
                const t = opt.value ? typeInfo(opt.value) : null
                return (
                  <button key={String(opt.value)} onClick={() => setFilterType(opt.value)} className="ann-filter-pill"
                    style={{ border: `1.5px solid ${active ? (t?.border || 'rgba(22,125,120,.3)') : 'var(--border)'}`, background: active ? (t?.bg || 'var(--jade-soft)') : 'white', color: active ? (t?.color || 'var(--jade)') : 'var(--text-2)' }}>
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {(() => {
          const filtered = items.filter(item => {
            const q = search.toLowerCase()
            return (
              (!filterType || item.type === filterType) &&
              (!q || item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q))
            )
          })
          return (
        loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 100, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{BELL}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.3rem' }}>{items.length === 0 ? 'Sin comunicados' : 'Sin resultados'}</p>
            <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)' }}>{items.length === 0 ? 'No hay comunicados disponibles.' : 'Prueba con otros filtros.'}</p>
          </div>
        ) : (
          <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: 720 }}>
            {filtered.map(item => (
              <div key={item.id} className="ann-s-card" onClick={() => setReadItem(item)}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{item.title}</h2>
                    <TypeBadge value={item.type} />
                  </div>
                  <span style={{ fontSize: '.72rem', color: '#B5B2AB', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '.15rem' }}>
                    {new Date(item.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: '.85rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>
                  {item.content.length > 140 ? item.content.slice(0, 140) + '…' : item.content}
                </p>
                {item.content.length > 140 && (
                  <span style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 600, display: 'inline-block', marginTop: '.5rem', fontFamily: 'var(--sans)' }}>Leer más →</span>
                )}
              </div>
            ))}
          </div>
          </>
        )
      )
    })()}
      </div>

      {/* Modal: leer comunicado completo */}
      {readItem && (() => {
        const t = typeInfo(readItem.type)
        return (
          <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) setReadItem(null) }}>
            <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 100px rgba(23,26,28,.28)', overflow: 'hidden' }}>

              {/* Barra de acento */}
              <div style={{ height: 5, background: t.color, flexShrink: 0 }} />

              {/* Cabecera */}
              <div style={{ padding: '1.75rem 2rem 1.5rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{ width: 54, height: 54, borderRadius: 14, background: t.bg, border: `1.5px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color }}>
                    <span style={{ transform: 'scale(1.3)', display: 'flex' }}>{t.icon}</span>
                  </div>
                  <button onClick={() => setReadItem(null)}
                    style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 9, padding: '7px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>

                <div style={{ marginBottom: '.85rem' }}>
                  <TypeBadge value={readItem.type} />
                </div>

                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.55rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.28, margin: '0 0 1.25rem' }}>{readItem.title}</h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem .85rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 9, width: 'fit-content' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span style={{ fontSize: '.78rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', fontWeight: 500 }}>
                    {new Date(readItem.created_at).toLocaleDateString('es-CR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Separador */}
              <div style={{ height: 1, background: 'var(--border)', margin: '0 2rem', flexShrink: 0 }} />

              {/* Contenido */}
              <div style={{ padding: '1.75rem 2rem 2.25rem', overflowY: 'auto' }}>
                <p style={{ fontSize: '.96rem', color: 'var(--carbon)', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 300 }}>{readItem.content}</p>
              </div>
            </div>
          </div>
        )
      })()}
    </DashboardLayout>
  )
}
