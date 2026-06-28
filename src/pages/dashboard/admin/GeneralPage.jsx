import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { Skeleton } from '../../../components/ui'

const ROLE_BADGE = {
  admin:      { label: 'Admin',       bg: 'rgba(22,125,120,.12)',  color: 'var(--jade)',   border: '1px solid rgba(22,125,120,.25)' },
  instructor: { label: 'Instructor',  bg: 'rgba(59,130,246,.1)',   color: '#3B7EF6',       border: '1px solid rgba(59,130,246,.25)' },
  student:    { label: 'Estudiante',  bg: 'rgba(113,128,126,.1)',  color: 'var(--text-2)', border: '1px solid rgba(113,128,126,.2)' },
}

export default function GeneralPage() {
  const { profile, user } = useAuth()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'admin').split(' ')[0]

  const [{ stats, loading }, setData] = useState({ stats: null, loading: true })

  useEffect(() => {
    supabase.rpc('get_admin_stats').then(({ data }) => {
      setData({ stats: data ?? null, loading: false })
    })
  }, [])

  const METRIC_CARDS = stats ? [
    {
      label: 'Total usuarios', value: stats.total_usuarios,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: 'Cursos publicados', value: stats.cursos_publicados,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    },
    {
      label: 'Matrículas', value: stats.matriculas,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
    },
    {
      label: 'Órdenes', value: stats.ordenes,
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    },
  ] : null

  const QUICK_LINKS = [
    {
      label: 'Gestionar usuarios', desc: 'Ver y administrar todos los usuarios', path: '/dashboard/usuarios',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: 'Gestionar categorías', desc: 'Organiza el contenido por áreas', path: '/dashboard/categorias',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    },
    {
      label: 'Crear curso', desc: 'Agrega nuevo contenido a la plataforma', path: '/dashboard/cursos',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    },
    {
      label: 'Ver órdenes', desc: 'Revisa pagos y transacciones', path: '/dashboard/ordenes',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    },
  ]

  return (
    <DashboardLayout>
      <style>{`
        .gp-skel { animation: gp-pulse 1.4s ease-in-out infinite; }
        @keyframes gp-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
        .ql-row { display: flex; align-items: center; gap: .85rem; padding: .85rem 1rem; border-radius: 8px; text-decoration: none; transition: background .18s; }
        .ql-row:hover { background: var(--jade-soft); }
        .ql-row:hover .ql-arrow { color: var(--jade); }
        .ql-row:not(:last-child) { border-bottom: 1px solid var(--border); border-radius: 0; }
        .ql-row:not(:last-child):hover { border-radius: 8px; }
        @media (max-width: 768px) {
          .gp-pad { padding: 1.25rem 1rem 2rem !important; }
          .gp-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .gp-bottom { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="gp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Panel administrativo</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>
            Hola, {firstName}
          </h1>
        </div>

        {/* Metric cards */}
        <div className="gp-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {METRIC_CARDS ? METRIC_CARDS.map(m => (
            <div key={m.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              <div style={{ width: 38, height: 38, background: 'var(--jade-soft)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{m.value ?? '—'}</div>
                <div style={{ fontSize: '.74rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 400 }}>{m.label}</div>
              </div>
            </div>
          )) : [0,1,2,3].map(i => (
            <div key={i} className="gp-skel" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem' }}>
              <Skel w={38} h={38} r={9} mb={10} />
              <Skel w="50%" h={28} r={6} mb={6} />
              <Skel w="70%" h={14} r={4} />
            </div>
          ))}
        </div>

        {/* Bottom grid */}
        <div className="gp-bottom" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

          {/* Últimos registros */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '1rem' }}>Últimos registros</div>
            {loading ? (
              <div className="gp-skel" style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <Skel w="60%" h={14} r={4} mb={5} />
                      <Skel w="40%" h={11} r={4} />
                    </div>
                    <Skel w={60} h={22} r={20} />
                  </div>
                ))}
              </div>
            ) : !(stats?.usuarios_recientes?.length) ? (
              <p style={{ fontSize: '.83rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Sin usuarios aún.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.1rem' }}>
                {stats.usuarios_recientes.map((u, i) => {
                  const badge = ROLE_BADGE[u.role] || ROLE_BADGE.student
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem 0', borderBottom: i < stats.usuarios_recientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {(u.full_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.86rem', fontWeight: 500, color: 'var(--carbon)', fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.full_name || '—'}
                        </div>
                        <div style={{ fontSize: '.72rem', color: '#B5B2AB', marginTop: '.1rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, whiteSpace: 'nowrap', background: badge.bg, color: badge.color, border: badge.border }}>
                        {badge.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Accesos rápidos */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '1rem' }}>Accesos rápidos</div>
            <div>
              {QUICK_LINKS.map(ql => (
                <Link key={ql.path} to={ql.path} className="ql-row">
                  <div style={{ width: 36, height: 36, background: 'var(--jade-soft)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)', flexShrink: 0 }}>
                    {ql.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>{ql.label}</div>
                    <div style={{ fontSize: '.74rem', color: 'var(--text-2)', marginTop: '.1rem' }}>{ql.desc}</div>
                  </div>
                  <svg className="ql-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'color .18s' }}>
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
