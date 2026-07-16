import { useRef } from 'react'
import { StepHeader } from '../components/StepHeader'
import { IC, INP, SEL, fi, fb, SmallBtn, LESSON_TYPES, uid } from '../components/shared'

export function Step2Structure({ modules, setModules }) {
  const dragMod  = useRef(null)
  const dragLes  = useRef(null) // {modId, idx}

  function addModule() {
    setModules(ms => [...ms, { id: uid(), dbId: null, title: '', expanded: true, lessons: [] }])
  }

  function removeModule(mId) {
    setModules(ms => ms.filter(m => m.id !== mId))
  }

  function updateModule(mId, patch) {
    setModules(ms => ms.map(m => m.id === mId ? { ...m, ...patch } : m))
  }

  function toggleModule(mId) {
    setModules(ms => ms.map(m => m.id === mId ? { ...m, expanded: !m.expanded } : m))
  }

  function addLesson(mId) {
    const lesson = { id: uid(), dbId: null, title: '', type: 'video', duration_mins: '' }
    setModules(ms => ms.map(m => m.id === mId ? { ...m, lessons: [...m.lessons, lesson] } : m))
  }

  function removeLesson(mId, lId) {
    setModules(ms => ms.map(m => m.id === mId ? { ...m, lessons: m.lessons.filter(l => l.id !== lId) } : m))
  }

  function updateLesson(mId, lId, patch) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, ...patch } : l) }
      : m
    ))
  }

  // Module drag
  function onModDragStart(e, idx) { dragMod.current = idx; e.currentTarget.style.opacity = '.45' }
  function onModDragEnd(e)        { dragMod.current = null; e.currentTarget.style.opacity = '1' }
  function onModDragOver(e, idx)  { e.preventDefault(); if (dragMod.current !== null && dragMod.current !== idx) {
    setModules(ms => { const a = [...ms]; const [item] = a.splice(dragMod.current, 1); a.splice(idx, 0, item); dragMod.current = idx; return a }) } }

  // Lesson drag within a module
  function onLesDragStart(e, mId, idx) { dragLes.current = { mId, idx }; e.currentTarget.style.opacity = '.45' }
  function onLesDragEnd(e)             { dragLes.current = null; e.currentTarget.style.opacity = '1' }
  function onLesDragOver(e, mId, idx)  {
    e.preventDefault()
    if (!dragLes.current || dragLes.current.mId !== mId || dragLes.current.idx === idx) return
    setModules(ms => ms.map(m => {
      if (m.id !== mId) return m
      const ls = [...m.lessons]; const [item] = ls.splice(dragLes.current.idx, 1); ls.splice(idx, 0, item)
      dragLes.current.idx = idx
      return { ...m, lessons: ls }
    }))
  }

  const lesTypeIcon = { video: IC.video, text: IC.text, document: IC.doc }

  return (
    <div>
      <StepHeader n={2} title="Estructura del contenido" sub="Crea los módulos y define las lecciones de tu curso. Arrastra para reordenar." />

      {modules.length === 0 && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-2)', marginBottom: '1.25rem' }}>
          <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem' }}>Agrega tu primer módulo</p>
          <p style={{ fontSize: '.83rem' }}>Los módulos agrupan lecciones relacionadas.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '1rem' }}>
        {modules.map((mod, mIdx) => (
          <div key={mod.id} onDragOver={e => onModDragOver(e, mIdx)}
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
                  <div key={les.id} onDragOver={e => onLesDragOver(e, mod.id, lIdx)}
                    style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem 1.1rem .6rem 2rem', borderBottom: '1px solid var(--border)', background: '#FAFAF9' }}>
                    <span draggable onDragStart={e => onLesDragStart(e, mod.id, lIdx)} onDragEnd={onLesDragEnd}
                      style={{ color: '#C9C5BE', cursor: 'grab', flexShrink: 0 }}>{IC.drag}</span>
                    <span style={{ color: 'var(--text-2)', flexShrink: 0 }}>{lesTypeIcon[les.type] || IC.video}</span>
                    <input
                      value={les.title}
                      onChange={e => updateLesson(mod.id, les.id, { title: e.target.value })}
                      placeholder="Título de la lección…"
                      onFocus={fi} onBlur={fb}
                      style={{ ...INP, flex: 1, padding: '.35rem .65rem', fontSize: '.84rem' }} />
                    <select
                      value={les.type}
                      onChange={e => updateLesson(mod.id, les.id, { type: e.target.value })}
                      style={{ ...SEL, width: 'auto', padding: '.35rem .6rem', fontSize: '.79rem', flexShrink: 0 }}>
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
