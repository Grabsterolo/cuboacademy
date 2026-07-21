import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { useNavigation } from '../../../context/NavigationContext'
import { Skeleton } from '../../../components/ui'
import { formatDateShort } from '../../../lib/formatDate'

const Skel = Skeleton

const ROLE_BADGE = {
  admin:      { label: 'Admin',       bg: 'rgba(22,125,120,.12)',  color: 'var(--jade)',   border: '1px solid rgba(22,125,120,.25)' },
  instructor: { label: 'Instructor',  bg: 'rgba(59,130,246,.1)',   color: '#3B7EF6',       border: '1px solid rgba(59,130,246,.25)' },
  student:    { label: 'Estudiante',  bg: 'rgba(113,128,126,.1)',  color: 'var(--text-2)', border: '1px solid rgba(113,128,126,.2)' },
}

export default function GeneralPage() {
  const { profile, user } = useAuth()
  const { navigate } = useNavigation()
  const firstName = (profile?.full_name || user?.email?.split('@')[0] || 'admin').split(' ')[0]

  const [{ stats, loading }, setData] = useState({ stats: null, loading: true })

  useEffect(() => {
    supabase.rpc('get_admin_stats').then(({ data }) => {
      setData({ stats: data ?? null, loading: false })
    })
  }, [])

  const METRIC_CARDS = stats ? [
    {
      label: 'Total usuarios', value: stats.total_usuarios, section: 'usuarios',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: 'Cursos publicados', value: stats.cursos_publicados, section: 'cursos',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
    },
    {
      label: 'Órdenes', value: stats.ordenes, section: 'pagos',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
    },
    {
      label: 'Certificados pendientes', value: stats.certificados_pendientes, section: 'certificados',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/></svg>,
    },
  ] : null

  return (
    <DashboardLayout>
      <style>{`
        .gp-skel { animation: gp-pulse 1.4s ease-in-out infinite; }
        @keyframes gp-pulse { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
        .gp-metric-card:hover { box-shadow: 0 4px 20px rgba(23,26,28,.08); border-color: rgba(22,125,120,.25); }
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
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>
            Hola, {firstName}
          </h1>
        </div>

        {/* Metric cards */}
        <div className="gp-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {METRIC_CARDS ? METRIC_CARDS.map(m => (
            <button key={m.label} onClick={() => navigate(m.section)} className="gp-metric-card"
              style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.65rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)', transition: 'box-shadow .18s, border-color .18s' }}>
              <div style={{ width: 38, height: 38, background: 'var(--jade-soft)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {m.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{m.value ?? '—'}</div>
                <div style={{ fontSize: '.74rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 400 }}>{m.label}</div>
              </div>
            </button>
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
                          {u.created_at ? formatDateShort(u.created_at) : '—'}
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

          {/* Comunicados recientes + curso más vendido */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Comunicados recientes</div>
                <button onClick={() => navigate('comunicados')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.76rem', fontWeight: 600, color: 'var(--jade)', fontFamily: 'var(--sans)' }}>Ver →</button>
              </div>
              {loading ? (
                <div className="gp-skel" style={{ display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                  {[0,1].map(i => <Skel key={i} w="80%" h={16} r={4} />)}
                </div>
              ) : !(stats?.comunicados_recientes?.length) ? (
                <p style={{ fontSize: '.83rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Sin comunicados aún.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {stats.comunicados_recientes.map((a, i) => (
                    <div key={a.id} style={{ padding: '.6rem 0', borderBottom: i < stats.comunicados_recientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: '.86rem', fontWeight: 500, color: 'var(--carbon)', fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</div>
                      <div style={{ fontSize: '.72rem', color: '#B5B2AB', marginTop: '.1rem' }}>{formatDateShort(a.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.4rem 1.5rem' }}>
              <div style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '1rem' }}>Curso más vendido</div>
              {loading ? (
                <Skel w="70%" h={20} r={4} />
              ) : !stats?.curso_mas_vendido ? (
                <p style={{ fontSize: '.83rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Aún no hay órdenes completadas.</p>
              ) : (
                <button onClick={() => navigate('cursos')} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)', padding: 0 }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)' }}>{stats.curso_mas_vendido.title}</div>
                  <div style={{ fontSize: '.78rem', color: 'var(--jade)', fontWeight: 600, marginTop: '.25rem' }}>{stats.curso_mas_vendido.ventas} orden{stats.curso_mas_vendido.ventas !== 1 ? 'es' : ''} completada{stats.curso_mas_vendido.ventas !== 1 ? 's' : ''}</div>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
