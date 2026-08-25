import { memo, useCallback, useRef } from 'react'
import { StepHeader } from '../components/StepHeader'
import { IC, INP, SEL, fi, fb, SmallBtn, LESSON_TYPES, uid } from '../components/shared'

const LESSON_TYPE_ICON = { video: IC.video, text: IC.text, document: IC.doc }

const LessonRow = memo(function LessonRow({ mod, les, lIdx, updateLesson, removeLesson, onLesDragStart, onLesDragEnd, onLesDragOver }) {
  return (
    <div onDragOver={e => onLesDragOver(e, mod.id, lIdx)}
      style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem 1.1rem .6rem 2rem', borderBottom: '1px solid var(--border)', background: '#FAFAF9' }}>
      <span draggable onDragStart={e => onLesDragStart(e, mod.id, lIdx)} onDragEnd={onLesDragEnd}
        style={{ color: 'var(--text-3)', cursor: 'grab', flexShrink: 0 }}>{IC.drag}</span>
      <span style={{ color: 'var(--text-2)', flexShrink: 0 }}>{LESSON_TYPE_ICON[les.type] || IC.video}</span>
      <input
        value={les.title}
        onChange={e => updateLesson(mod.id, les.id, { title: e.target.value })}
        placeholder="Título de la lección…"
        onFocus={fi} onBlur={fb}
        style={{ ...INP, flex: 1, padding: '.35rem .65rem', fontSize: '.84rem' }} />
      <select
        value={les.type}
        onChange={e => updateLesson(mod.id, les.id, { type: e.target.value })}
        style={{ ...SEL, width: 'auto', padding: '.35rem .6rem', fontSize: '.79rem', flexShrink: 0, border: les.type ? SEL.border : '1px solid #DC2626' }}>
        <option value="">Elige un modo</option>
        {LESSON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexShrink: 0 }}>
        <input
          type="number" min="0" value={les.duration_mins}
          onChange={e => updateLesson(mod.id, les.id, { duration_mins: e.target.value })}
          placeholder="min"
          style={{ ...INP, width: 64, padding: '.35rem .5rem', fontSize: '.79rem', textAlign: 'center' }} />
        <span style={{ fontSize: '.72rem', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>min</span>
      </div>
      <SmallBtn onClick={() => removeLesson(mod.id, les.id)} danger title="Eliminar lección">{IC.trash}</SmallBtn>
    </div>
  )
})

const ModuleRow = memo(function ModuleRow({
  mod, mIdx, updateModule, toggleModule, removeModule, addLesson, removeLesson, updateLesson,
  onModDragStart, onModDragEnd, onModDragOver, onLesDragStart, onLesDragEnd, onLesDragOver,
}) {
  return (
    <div onDragOver={e => onModDragOver(e, mIdx)}
      style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s' }}>
      {/* Module header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.85rem 1.1rem', background: 'white' }}>
        <span draggable onDragStart={e => onModDragStart(e, mIdx)} onDragEnd={onModDragEnd}
          style={{ color: 'var(--text-2)', cursor: 'grab', flexShrink: 0 }}>{IC.drag}</span>
        <span style={{ fontSize: '.71rem', fontWeight: 700, color: 'var(--jade)', letterSpacing: '.08em', textTransform: 'uppercase', flexShrink: 0 }}>Módulo {mIdx + 1}</span>
        <input
          value={mod.title}
          onChange={e => updateModule(mod.id, { title: e.target.value })}
          placeholder="Título del módulo…"
          onFocus={fi} onBlur={fb}
          style={{ ...INP, flex: 1, padding: '.4rem .7rem', fontSize: '.875rem', fontWeight: 600 }} />
        <button type="button" onClick={() => toggleModule(mod.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 4, display: 'flex', alignItems: 'center' }}>
          <div style={{ transform: mod.expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s' }}>{IC.chevD}</div>
        </button>
        <SmallBtn onClick={() => removeModule(mod.id)} danger title="Eliminar módulo">{IC.trash}</SmallBtn>
      </div>

      {/* Lessons */}
      {mod.expanded && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {mod.lessons.map((les, lIdx) => (
            <LessonRow key={les.id} mod={mod} les={les} lIdx={lIdx}
              updateLesson={updateLesson} removeLesson={removeLesson}
              onLesDragStart={onLesDragStart} onLesDragEnd={onLesDragEnd} onLesDragOver={onLesDragOver} />
          ))}
          <button type="button" onClick={() => addLesson(mod.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.65rem 1.1rem .65rem 2rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', color: 'var(--jade)', fontWeight: 600, fontFamily: 'var(--sans)', width: '100%' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}>
            {IC.plus} Agregar lección
          </button>
        </div>
      )}
    </div>
  )
})

export function Step2Structure({ modules, setModules, enrolledCount = 0 }) {
  const dragMod  = useRef(null)
  const dragLes  = useRef(null) // {modId, idx}

  const addModule = useCallback(() => {
    setModules(ms => [...ms, { id: uid(), dbId: null, title: '', expanded: true, lessons: [] }])
  }, [setModules])

  const removeModule = useCallback((mId) => {
    const mod = modules.find(m => m.id === mId)
    if (mod?.dbId && enrolledCount > 0) {
      const ok = window.confirm(`Este módulo ya está guardado y hay ${enrolledCount} estudiante${enrolledCount !== 1 ? 's' : ''} inscrito${enrolledCount !== 1 ? 's' : ''} en este curso. Si lo eliminas, se perderá su progreso y evaluaciones asociadas a sus lecciones. ¿Deseas continuar?`)
      if (!ok) return
    }
    setModules(ms => ms.filter(m => m.id !== mId))
  }, [modules, setModules, enrolledCount])

  const updateModule = useCallback((mId, patch) => {
    setModules(ms => ms.map(m => m.id === mId ? { ...m, ...patch } : m))
  }, [setModules])

  const toggleModule = useCallback((mId) => {
    setModules(ms => ms.map(m => m.id === mId ? { ...m, expanded: !m.expanded } : m))
  }, [setModules])

  const addLesson = useCallback((mId) => {
    const lesson = { id: uid(), dbId: null, title: '', type: '', duration_mins: '' }
    setModules(ms => ms.map(m => m.id === mId ? { ...m, lessons: [...m.lessons, lesson] } : m))
  }, [setModules])

  const removeLesson = useCallback((mId, lId) => {
    const les = modules.find(m => m.id === mId)?.lessons.find(l => l.id === lId)
    if (les?.dbId && enrolledCount > 0) {
      const ok = window.confirm(`Esta lección ya está guardada y hay ${enrolledCount} estudiante${enrolledCount !== 1 ? 's' : ''} inscrito${enrolledCount !== 1 ? 's' : ''} en este curso. Si la eliminas, se perderá su progreso registrado en ella. ¿Deseas continuar?`)
      if (!ok) return
    }
    setModules(ms => ms.map(m => m.id === mId ? { ...m, lessons: m.lessons.filter(l => l.id !== lId) } : m))
  }, [modules, setModules, enrolledCount])

  const updateLesson = useCallback((mId, lId, patch) => {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, ...patch } : l) }
      : m
    ))
  }, [setModules])

  // Module drag
  const onModDragStart = useCallback((e, idx) => { dragMod.current = idx; e.currentTarget.style.opacity = '.45' }, [])
  const onModDragEnd   = useCallback((e) => { dragMod.current = null; e.currentTarget.style.opacity = '1' }, [])
  const onModDragOver  = useCallback((e, idx) => {
    e.preventDefault()
    if (dragMod.current !== null && dragMod.current !== idx) {
      setModules(ms => { const a = [...ms]; const [item] = a.splice(dragMod.current, 1); a.splice(idx, 0, item); dragMod.current = idx; return a })
    }
  }, [setModules])

  // Lesson drag within a module
  const onLesDragStart = useCallback((e, mId, idx) => { dragLes.current = { mId, idx }; e.currentTarget.style.opacity = '.45' }, [])
  const onLesDragEnd   = useCallback((e) => { dragLes.current = null; e.currentTarget.style.opacity = '1' }, [])
  const onLesDragOver  = useCallback((e, mId, idx) => {
    e.preventDefault()
    if (!dragLes.current || dragLes.current.mId !== mId || dragLes.current.idx === idx) return
    setModules(ms => ms.map(m => {
      if (m.id !== mId) return m
      const ls = [...m.lessons]; const [item] = ls.splice(dragLes.current.idx, 1); ls.splice(idx, 0, item)
      dragLes.current.idx = idx
      return { ...m, lessons: ls }
    }))
  }, [setModules])

  return (
    <div>
      <StepHeader n={2} title="Estructura del contenido" sub="Crea los módulos y define las lecciones de tu curso. Arrastra para reordenar." />

      {enrolledCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 9, padding: '.75rem 1rem', marginBottom: '1.1rem', fontSize: '.82rem', color: '#9A3412' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
          Este curso tiene {enrolledCount} estudiante{enrolledCount !== 1 ? 's' : ''} inscrito{enrolledCount !== 1 ? 's' : ''}. Eliminar un módulo o lección ya guardado borra el progreso que tengan registrado en él.
        </div>
      )}

      {modules.length === 0 && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem' }}>Agrega tu primer módulo</p>
          <p style={{ fontSize: '.83rem' }}>Los módulos agrupan lecciones relacionadas.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '1rem' }}>
        {modules.map((mod, mIdx) => (
          <ModuleRow key={mod.id} mod={mod} mIdx={mIdx}
            updateModule={updateModule} toggleModule={toggleModule} removeModule={removeModule}
            addLesson={addLesson} removeLesson={removeLesson} updateLesson={updateLesson}
            onModDragStart={onModDragStart} onModDragEnd={onModDragEnd} onModDragOver={onModDragOver}
            onLesDragStart={onLesDragStart} onLesDragEnd={onLesDragEnd} onLesDragOver={onLesDragOver} />
        ))}
      </div>

      <button type="button" onClick={addModule}
        style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1.2rem', background: 'white', border: '1.5px dashed var(--jade)', borderRadius: 9, fontSize: '.875rem', fontWeight: 600, color: 'var(--jade)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background .15s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-soft)'}
        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
        {IC.plus} Agregar módulo
      </button>
    </div>
  )
}
