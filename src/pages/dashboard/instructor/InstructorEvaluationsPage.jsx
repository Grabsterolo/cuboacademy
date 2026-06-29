import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

const CHECK_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
const X_ICON    = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function genUniqueCode() {
  const a = Date.now().toString(36).toUpperCase()
  const b = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `CUBO-${a}-${b}`
}

const TABS = [
  { value: 'pending',  label: 'Pendientes' },
  { value: 'reviewed', label: 'Revisadas' },
]

export default function InstructorEvaluationsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState('pending')
  const [processing, setProcessing]   = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectNotes, setRejectNotes] = useState('')

  useEffect(() => {
    if (!user) return
    loadSubmissions()
  }, [user])

  async function loadSubmissions() {
    setLoading(true)
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('instructor_id', user.id)

    const courseIds = (courses || []).map(c => c.id)
    if (courseIds.length === 0) { setSubmissions([]); setLoading(false); return }

    const { data } = await supabase
      .from('exam_submissions')
      .select(`
        id, status, submitted_at, reviewed_at, notes, enrollment_id, student_id, course_id,
        profiles!student_id(full_name, email),
        courses!course_id(id, title, cover_image_url)
      `)
      .in('course_id', courseIds)
      .order('submitted_at', { ascending: false })

    setSubmissions(data || [])
    setLoading(false)
  }

  async function handleApprove(sub) {
    if (processing) return
    setProcessing(sub.id)
    const now = new Date().toISOString()

    const { error: e1 } = await supabase
      .from('exam_submissions')
      .update({ status: 'approved', reviewed_at: now, reviewed_by: user.id })
      .eq('id', sub.id)

    if (e1) { setProcessing(null); return }

    await supabase
      .from('enrollments')
      .update({ completed_at: now })
      .eq('id', sub.enrollment_id)

    await supabase
      .from('certificates')
      .insert({
        student_id:    sub.student_id,
        course_id:     sub.course_id,
        enrollment_id: sub.enrollment_id,
        unique_code:   genUniqueCode(),
        issued_at:     now,
        status:        'pending',
      })

    setSubmissions(prev => prev.map(s =>
      s.id === sub.id ? { ...s, status: 'approved', reviewed_at: now } : s
    ))
    setProcessing(null)
  }

  async function handleReject() {
    const sub = rejectModal
    if (!sub || processing) return
    setProcessing(sub.id)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('exam_submissions')
      .update({ status: 'rejected', reviewed_at: now, reviewed_by: user.id, notes: rejectNotes || null })
      .eq('id', sub.id)

    if (!error) {
      setSubmissions(prev => prev.map(s =>
        s.id === sub.id ? { ...s, status: 'rejected', reviewed_at: now, notes: rejectNotes || null } : s
      ))
    }
    setRejectModal(null)
    setRejectNotes('')
    setProcessing(null)
  }

  const pending  = submissions.filter(s => s.status === 'pending')
  const reviewed = submissions.filter(s => s.status !== 'pending')
  const shown    = tab === 'pending' ? pending : reviewed

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .ev-pad { padding: 1.25rem 1rem 2rem !important; } }
        .ev-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow .18s; }
        .ev-card:hover { box-shadow: 0 4px 16px rgba(23,26,28,.07); }
        .ev-tab { padding: .35rem .85rem; border-radius: 20px; font-size: .79rem; font-weight: 600; cursor: pointer; font-family: var(--sans); transition: all .15s; border: 1.5px solid var(--border); background: transparent; color: var(--text-2); }
        .ev-tab.active { border-color: rgba(22,125,120,.4); background: var(--jade-soft); color: var(--jade); }
        .ev-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 999; display: flex; align-items: center; justify-content: center; }
        .ev-modal { background: white; border-radius: 16px; padding: 2rem; width: 100%; max-width: 440px; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
      `}</style>

      <div className="ev-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Evaluaciones</h1>
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Pendientes', value: pending.length },
              { label: 'Aprobadas',  value: reviewed.filter(s => s.status === 'approved').length },
              { label: 'Rechazadas', value: reviewed.filter(s => s.status === 'rejected').length },
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
            <button key={t.value} onClick={() => setTab(t.value)} className={`ev-tab${tab === t.value ? ' active' : ''}`}>
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              {tab === 'pending' ? 'Sin solicitudes pendientes' : 'Sin evaluaciones revisadas'}
            </p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>
              {tab === 'pending'
                ? 'Cuando los estudiantes completen sus lecciones y envíen su solicitud, aparecerán aquí.'
                : 'Las evaluaciones aprobadas o rechazadas aparecerán aquí.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {shown.map(sub => {
              const student    = sub.profiles
              const course     = sub.courses
              const isPending  = sub.status === 'pending'
              const isProc     = processing === sub.id
              return (
                <div key={sub.id} className="ev-card">
                  <div style={{ width: 52, height: 44, background: 'linear-gradient(140deg,#0d3840,#082830)', borderRadius: 8, flexShrink: 0, overflow: 'hidden' }}>
                    {course?.cover_image_url && <img src={course.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {course?.title || 'Curso'}
                    </div>
                    <div style={{ fontSize: '.77rem', color: 'var(--text-2)', marginBottom: '.1rem' }}>
                      {student?.full_name || student?.email || 'Estudiante'}
                    </div>
                    <div style={{ fontSize: '.71rem', color: 'var(--text-2)' }}>
                      Enviado el {fmtDate(sub.submitted_at)}
                      {sub.reviewed_at && ` · Revisado el ${fmtDate(sub.reviewed_at)}`}
                    </div>
                    {sub.notes && (
                      <div style={{ fontSize: '.72rem', color: '#991B1B', marginTop: '.25rem', background: '#FEF2F2', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                        {sub.notes}
                      </div>
                    )}
                  </div>

                  {isPending ? (
                    <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => { setRejectModal(sub); setRejectNotes('') }}
                        disabled={!!isProc}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .85rem', background: 'white', border: '1.5px solid #FECACA', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, color: '#DC2626', cursor: isProc ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isProc ? .6 : 1 }}>
                        {X_ICON} Rechazar
                      </button>
                      <button
                        onClick={() => handleApprove(sub)}
                        disabled={!!isProc}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', padding: '.45rem .85rem', background: 'var(--jade)', border: 'none', borderRadius: 8, fontSize: '.8rem', fontWeight: 600, color: 'white', cursor: isProc ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: isProc ? .6 : 1 }}>
                        {isProc ? '…' : <>{CHECK_ICON} Aprobar</>}
                      </button>
                    </div>
                  ) : (
                    <span style={{ padding: '4px 10px', borderRadius: 10, fontSize: '.71rem', fontWeight: 700, background: sub.status === 'approved' ? '#DCFCE7' : '#FEE2E2', color: sub.status === 'approved' ? '#16A34A' : '#DC2626', flexShrink: 0 }}>
                      {sub.status === 'approved' ? '✓ Aprobada' : '✕ Rechazada'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="ev-overlay" onClick={() => setRejectModal(null)}>
          <div className="ev-modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>
              Rechazar evaluación
            </h3>
            <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
              Estudiante: <strong>{rejectModal.profiles?.full_name || rejectModal.profiles?.email}</strong>
            </p>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              Motivo (opcional)
            </label>
            <textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              rows={3}
              placeholder="Explica al estudiante qué debe mejorar…"
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
