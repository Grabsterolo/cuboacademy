import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const CERT_ICON = <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TABS = [
  { value: 'pending',  label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisados' },
]

export default function CertificatesPage() {
  const { user } = useAuth()
  const [certs, setCerts]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('pending')
  const [processing, setProcessing] = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')

  useEffect(() => {
    if (!user) return
    loadCerts()
  }, [user])

  async function loadCerts() {
    setLoading(true)
    const { data } = await supabase
      .from('certificates')
      .select(`
        id, status, issued_at, unique_code, admin_notes, approved_at, student_id, course_id,
        profiles!student_id(full_name, email),
        courses!course_id(title, cover_image_url, profiles!instructor_id(full_name))
      `)
      .order('issued_at', { ascending: false })

    setCerts(data || [])
    setLoading(false)
  }

  async function handleApprove(cert) {
    if (processing) return
    setProcessing(cert.id)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('certificates')
      .update({ status: 'approved', approved_at: now, approved_by: user.id })
      .eq('id', cert.id)
    if (!error) {
      setCerts(prev => prev.map(c => c.id === cert.id ? { ...c, status: 'approved', approved_at: now } : c))
    }
    setProcessing(null)
  }

  async function handleReject() {
    const cert = rejectModal
    if (!cert || processing) return
    setProcessing(cert.id)
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('certificates')
      .update({ status: 'rejected', admin_notes: rejectNotes || null, approved_at: now })
      .eq('id', cert.id)
    if (!error) {
      setCerts(prev => prev.map(c => c.id === cert.id ? { ...c, status: 'rejected', admin_notes: rejectNotes || null } : c))
    }
    setRejectModal(null)
    setRejectNotes('')
    setProcessing(null)
  }

  const pending  = certs.filter(c => c.status === 'pending')
  const reviewed = certs.filter(c => c.status !== 'pending')
  const shown    = tab === 'pending' ? pending : reviewed

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .cp-pad { padding: 1.25rem 1rem 2rem !important; } }
        .cp-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow .18s; }
        .cp-card:hover { box-shadow: 0 4px 16px rgba(23,26,28,.07); }
        .cp-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .cp-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade); }
        .cp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 999; display: flex; align-items: center; justify-content: center; }
        .cp-modal { background: white; border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
      `}</style>

      <div className="cp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Certificados</h1>
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Pendientes', value: pending.length },
              { label: 'Aprobados',  value: reviewed.filter(c => c.status === 'approved').length },
              { label: 'Rechazados', value: reviewed.filter(c => c.status === 'rejected').length },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem 1.25rem' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.value} onClick={() => setTab(t.value)} className={`cp-tab${tab === t.value ? ' active' : ''}`}>
              {t.label} {!loading && `(${t.value === 'pending' ? pending.length : reviewed.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 90, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : shown.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', color: 'var(--jade)' }}>
              {CERT_ICON}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {tab === 'pending' ? 'Sin certificados pendientes' : 'Sin certificados revisados'}
            </p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>
              {tab === 'pending'
                ? 'Los certificados creados por instructores aparecerán aquí para su aprobación.'
                : 'Los certificados aprobados o rechazados aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {shown.map(cert => {
              const student    = cert.profiles
              const course     = cert.courses
              const instructor = course?.profiles?.full_name
              const isPending  = cert.status === 'pending'
              const isProc     = processing === cert.id
              return (
                <div key={cert.id} className="cp-card">
                  <div style={{ width: 52, height: 44, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                    {course?.cover_image_url && <img src={course.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {course?.title || 'Curso'}
                    </div>
                    <div style={{ fontSize: '.77rem', color: 'var(--text-2)', marginBottom: '.1rem' }}>
                      Estudiante: <strong style={{ color: 'var(--carbon)' }}>{student?.full_name || student?.email}</strong>
                      {instructor && <> · Instructor: <strong style={{ color: 'var(--carbon)' }}>{instructor}</strong></>}
                    </div>
                    <div style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>
                      Emitido el {fmtDate(cert.issued_at)}
                      {cert.approved_at && ` · Revisado el ${fmtDate(cert.approved_at)}`}
                    </div>
                    {cert.admin_notes && (
                      <div style={{ fontSize: '.72rem', color: '#991B1B', marginTop: '.25rem', background: '#FEF2F2', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                        {cert.admin_notes}
                      </div>
                    )}
                    <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginTop: '.2rem', fontFamily: 'monospace' }}>
                      {cert.unique_code}
                    </div>
                  </div>

                  {isPending ? (
                    <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => { setRejectModal(cert); setRejectNotes('') }}
                        disabled={!!isProc}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .85rem', background: 'white', border: '1.5px solid #FECACA', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, color: '#DC2626', cursor: isProc ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isProc ? .6 : 1 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(cert)}
                        disabled={!!isProc}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .85rem', background: 'var(--jade)', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, color: 'white', cursor: isProc ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isProc ? .6 : 1 }}>
                        {isProc ? '…' : (
                          <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Aprobar</>
                        )}
                      </button>
                    </div>
                  ) : (
                    <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: '.71rem', fontWeight: 700, background: cert.status === 'approved' ? '#DCFCE7' : '#FEE2E2', color: cert.status === 'approved' ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                      {cert.status === 'approved' ? '✓ Aprobado' : '✕ Rechazado'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="cp-overlay" onClick={() => setRejectModal(null)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>
              Rechazar certificado
            </h3>
            <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
              Curso: <strong>{rejectModal.courses?.title}</strong><br />
              Estudiante: <strong>{rejectModal.profiles?.full_name || rejectModal.profiles?.email}</strong>
            </p>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              Motivo (opcional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Explica el motivo del rechazo…"
              style={{ width: '100%', padding: '.65rem .85rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--jade)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'} />
            <div style={{ display: 'flex', gap: '.65rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{ padding: '.55rem 1.1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={!!processing}
                style={{ padding: '.55rem 1.25rem', background: '#DC2626', border: 'none', borderRadius: 8, fontSize: '.84rem', fontWeight: 700, color: 'white', cursor: processing ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: processing ? .7 : 1 }}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
