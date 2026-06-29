import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const CERT_ICON_BIG = <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
const CERT_ICON     = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>

const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

function fmt(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function StudentCertificatesPage() {
  const { user, profile } = useAuth()
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('enrollments')
      .select('id, completed_at, enrolled_at, courses(id, title, cover_image_url, level, duration_hours, categories(name), profiles!instructor_id(full_name))')
      .eq('student_id', user.id)
      .or('status.eq.completed,completed_at.not.is.null')
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        setCerts((data || []).filter(e => e.completed_at || e.status === 'completed'))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .cert-pad { padding: 1.25rem 1rem 2rem !important; } }
        .cert-card { background: white; border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: box-shadow .18s; }
        .cert-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.09); }
        @media print { .cert-download { display: none !important; } }
      `}</style>

      <div className="cert-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Certificados</h1>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
            {[1,2].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, height: 140, opacity: 1 - i * 0.3 }} />)}
          </div>
        ) : certs.length === 0 ? (
          <>
            {/* Empty state */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '3rem 2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: 64, height: 64, background: 'var(--jade-soft)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--jade)' }}>
                {CERT_ICON_BIG}
              </div>
              <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade)', background: 'var(--jade-soft)', padding: '4px 12px', borderRadius: 20, display: 'inline-block', marginBottom: '1rem' }}>
                Próximamente
              </span>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.3, marginBottom: '.75rem' }}>
                Tus certificados aparecerán aquí
              </h2>
              <p style={{ fontSize: '.875rem', color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 300 }}>
                Cuando completes un curso recibirás un certificado descargable que acredita tu aprendizaje. Sigue avanzando en tus cursos activos.
              </p>
            </div>

            {/* Feature preview */}
            {[
              { icon: CERT_ICON, title: 'Certificado descargable', desc: 'Descarga tu certificado en formato PDF listo para compartir.' },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
                title: 'Credencial verificable', desc: 'Cada certificado tiene un código único que permite verificar su autenticidad en línea.',
              },
              {
                icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
                title: 'Comparte tu logro', desc: 'Agrega el certificado directamente a tu perfil de LinkedIn con un clic.',
              },
            ].map(f => (
              <div key={f.title} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                <div style={{ width: 44, height: 44, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)', flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.2rem' }}>{f.title}</div>
                  <div style={{ fontSize: '.79rem', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 300 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
              {certs.length} certificado{certs.length !== 1 ? 's' : ''} obtenido{certs.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {certs.map(e => {
                const c = e.courses
                if (!c) return null
                const cover       = c.cover_image_url
                const level       = LEVEL_LABEL[c.level] || ''
                const category    = c.categories?.name || ''
                const instructor  = c.profiles?.full_name || ''
                const studentName = profile?.full_name || user?.email || 'Estudiante'

                return (
                  <div key={e.id} className="cert-card">
                    {/* Certificate header band */}
                    <div style={{ background: 'linear-gradient(120deg,#0c3a38,var(--jade))', padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                        {CERT_ICON_BIG}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', marginBottom: '.3rem' }}>
                          Certificado de finalización
                        </div>
                        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1.25, margin: 0 }}>{c.title}</h3>
                      </div>
                      {cover && (
                        <div style={{ width: 72, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    {/* Certificate body */}
                    <div style={{ padding: '1.25rem 1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.25rem' }}>Estudiante</div>
                          <div style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--carbon)' }}>{studentName}</div>
                        </div>
                        {instructor && (
                          <div>
                            <div style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.25rem' }}>Instructor</div>
                            <div style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--carbon)' }}>{instructor}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.25rem' }}>Fecha de finalización</div>
                          <div style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--carbon)' }}>{fmt(e.completed_at)}</div>
                        </div>
                        {(category || level) && (
                          <div>
                            <div style={{ fontSize: '.66rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.25rem' }}>Nivel</div>
                            <div style={{ fontSize: '.875rem', fontWeight: 700, color: 'var(--carbon)' }}>{[level, category].filter(Boolean).join(' · ')}</div>
                          </div>
                        )}
                      </div>

                      <button className="cert-download" disabled title="Descarga de certificados próximamente"
                        style={{ padding: '.55rem 1.1rem', background: 'var(--jade-soft)', color: 'var(--jade)', border: '1px solid rgba(22,125,120,.25)', borderRadius: 8, fontSize: '.8rem', fontWeight: 700, cursor: 'not-allowed', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '.4rem', opacity: .65 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Descargar PDF
                        <span style={{ fontSize: '.65rem', fontWeight: 600, background: 'rgba(22,125,120,.15)', padding: '1px 6px', borderRadius: 8, letterSpacing: '.05em' }}>Próximamente</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
