import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const STATUS_STYLE = {
  completed: { label: 'Pagado',    bg: 'var(--jade-soft)', color: 'var(--jade)',   border: '1px solid rgba(22,125,120,.25)' },
  pending:   { label: 'Pendiente', bg: '#FFF9E6',           color: '#B45309',       border: '1px solid #FBBF24' },
  failed:    { label: 'Fallido',   bg: '#FEF2F2',           color: '#B91C1C',       border: '1px solid #FECACA' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: s.border, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  )
}

const ORDER_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [acting, setActing] = useState(null) // order id being processed
  const [confirmAction, setConfirmAction] = useState(null) // { orderId, action }

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, payment_provider, student_id, course_id, profiles!student_id(full_name, avatar_url), courses(id, title, cover_image_url)')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function handleConfirm(order) {
    setConfirmAction(null)
    setActing(order.id)

    // 1. Mark order as completed
    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id)

    if (orderErr) { setActing(null); return }

    // 2. Create enrollment if not exists (belt-and-suspenders alongside DB trigger)
    await supabase.from('enrollments').upsert(
      { student_id: order.student_id, course_id: order.course_id, status: 'active', progress_pct: 0, enrolled_at: new Date().toISOString() },
      { onConflict: 'student_id,course_id', ignoreDuplicates: true }
    )

    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'completed' } : o))
    setActing(null)
  }

  async function handleReject(order) {
    setConfirmAction(null)
    setActing(order.id)
    await supabase.from('orders').update({ status: 'failed' }).eq('id', order.id)
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'failed' } : o))
    setActing(null)
  }

  const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'completed', label: 'Pagados' },
    { value: 'failed', label: 'Fallidos' },
  ]

  const q = search.toLowerCase()
  const filtered = orders.filter(o => {
    const matchStatus = !statusFilter || o.status === statusFilter
    const matchSearch = !q ||
      (o.profiles?.full_name || '').toLowerCase().includes(q) ||
      (o.courses?.title || '').toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .op-pad { padding: 1.25rem 1rem 2rem !important; } .op-filters { flex-wrap: wrap !important; } }
        .op-row { background: white; border: 1px solid var(--border); border-radius: 10px; padding: .9rem 1.1rem; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; transition: box-shadow .15s; }
        .op-row:hover { box-shadow: 0 3px 16px rgba(23,26,28,.07); }
        .op-pill { padding: .28rem .75rem; border-radius: 20px; font-size: .77rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; }
      `}</style>

      <div className="op-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Órdenes</h1>
            {pendingCount > 0 && (
              <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FFF9E6', color: '#B45309', border: '1px solid #FBBF24' }}>
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div className="op-filters" style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Buscar por estudiante, curso o ID…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '.55rem .85rem .55rem 2.1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', boxSizing: 'border-box', transition: 'border-color .18s' }}
                onFocus={e => e.target.style.borderColor = 'var(--jade)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {STATUS_FILTERS.map(f => {
              const active = statusFilter === f.value
              const s = f.value ? STATUS_STYLE[f.value] : null
              return (
                <button key={f.value} className="op-pill"
                  onClick={() => setStatusFilter(f.value)}
                  style={{ border: `1.5px solid ${active ? (s?.border?.replace('1px solid ', '') || 'rgba(22,125,120,.3)') : 'var(--border)'}`, background: active ? (s?.bg || 'var(--jade-soft)') : 'white', color: active ? (s?.color || 'var(--jade)') : 'var(--text-2)' }}>
                  {f.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3,4].map(i => <div key={i} style={{ height: 72, background: 'white', border: '1px solid var(--border)', borderRadius: 10, opacity: 1 - i * 0.18 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>{ORDER_ICON}</div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>
              {orders.length === 0 ? 'Sin órdenes aún' : 'Sin resultados'}
            </p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>
              {orders.length === 0 ? 'Las órdenes aparecerán aquí cuando los estudiantes compren cursos.' : 'Prueba con otros filtros.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
            {filtered.map(order => {
              const student = order.profiles
              const course = order.courses
              const isActing = acting === order.id
              const initials = (student?.full_name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
              const date = new Date(order.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
              const isConfirming = confirmAction?.orderId === order.id
              return (
                <div key={order.id} className="op-row">
                  {/* Student avatar */}
                  {student?.avatar_url
                    ? <img src={student.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
                  }

                  {/* Student + course info */}
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: '.87rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)', marginBottom: '.15rem' }}>
                      {student?.full_name || 'Estudiante desconocido'}
                    </div>
                    <div style={{ fontSize: '.76rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {course?.title || `Curso ${order.course_id?.slice(0,8)}`}
                    </div>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: '.74rem', color: 'var(--text-2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</div>

                  {/* Amount */}
                  {order.amount != null && (
                    <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', color: 'var(--carbon)', flexShrink: 0 }}>
                      ${Number(order.amount).toFixed(2)}
                    </div>
                  )}

                  {/* Status badge */}
                  <StatusBadge status={order.status} />

                  {/* Actions */}
                  {order.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                      {isConfirming ? (
                        <>
                          <span style={{ fontSize: '.75rem', color: 'var(--text-2)', alignSelf: 'center', fontFamily: 'var(--sans)' }}>¿Confirmar?</span>
                          <button onClick={() => handleConfirm(order)} disabled={isActing}
                            style={{ padding: '.35rem .85rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 7, fontSize: '.77rem', fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isActing ? .7 : 1 }}>
                            {isActing ? '…' : 'Sí'}
                          </button>
                          <button onClick={() => setConfirmAction(null)} disabled={isActing}
                            style={{ padding: '.35rem .65rem', background: 'none', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.77rem', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setConfirmAction({ orderId: order.id, action: 'confirm' })} disabled={isActing}
                            style={{ padding: '.38rem .85rem', background: 'var(--jade-soft)', color: 'var(--jade)', border: '1px solid rgba(22,125,120,.25)', borderRadius: 7, fontSize: '.77rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background .15s', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,125,120,.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--jade-soft)'}>
                            ✓ Confirmar pago
                          </button>
                          <button onClick={() => handleReject(order)} disabled={isActing}
                            style={{ padding: '.38rem .7rem', background: 'none', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.77rem', color: '#B91C1C', cursor: isActing ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', transition: 'border-color .15s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#FECACA'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div style={{ marginTop: '.5rem', fontSize: '.74rem', color: 'var(--text-2)' }}>
              {filtered.length} de {orders.length} orden{orders.length !== 1 ? 'es' : ''}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
