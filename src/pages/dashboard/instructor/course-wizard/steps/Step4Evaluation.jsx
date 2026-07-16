import { StepHeader } from '../components/StepHeader'
import { Field, PillSelector, Toggle, SmallBtn, IC, INP, SEL, fi, fb, Q_TYPES, uid } from '../components/shared'

export function Step4Evaluation({ eval: ev, setEval }) {
  const { hasEval, minScore, maxAttempts, questions } = ev
  const set = (k, v) => setEval(e => ({ ...e, [k]: v }))

  function addQuestion() {
    const q = { id: uid(), dbId: null, type: 'single', text: '', score: 1, answers: [], expanded: true }
    set('questions', [...questions, q])
  }

  function removeQuestion(qId) {
    set('questions', questions.filter(q => q.id !== qId))
  }

  function updateQuestion(qId, patch) {
    set('questions', questions.map(q => q.id === qId ? { ...q, ...patch } : q))
  }

  function toggleQ(qId) {
    set('questions', questions.map(q => q.id === qId ? { ...q, expanded: !q.expanded } : q))
  }

  function addAnswer(qId) {
    set('questions', questions.map(q => q.id === qId
      ? { ...q, answers: [...q.answers, { id: uid(), dbId: null, text: '', correct: false }] }
      : q
    ))
  }

  function updateAnswer(qId, aId, patch) {
    set('questions', questions.map(q => q.id === qId
      ? { ...q, answers: q.answers.map(a => a.id === aId ? { ...a, ...patch } : a) }
      : q
    ))
  }

  function removeAnswer(qId, aId) {
    set('questions', questions.map(q => q.id === qId
      ? { ...q, answers: q.answers.filter(a => a.id !== aId) }
      : q
    ))
  }

  function setCorrect(qId, aId, isMultiple) {
    set('questions', questions.map(q => {
      if (q.id !== qId) return q
      const answers = isMultiple
        ? q.answers.map(a => a.id === aId ? { ...a, correct: !a.correct } : a)
        : q.answers.map(a => ({ ...a, correct: a.id === aId }))
      return { ...q, answers }
    }))
  }

  return (
    <div>
      <StepHeader n={4} title="Evaluación" sub="Define cómo aprobará el estudiante tu curso." />

      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <Toggle checked={hasEval} onChange={e => set('hasEval', e.target.checked)} label="Este curso tiene evaluación" />
      </div>

      {hasEval && (
        <>
          {/* Config */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="wiz-grid">
            <div>
              <Field label="Puntaje mínimo para aprobar (%)">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <input type="range" min="0" max="100" value={minScore} onChange={e => set('minScore', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--jade)' }} />
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--jade)', minWidth: 40, textAlign: 'right' }}>{minScore}%</span>
                </div>
              </Field>
            </div>
            <div>
              <Field label="Intentos permitidos">
                <PillSelector
                  options={[{ value: 1, label: '1 intento' }, { value: 2, label: '2 intentos' }, { value: 0, label: 'Ilimitado' }]}
                  value={maxAttempts} onChange={v => set('maxAttempts', v)} />
              </Field>
            </div>
          </div>

          {/* Question builder */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.95rem', color: 'var(--carbon)', margin: 0 }}>Preguntas</p>
                <p style={{ fontSize: '.78rem', color: 'var(--text-2)', margin: '.15rem 0 0' }}>{questions.length} pregunta{questions.length !== 1 ? 's' : ''} agregada{questions.length !== 1 ? 's' : ''}</p>
              </div>
              <button type="button" onClick={addQuestion}
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.5rem 1rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                {IC.plus} Agregar pregunta
              </button>
            </div>

            {questions.length === 0 && (
              <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.875rem' }}>
                Aún no hay preguntas. Haz clic en "Agregar pregunta" para comenzar.
              </div>
            )}

            {questions.map((q, qIdx) => (
              <QuestionCard key={q.id} q={q} idx={qIdx}
                onToggle={() => toggleQ(q.id)}
                onUpdate={patch => updateQuestion(q.id, patch)}
                onRemove={() => removeQuestion(q.id)}
                onAddAnswer={() => addAnswer(q.id)}
                onUpdateAnswer={(aId, p) => updateAnswer(q.id, aId, p)}
                onRemoveAnswer={aId => removeAnswer(q.id, aId)}
                onSetCorrect={(aId) => setCorrect(q.id, aId, q.type === 'multiple')} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function QuestionCard({ q, idx, onToggle, onUpdate, onRemove, onAddAnswer, onUpdateAnswer, onRemoveAnswer, onSetCorrect }) {
  const isMultiple  = q.type === 'multiple'
  const isTrueFalse = q.type === 'true_false'
  const isOpen      = q.type === 'open'
  const showAnswers = !isOpen

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 1.1rem', cursor: 'pointer' }}
        onClick={onToggle}
        onMouseEnter={e => e.currentTarget.style.background = '#FAFAF9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ fontSize: '.71rem', fontWeight: 700, color: 'var(--text-2)', letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0 }}>P{idx + 1}</span>
        <span style={{ flex: 1, fontSize: '.875rem', color: q.text ? 'var(--carbon)' : 'var(--text-2)', fontWeight: q.text ? 500 : 400 }}>
          {q.text || 'Sin texto aún…'}
        </span>
        <span style={{ fontSize: '.73rem', color: 'var(--text-2)', padding: '.2rem .55rem', background: 'var(--cream)', borderRadius: 6, flexShrink: 0 }}>
          {Q_TYPES.find(t => t.value === q.type)?.label}
        </span>
        <SmallBtn danger onClick={e => { e.stopPropagation(); onRemove() }} title="Eliminar">{IC.trash}</SmallBtn>
        <div style={{ transform: q.expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s', color: 'var(--text-2)', flexShrink: 0 }}>{IC.chevD}</div>
      </div>

      {q.expanded && (
        <div style={{ padding: '1rem 1.1rem 1.25rem', background: '#FAFAF9', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '.75rem', marginBottom: '.85rem' }}>
            <Field label="Pregunta" req>
              <textarea style={{ ...INP, resize: 'vertical', minHeight: 70, lineHeight: 1.6 }}
                value={q.text} placeholder="Escribe la pregunta aquí…"
                onChange={e => onUpdate({ text: e.target.value })} onFocus={fi} onBlur={fb} />
            </Field>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <Field label="Tipo">
                <select style={{ ...SEL, width: 'auto' }} value={q.type} onChange={e => onUpdate({ type: e.target.value, answers: [] })} onFocus={fi} onBlur={fb}>
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Puntos">
                <input type="number" min="1" step="1" style={{ ...INP, width: 72 }} value={q.score}
                  onChange={e => onUpdate({ score: Math.max(1, parseInt(e.target.value) || 1) })} onFocus={fi} onBlur={fb} />
              </Field>
            </div>
          </div>

          {showAnswers && (
            <div>
              <label style={{ display: 'block', fontSize: '.69rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9B9894', marginBottom: '.6rem' }}>
                {isTrueFalse ? 'Opciones' : `Opciones de respuesta ${isMultiple ? '(marca todas las correctas)' : '(marca la correcta)'}`}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '.6rem' }}>
                {isTrueFalse
                  ? ['Verdadero', 'Falso'].map((opt, i) => {
                      const isCorrect = q.answers.find(a => a.text === opt)?.correct || false
                      return (
                        <div key={i} onClick={() => onUpdate({ answers: [{ id: uid(), text: 'Verdadero', correct: opt === 'Verdadero' }, { id: uid(), text: 'Falso', correct: opt === 'Falso' }] })}
                          style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem .9rem', borderRadius: 8, border: `2px solid ${isCorrect ? 'var(--jade)' : 'var(--border)'}`, background: isCorrect ? 'var(--jade-soft)' : 'white', cursor: 'pointer', transition: 'all .15s' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isCorrect ? 'var(--jade)' : 'var(--border)'}`, background: isCorrect ? 'var(--jade)' : 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {isCorrect && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                          </div>
                          <span style={{ fontSize: '.875rem', fontWeight: isCorrect ? 600 : 400, color: isCorrect ? 'var(--jade)' : 'var(--carbon)' }}>{opt}</span>
                          {isCorrect && <span style={{ marginLeft: 'auto', fontSize: '.71rem', fontWeight: 700, color: 'var(--jade)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Correcta</span>}
                        </div>
                      )
                    })
                  : q.answers.map(ans => (
                      <div key={ans.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                        <div onClick={() => onSetCorrect(ans.id)}
                          title={isMultiple ? (ans.correct ? 'Quitar como correcta' : 'Marcar como correcta') : 'Marcar como correcta'}
                          style={{ width: 22, height: 22, borderRadius: isMultiple ? 5 : '50%', border: `2px solid ${ans.correct ? 'var(--jade)' : '#C9C5BE'}`, background: ans.correct ? 'var(--jade)' : 'white', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                          {ans.correct && (
                            isMultiple
                              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                              : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                          )}
                        </div>
                        <input style={{ ...INP, flex: 1, padding: '.4rem .7rem', fontSize: '.84rem', borderColor: ans.correct ? 'rgba(22,125,120,.4)' : 'var(--border)', background: ans.correct ? 'var(--jade-soft)' : 'var(--cream)' }}
                          value={ans.text} placeholder="Escribe la opción…"
                          onChange={e => onUpdateAnswer(ans.id, { text: e.target.value })} onFocus={fi} onBlur={fb} />
                        {ans.correct && <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--jade)', whiteSpace: 'nowrap', letterSpacing: '.04em', textTransform: 'uppercase' }}>✓ Correcta</span>}
                        <SmallBtn danger onClick={() => onRemoveAnswer(ans.id)}>{IC.x}</SmallBtn>
                      </div>
                    ))
                }
              </div>
              {!isTrueFalse && (
                <button type="button" onClick={onAddAnswer}
                  style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.79rem', color: 'var(--jade)', fontWeight: 600, fontFamily: 'var(--sans)', padding: 0 }}>
                  {IC.plus} Agregar opción
                </button>
              )}
            </div>
          )}
          {isOpen && (
            <div style={{ padding: '.65rem', background: 'var(--cream)', borderRadius: 7, fontSize: '.8rem', color: 'var(--text-2)', fontStyle: 'italic' }}>
              El estudiante escribirá su respuesta libremente. Tú la revisarás manualmente.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
