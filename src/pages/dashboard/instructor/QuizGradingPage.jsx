import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const QUIZ_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const CHECK_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function QuizGradingPage() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [attempts, setAttempts]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState(null)
  const [pointInputs, setPointInputs] = useState({})   // responseId → string value
  const [grading, setGrading]         = useState({})   // responseId → bool
  const [gradedSet, setGradedSet]     = useState(new Set())
  const [gradeErrors, setGradeErrors] = useState({})   // responseId → message
  const [loadError, setLoadError]     = useState('')

  useEffect(() => {
    if (!user) return
    loadAttempts()
  }, [user])

  async function loadAttempts() {
    setLoading(true)
    setLoadError('')

    try {
      // Single joined query instead of walking courses → modules → lessons →
      // quizzes by hand: RLS on quiz_attempts ("Instructores y admin ven
      // intentos de sus cursos") already scopes rows to this instructor's
      // own courses (or all courses for admin), so we just need the nested
      // embeds for display metadata.
      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select(`
          id, status, completed_at, student_id, quiz_id,
          profiles!student_id(full_name, email),
          quizzes(id, title, lessons(id, title, modules(id, courses(id, title))))
        `)
        .eq('status', 'pending_review')
        .order('completed_at', { ascending: false })
        .throwOnError()

      if (!attemptsData?.length) { setAttempts([]); setLoading(false); return }

      const attemptIds = attemptsData.map(a => a.id)
      const { data: responsesData } = await supabase
        .from('quiz_responses')
        .select('id, attempt_id, question_id, open_response, points_earned, questions!question_id(id, text, type, points)')
        .in('attempt_id', attemptIds)
        .throwOnError()

      const openResponses = (responsesData || []).filter(r => r.questions?.type === 'open')

      const result = attemptsData.map(a => {
        const lesson = a.quizzes?.lessons
        const course = lesson?.modules?.courses
        return {
          ...a,
          meta: { quizTitle: a.quizzes?.title || '—', lessonTitle: lesson?.title || '—', courseTitle: course?.title || '—' },
          openResponses: openResponses.filter(r => r.attempt_id === a.id),
        }
      }).filter(a => a.openResponses.length > 0)

      // Initialize graded set and point inputs from DB state
      const graded = new Set()
      const inputs = {}
      for (const a of result) {
        for (const r of a.openResponses) {
          if (r.points_earned != null) graded.add(r.id)
          inputs[r.id] = r.points_earned != null ? String(r.points_earned) : ''
        }
      }
      setGradedSet(graded)
      setPointInputs(inputs)
      setAttempts(result)
    } catch (e) {
      setLoadError(e.message || 'No se pudieron cargar los quizzes pendientes.')
      setAttempts([])
    } finally {
      setLoading(false)
    }
  }

  async function gradeResponse(attemptId, responseId, maxPoints) {
    const pts = Number(pointInputs[responseId])
    if (isNaN(pts) || pts < 0 || pts > maxPoints) {
      setGradeErrors(prev => ({ ...prev, [responseId]: `Ingresa un número entre 0 y ${maxPoints}` }))
      return
    }

    setGrading(prev => ({ ...prev, [responseId]: true }))
    setGradeErrors(prev => { const n = { ...prev }; delete n[responseId]; return n })

    const { error } = await supabase.rpc('grade_quiz_response', {
      p_response_id: responseId,
      p_points:      pts,
    })

    setGrading(prev => ({ ...prev, [responseId]: false }))

    if (error) {
      setGradeErrors(prev => ({ ...prev, [responseId]: error.message || 'Error al calificar' }))
      return
    }

    const newGraded = new Set([...gradedSet, responseId])
    setGradedSet(newGraded)

    // If all open responses for this attempt are now graded, the backend has
    // transitioned it to 'graded' — remove it from the pending list
    const attempt = attempts.find(a => a.id === attemptId)
    const allDone = attempt?.openResponses.every(r => newGraded.has(r.id))
    if (allDone) {
      setAttempts(prev => prev.filter(a => a.id !== attemptId))
      if (expanded === attemptId) setExpanded(null)
    }
  }

  return (
    <DashboardLayout>
      <style>{`
        @media (max-width: 768px) { .qg-pad { padding: 1.25rem 1rem 2rem !important; } }
        .qg-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow .18s; }
        .qg-card:hover { box-shadow: 0 4px 16px rgba(23,26,28,.07); }
      `}</style>

      <div className="qg-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>
            {isAdmin ? 'Admin' : 'Instructor'}
          </p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>
            Calificar quizzes
          </h1>
          <p style={{ fontSize: '.84rem', color: 'var(--text-2)', marginTop: '.4rem', marginBottom: 0 }}>
            Intentos con preguntas abiertas pendientes de calificación
          </p>
        </div>

        {!loading && (
          <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem 1.25rem' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1 }}>{attempts.length}</div>
              <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>Pendientes de revisión</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {[1,2,3].map(i => <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 78, opacity: 1 - i * 0.2 }} />)}
          </div>
        ) : loadError ? (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14, padding: '2rem', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: '#991B1B', marginBottom: '.4rem' }}>
              No se pudo cargar la lista
            </p>
            <p style={{ fontSize: '.82rem', color: '#B91C1C', marginBottom: '1rem' }}>{loadError}</p>
            <button onClick={loadAttempts} style={{ padding: '.5rem 1.1rem', background: 'white', border: '1px solid #FECACA', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, color: '#991B1B', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Reintentar
            </button>
          </div>
        ) : attempts.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', color: 'var(--jade)' }}>
              {QUIZ_ICON}
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              Sin quizzes pendientes
            </p>
            <p style={{ fontSize: '.82rem', color: '#B5B2AB' }}>
              Cuando un estudiante complete un quiz con preguntas abiertas, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
            {attempts.map(attempt => {
              const student  = attempt.profiles
              const isExp    = expanded === attempt.id
              const allDone  = attempt.openResponses.every(r => gradedSet.has(r.id))

              return (
                <div key={attempt.id}>
                  <div className="qg-card">
                    <div style={{ width: 40, height: 40, background: 'var(--jade-soft)', borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)' }}>
                      {QUIZ_ICON}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.67rem', color: 'var(--text-2)', marginBottom: '.08rem' }}>
                        {attempt.meta.courseTitle}
                      </div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '.87rem', fontWeight: 700, color: 'var(--carbon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {attempt.meta.quizTitle}
                      </div>
                      <div style={{ fontSize: '.76rem', color: 'var(--text-2)', marginTop: '.1rem' }}>
                        {student?.full_name || student?.email || 'Estudiante'} · {fmtDate(attempt.completed_at)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                      {allDone && (
                        <span style={{ fontSize: '.71rem', fontWeight: 700, color: '#16A34A', background: '#DCFCE7', borderRadius: 8, padding: '3px 9px' }}>
                          ✓ Calificado
                        </span>
                      )}
                      <button
                        onClick={() => setExpanded(isExp ? null : attempt.id)}
                        style={{ padding: '.42rem .8rem', background: isExp ? 'var(--jade-soft)' : 'white', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '.78rem', fontWeight: 600, color: 'var(--jade)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                        {isExp ? 'Ocultar' : 'Revisar'}
                      </button>
                    </div>
                  </div>

                  {isExp && (
                    <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1.5rem 1.25rem 1.25rem', marginTop: -8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
                        {attempt.openResponses.map((resp, ri) => {
                          const q        = resp.questions
                          const isGraded = gradedSet.has(resp.id)
                          const isGrading = grading[resp.id]
                          const inputVal = pointInputs[resp.id] ?? ''
                          const err      = gradeErrors[resp.id]

                          return (
                            <div key={resp.id} style={{ background: 'white', border: `1px solid ${isGraded ? '#BBF7D0' : 'var(--border)'}`, borderRadius: 10, padding: '1rem 1.1rem' }}>
                              <p style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.5rem' }}>
                                {ri + 1}. {q?.text}
                                <span style={{ fontWeight: 400, color: 'var(--text-2)', marginLeft: '.4rem' }}>({q?.points} pts)</span>
                              </p>

                              <div style={{ padding: '.6rem .85rem', background: 'var(--cream)', borderRadius: 7, fontSize: '.82rem', color: 'var(--carbon)', lineHeight: 1.65, marginBottom: '.8rem' }}>
                                {resp.open_response || <em style={{ color: 'var(--text-2)' }}>Sin respuesta</em>}
                              </div>

                              {isGraded ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.8rem', color: '#16A34A', fontWeight: 600, background: '#F0FDF4', borderRadius: 7, padding: '4px 10px' }}>
                                  {CHECK_ICON}
                                  {inputVal} / {q?.points} pts — calificado
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '.8rem', color: 'var(--carbon)', fontWeight: 500 }}>Puntos:</span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={q?.points}
                                    step={1}
                                    value={inputVal}
                                    onChange={e => setPointInputs(prev => ({ ...prev, [resp.id]: e.target.value }))}
                                    style={{ width: 70, padding: '.38rem .55rem', border: `1px solid ${err ? '#FECACA' : 'var(--border)'}`, borderRadius: 7, fontSize: '.84rem', fontFamily: 'var(--sans)', textAlign: 'center', outline: 'none' }}
                                    onFocus={e => e.target.style.borderColor = 'var(--jade)'}
                                    onBlur={e => e.target.style.borderColor = err ? '#FECACA' : 'var(--border)'}
                                    placeholder="0"
                                  />
                                  <span style={{ fontSize: '.8rem', color: 'var(--text-2)' }}>/ {q?.points}</span>
                                  <button
                                    onClick={() => gradeResponse(attempt.id, resp.id, q?.points)}
                                    disabled={isGrading || inputVal === ''}
                                    style={{ padding: '.4rem .9rem', background: inputVal !== '' ? 'var(--jade)' : 'var(--border)', border: 'none', borderRadius: 7, fontSize: '.8rem', fontWeight: 700, color: inputVal !== '' ? 'white' : 'var(--text-2)', cursor: isGrading || inputVal === '' ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', transition: 'background .15s' }}>
                                    {isGrading ? '…' : 'Calificar'}
                                  </button>
                                  {err && <span style={{ fontSize: '.76rem', color: '#DC2626', width: '100%', marginTop: '.15rem' }}>{err}</span>}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
