import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const QUIZ_ICON = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

export default function LessonQuiz({ lessonId, studentId }) {
  const [quiz, setQuiz] = useState(null)
  const [questions, setQuestions] = useState([])
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState({}) // question_id -> answer_id | [answer_ids] | text
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!lessonId) return
    load()
  }, [lessonId])

  async function load() {
    setLoading(true)
    setResult(null)
    setAnswers({})
    setError('')

    const { data: quizData } = await supabase
      .from('quizzes')
      .select('id, title, passing_score, max_attempts')
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (!quizData) {
      setQuiz(null)
      setQuestions([])
      setAttempts([])
      setLoading(false)
      return
    }
    setQuiz(quizData)

    const [{ data: qData }, { data: attemptsData }] = await Promise.all([
      supabase
        .from('questions')
        .select('id, text, type, order_index, points, answers(id, text, order_index)')
        .eq('quiz_id', quizData.id)
        .order('order_index', { ascending: true }),
      supabase
        .from('quiz_attempts')
        .select('id, score, passed, completed_at')
        .eq('quiz_id', quizData.id)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false }),
    ])

    setQuestions((qData || []).map(q => ({ ...q, answers: (q.answers || []).sort((a, b) => a.order_index - b.order_index) })))
    setAttempts(attemptsData || [])
    setLoading(false)
  }

  function setSingle(questionId, answerId) {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }))
  }

  function toggleMultiple(questionId, answerId) {
    setAnswers(prev => {
      const cur = new Set(prev[questionId] || [])
      if (cur.has(answerId)) cur.delete(answerId); else cur.add(answerId)
      return { ...prev, [questionId]: Array.from(cur) }
    })
  }

  function setOpen(questionId, text) {
    setAnswers(prev => ({ ...prev, [questionId]: text }))
  }

  async function handleSubmit() {
    if (submitting) return
    setError('')
    setSubmitting(true)

    const responses = questions.flatMap(q => {
      if (q.type === 'multiple') {
        const ids = answers[q.id] || []
        return ids.map(answer_id => ({ question_id: q.id, answer_id }))
      }
      if (q.type === 'open') {
        return [{ question_id: q.id, open_response: answers[q.id] || '' }]
      }
      // single / true_false
      return answers[q.id] ? [{ question_id: q.id, answer_id: answers[q.id] }] : []
    })

    const { data, error: rpcError } = await supabase.rpc('submit_quiz_attempt', {
      p_quiz_id: quiz.id,
      p_responses: responses,
    })

    setSubmitting(false)

    if (rpcError) {
      setError(rpcError.message || 'No se pudo enviar el quiz')
      return
    }

    const row = Array.isArray(data) ? data[0] : data
    setResult(row)
    await load()
  }

  if (loading) return null
  if (!quiz) return null

  const attemptsUsed = attempts.length
  const attemptsLeft = quiz.max_attempts - attemptsUsed
  const bestAttempt = attempts.find(a => a.passed) || attempts[0]
  const allAnswered = questions.every(q => {
    if (q.type === 'multiple') return (answers[q.id] || []).length > 0
    if (q.type === 'open') return (answers[q.id] || '').trim().length > 0
    return !!answers[q.id]
  })

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem 1.5rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
        <span style={{ color: 'var(--jade)' }}>{QUIZ_ICON}</span>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{quiz.title}</h3>
        <span style={{ fontSize: '.7rem', color: 'var(--text-2)', marginLeft: 'auto' }}>
          {attemptsUsed}/{quiz.max_attempts} intentos · aprueba con {quiz.passing_score}%
        </span>
      </div>

      {bestAttempt && (
        <div style={{ marginBottom: '1rem', padding: '.75rem 1rem', borderRadius: 9, background: bestAttempt.passed ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${bestAttempt.passed ? '#BBF7D0' : '#FED7AA'}`, display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.85rem', fontWeight: 700, color: bestAttempt.passed ? '#16A34A' : '#C2410C' }}>
            {bestAttempt.passed ? '✓ Aprobado' : 'No aprobado'}
          </span>
          <span style={{ fontSize: '.8rem', color: 'var(--text-2)' }}>· última puntuación: {bestAttempt.score}%</span>
        </div>
      )}

      {result && (
        <div style={{ marginBottom: '1rem', padding: '.85rem 1rem', borderRadius: 9, background: result.passed ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${result.passed ? '#BBF7D0' : '#FECACA'}` }}>
          <p style={{ margin: 0, fontSize: '.85rem', fontWeight: 700, color: result.passed ? '#16A34A' : '#DC2626' }}>
            {result.passed ? `¡Aprobaste con ${result.score}%!` : `Obtuviste ${result.score}%, no alcanzaste el mínimo.`}
          </p>
        </div>
      )}

      {error && <p style={{ fontSize: '.82rem', color: '#DC2626', marginBottom: '1rem' }}>{error}</p>}

      {attemptsLeft <= 0 ? (
        <p style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>Has alcanzado el número máximo de intentos para este quiz.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {questions.map((q, qi) => (
              <div key={q.id}>
                <p style={{ fontSize: '.86rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.55rem' }}>{qi + 1}. {q.text}</p>

                {(q.type === 'single' || q.type === 'true_false') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {q.answers.map(opt => (
                      <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.5rem .7rem', borderRadius: 7, border: `1px solid ${answers[q.id] === opt.id ? 'var(--jade)' : 'var(--border)'}`, background: answers[q.id] === opt.id ? 'var(--jade-soft)' : 'white', cursor: 'pointer', fontSize: '.83rem' }}>
                        <input type="radio" name={q.id} checked={answers[q.id] === opt.id} onChange={() => setSingle(q.id, opt.id)} />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                )}

                {q.type === 'multiple' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {q.answers.map(opt => {
                      const checked = (answers[q.id] || []).includes(opt.id)
                      return (
                        <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.5rem .7rem', borderRadius: 7, border: `1px solid ${checked ? 'var(--jade)' : 'var(--border)'}`, background: checked ? 'var(--jade-soft)' : 'white', cursor: 'pointer', fontSize: '.83rem' }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleMultiple(q.id, opt.id)} />
                          {opt.text}
                        </label>
                      )
                    })}
                  </div>
                )}

                {q.type === 'open' && (
                  <textarea value={answers[q.id] || ''} onChange={e => setOpen(q.id, e.target.value)} rows={3}
                    placeholder="Escribe tu respuesta…"
                    style={{ width: '100%', padding: '.6rem .75rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', fontFamily: 'var(--sans)', resize: 'vertical', boxSizing: 'border-box' }} />
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSubmit} disabled={!allAnswered || submitting}
            style={{ marginTop: '1.25rem', padding: '.65rem 1.25rem', background: allAnswered ? 'var(--jade)' : 'var(--border)', color: allAnswered ? 'white' : 'var(--text-2)', border: 'none', borderRadius: 9, fontSize: '.85rem', fontWeight: 700, cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed', fontFamily: 'var(--sans)' }}>
            {submitting ? 'Enviando…' : 'Enviar respuestas'}
          </button>
        </>
      )}
    </div>
  )
}
