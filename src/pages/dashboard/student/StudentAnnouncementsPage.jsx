import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { STUDENT_NAV } from '../../../config/navigation'

const BELL = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

const TYPE_LABEL = { general: 'Aviso general', news: 'Novedad', maintenance: 'Mantenimiento', event: 'Evento' }
const TYPE_STYLE = {
  general:     { color: '#71807E', bg: 'rgba(113,128,126,.1)',  border: 'rgba(113,128,126,.25)' },
  news:        { color: 'var(--jade)', bg: 'var(--jade-soft)', border: 'rgba(22,125,120,.25)' },
  maintenance: { color: '#D97706', bg: 'rgba(217,119,6,.1)',    border: 'rgba(217,119,6,.25)' },
  event:       { color: '#3B7EF6', bg: 'rgba(59,126,246,.1)',   border: 'rgba(59,126,246,.25)' },
}

function TypeBadge({ value }) {
  const s = TYPE_STYLE[value] || TYPE_STYLE.general
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {TYPE_LABEL[value] || 'Aviso'}
    </span>
  )
}

const OVERLAY = { position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(23,26,28,.55)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }

export default function StudentAnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [readItem, setReadItem] = useState(null)

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, content, type, created_at')
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
        @media (max-width: 768px) { .ann-s-pad { padding: 1.25rem 1rem 2rem !important; } }
        .ann-s-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.35rem 1.5rem; transition: box-shadow .18s, border-color .18s; cursor: pointer; }
        .ann-s-card:hover { box-shadow: 0 4px 18px rgba(23,26,28,.07); border-color: rgba(22,125,120,.25); }
      `}</style>
      <div className="ann-s-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(3)].map((_, i) => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 100, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center', maxWidth: 400 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{BELL}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.3rem' }}>Sin comunicados</p>
            <p style={{ fontSize: '.8rem', color: '#B5B2AB', fontFamily: 'var(--sans)' }}>No hay comunicados disponibles por el momento.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', maxWidth: 720 }}>
            {items.map(item => (
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
        )}
      </div>

      {/* Modal: leer comunicado completo */}
      {readItem && (
        <div style={OVERLAY} onClick={e => { if (e.target === e.currentTarget) setReadItem(null) }}>
          <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 580, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 32px 80px rgba(23,26,28,.22)' }}>
            <div style={{ padding: '1.6rem 2rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', position: 'sticky', top: 0, background: 'white', zIndex: 1, borderRadius: '18px 18px 0 0' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ marginBottom: '.5rem' }}><TypeBadge value={readItem.type} /></div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--carbon)', margin: 0, lineHeight: 1.3 }}>{readItem.title}</h2>
                <p style={{ fontSize: '.73rem', color: '#B5B2AB', margin: '.4rem 0 0', fontFamily: 'var(--sans)' }}>
                  {new Date(readItem.created_at).toLocaleDateString('es-CR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button onClick={() => setReadItem(null)}
                style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px', cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ padding: '1.75rem 2rem 2rem' }}>
              <p style={{ fontSize: '.93rem', color: 'var(--carbon)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 300 }}>{readItem.content}</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
