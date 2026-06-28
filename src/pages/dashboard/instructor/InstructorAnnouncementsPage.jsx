import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { INSTRUCTOR_NAV } from '../../../config/navigation'

const BELL = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>

export default function InstructorAnnouncementsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('announcements')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data)
        setLoading(false)
      })
  }, [])

  return (
    <DashboardLayout navItems={INSTRUCTOR_NAV}>
      <style>{`@media (max-width: 768px) { .ann-i-pad { padding: 1.25rem 1rem 2rem !important; } }`}</style>
      <div className="ann-i-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Comunicación</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Comunicados</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', height: 100, opacity: 1 - i * 0.2 }} />
            ))}
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
              <div key={item.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.35rem 1.5rem', transition: 'box-shadow .18s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(23,26,28,.07)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '.6rem' }}>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{item.title}</h2>
                  <span style={{ fontSize: '.72rem', color: '#B5B2AB', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '.15rem' }}>
                    {new Date(item.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p style={{ fontSize: '.855rem', color: 'var(--text-2)', lineHeight: 1.65, margin: 0, fontWeight: 300 }}>{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
