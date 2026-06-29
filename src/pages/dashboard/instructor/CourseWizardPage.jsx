import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

// ─── helpers ─────────────────────────────────────────────────────────────────

function uid() { return `_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

function slug(t) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

// ─── tokens ──────────────────────────────────────────────────────────────────

const INP = { width: '100%', padding: '.7rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)', fontSize: '15px', outline: 'none', fontFamily: 'var(--sans)', transition: 'border-color .2s, background .2s', boxSizing: 'border-box' }
const SEL = { ...INP, cursor: 'pointer' }

function fi(e) { e.target.style.borderColor = 'var(--jade)'; e.target.style.background = 'white' }
function fb(e) { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)' }

// ─── micro ui ─────────────────────────────────────────────────────────────────

function Field({ label, req, hint, children }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '.69rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9B9894', marginBottom: '.35rem' }}>
          {label}{req && <span style={{ color: 'var(--jade)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize: '.71rem', color: 'var(--text-2)', margin: '.3rem 0 0' }}>{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '.7rem', cursor: 'pointer', userSelect: 'none' }}>
      <div style={{ position: 'relative', width: 40, height: 22, flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: checked ? 'var(--jade)' : 'var(--border)', transition: 'background .2s' }} />
        <div style={{ position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .18s', boxShadow: '0 1px 3px rgba(0,0,0,.18)' }} />
      </div>
      {label && <span style={{ fontSize: '.875rem', color: 'var(--carbon)', fontWeight: 500 }}>{label}</span>}
    </label>
  )
}

function PillSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          style={{ padding: '.4rem .95rem', borderRadius: 20, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s', border: value === o.value ? '1.5px solid var(--jade)' : '1.5px solid var(--border)', background: value === o.value ? 'var(--jade-soft)' : 'white', color: value === o.value ? 'var(--jade)' : 'var(--text-2)' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SmallBtn({ onClick, danger, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: danger ? '#DC2626' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, minHeight: 28, transition: 'background .15s, color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,.1)' : 'var(--jade-soft)'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--jade)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--text-2)' }}>
      {children}
    </button>
  )
}

// ─── icons ────────────────────────────────────────────────────────────────────

const IC = {
  plus:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  check:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  drag:     <svg width="14" height="14" viewBox="0 0 10 16" fill="none"><circle cx="3" cy="3" r="1.5" fill="currentColor" opacity=".4"/><circle cx="7" cy="3" r="1.5" fill="currentColor" opacity=".4"/><circle cx="3" cy="8" r="1.5" fill="currentColor" opacity=".4"/><circle cx="7" cy="8" r="1.5" fill="currentColor" opacity=".4"/><circle cx="3" cy="13" r="1.5" fill="currentColor" opacity=".4"/><circle cx="7" cy="13" r="1.5" fill="currentColor" opacity=".4"/></svg>,
  chevD:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  chevR:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>,
  arrowR:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  arrowL:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  image:    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  video:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  text:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>,
  doc:      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  link:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  x:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  upload:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
  star:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  dollar:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  send:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
}

const STEP_DEFS = [
  { n: 1, label: 'Información' },
  { n: 2, label: 'Estructura' },
  { n: 3, label: 'Contenido' },
  { n: 4, label: 'Evaluación' },
  { n: 5, label: 'Certificación' },
  { n: 6, label: 'Precio' },
  { n: 7, label: 'Vista previa' },
  { n: 8, label: 'Publicación' },
]

const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: IC.video },
  { value: 'text',  label: 'Texto', icon: IC.text },
  { value: 'document', label: 'Documento', icon: IC.doc },
]

const Q_TYPES = [
  { value: 'single',     label: 'Opción múltiple' },
  { value: 'multiple',   label: 'Selección múltiple' },
  { value: 'true_false', label: 'Verdadero / Falso' },
  { value: 'open',       label: 'Respuesta corta' },
]

// ─── Step 1: Información ──────────────────────────────────────────────────────

function Step1({ info, onChange, categories, instructors, isAdmin, imgUploading, onImgUpload }) {
  const fileRef = useRef()

  return (
    <div>
      <StepHeader n={1} title="Información del curso" sub="Define qué es tu curso y cómo lo verán los estudiantes." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem' }} className="wiz-grid">
        <div>
          <Field label="Título del curso" req>
            <input style={INP} value={info.title} placeholder="ej. Diseño UX desde cero"
              onChange={e => onChange('title', e.target.value)} onFocus={fi} onBlur={fb} />
          </Field>
          {isAdmin && (
            <Field label="Instructor" req hint="El instructor que aparecerá como autor del curso">
              <select style={SEL} value={info.instructorId} onChange={e => onChange('instructorId', e.target.value)} onFocus={fi} onBlur={fb}>
                <option value="">— Selecciona un instructor —</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.full_name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Categoría" req>
            <select style={SEL} value={info.categoryId} onChange={e => onChange('categoryId', e.target.value)} onFocus={fi} onBlur={fb}>
              <option value="">— Selecciona una categoría —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Nivel">
            <div style={{ marginTop: '.15rem' }}>
              <PillSelector
                options={[{ value: 'beginner', label: 'Básico' }, { value: 'intermediate', label: 'Intermedio' }, { value: 'advanced', label: 'Avanzado' }]}
                value={info.level} onChange={v => onChange('level', v)} />
            </div>
          </Field>
          <Field label="Descripción corta" req hint="2-3 oraciones que resuman lo que aprenderá el estudiante.">
            <textarea style={{ ...INP, resize: 'vertical', minHeight: 100, lineHeight: 1.65 }}
              value={info.description} placeholder="En este curso aprenderás…"
              onChange={e => onChange('description', e.target.value)} onFocus={fi} onBlur={fb} />
          </Field>
        </div>

        <div>
          <Field label="Imagen de portada" req hint="JPG, PNG o WebP · Máx. 5 MB · Recomendado 1280×720 px">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={e => { onImgUpload(e.target.files[0]); e.target.value = '' }} />
            {info.coverUrl ? (
              <div style={{ position: 'relative' }}>
                <img src={info.coverUrl} alt="Portada"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)', display: 'block' }} />
                <button type="button" onClick={() => onChange('coverUrl', '')}
                  style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(22,32,31,.65)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {IC.x}
                </button>
              </div>
            ) : (
              <div onClick={() => !imgUploading && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--jade)'; e.currentTarget.style.background = 'var(--jade-soft)' }}
                onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)' }}
                onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)'; onImgUpload(e.dataTransfer.files[0]) }}
                style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '3rem 1rem', textAlign: 'center', cursor: imgUploading ? 'wait' : 'pointer', background: 'var(--cream)', transition: 'all .2s', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.7rem' }}>
                {imgUploading ? (
                  <>
                    <div style={{ width: 32, height: 32, border: '2.5px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} />
                    <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>Subiendo…</span>
                  </>
                ) : (
                  <>
                    <div style={{ color: 'var(--text-2)' }}>{IC.upload}</div>
                    <div>
                      <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--carbon)' }}>Arrastra o haz clic para subir</div>
                      <div style={{ fontSize: '.73rem', color: 'var(--text-2)', marginTop: '.2rem' }}>JPG, PNG o WebP · Máx. 5 MB</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </Field>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Estructura ───────────────────────────────────────────────────────

function Step2({ modules, setModules }) {
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
          <div key={mod.id} draggable onDragStart={e => onModDragStart(e, mIdx)} onDragEnd={onModDragEnd} onDragOver={e => onModDragOver(e, mIdx)}
            style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color .15s' }}>
            {/* Module header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.85rem 1.1rem', background: 'white' }}>
              <span style={{ color: 'var(--text-2)', cursor: 'grab', flexShrink: 0 }}>{IC.drag}</span>
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
                  <div key={les.id} draggable onDragStart={e => onLesDragStart(e, mod.id, lIdx)} onDragEnd={onLesDragEnd} onDragOver={e => onLesDragOver(e, mod.id, lIdx)}
                    style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.6rem 1.1rem .6rem 2rem', borderBottom: '1px solid var(--border)', background: '#FAFAF9' }}>
                    <span style={{ color: '#C9C5BE', cursor: 'grab', flexShrink: 0 }}>{IC.drag}</span>
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

// ─── Step 3: Contenido ────────────────────────────────────────────────────────

function Step3({ modules, setModules }) {
  function updateLesson(mId, lId, patch) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, ...patch } : l) }
      : m
    ))
  }

  function addLink(mId, lId) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, links: [...(l.links || []), { id: uid(), url: '', label: '' }] } : l) }
      : m
    ))
  }

  function updateLink(mId, lId, linkId, patch) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId
          ? { ...l, links: (l.links || []).map(lk => lk.id === linkId ? { ...lk, ...patch } : lk) }
          : l) }
      : m
    ))
  }

  function removeLink(mId, lId, linkId) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, links: (l.links || []).filter(lk => lk.id !== linkId) } : l) }
      : m
    ))
  }

  if (modules.every(m => m.lessons.length === 0)) {
    return (
      <div>
        <StepHeader n={3} title="Contenido de lecciones" sub="Agrega el material real de cada lección." />
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.875rem', background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
          No hay lecciones todavía. Vuelve al paso anterior y agrega lecciones.
        </div>
      </div>
    )
  }

  return (
    <div>
      <StepHeader n={3} title="Contenido de lecciones" sub="Agrega URLs de video, texto explicativo y recursos para cada lección." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {modules.map((mod, mIdx) => mod.lessons.length > 0 && (
          <div key={mod.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '.8rem 1.25rem', background: 'var(--cream)', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '.71rem', fontWeight: 700, color: 'var(--jade)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Módulo {mIdx + 1}</span>
              <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', marginLeft: '.6rem' }}>{mod.title || '(sin título)'}</span>
            </div>
            {mod.lessons.map((les, lIdx) => (
              <LessonContentEditor key={les.id} les={les} mIdx={mIdx} lIdx={lIdx}
                onChange={patch => updateLesson(mod.id, les.id, patch)}
                onAddLink={() => addLink(mod.id, les.id)}
                onUpdateLink={(linkId, p) => updateLink(mod.id, les.id, linkId, p)}
                onRemoveLink={linkId => removeLink(mod.id, les.id, linkId)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function LessonContentEditor({ les, mIdx, lIdx, onChange, onAddLink, onUpdateLink, onRemoveLink }) {
  const [open, setOpen] = useState(false)
  const typeLabel = { video: 'Video', text: 'Texto', document: 'Documento' }
  const typeIcon  = { video: IC.video, text: IC.text, document: IC.doc }

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.75rem 1.25rem', cursor: 'pointer' }}
        onMouseEnter={e => e.currentTarget.style.background = '#FAFAF9'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <span style={{ color: 'var(--text-2)', flexShrink: 0 }}>{typeIcon[les.type] || IC.video}</span>
        <span style={{ flex: 1, fontSize: '.875rem', fontWeight: 500, color: les.title ? 'var(--carbon)' : 'var(--text-2)' }}>
          {les.title || `Lección ${lIdx + 1}`}
        </span>
        <span style={{ fontSize: '.72rem', color: 'var(--text-2)', marginRight: '.3rem' }}>{typeLabel[les.type]}</span>
        <div style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s', color: 'var(--text-2)' }}>{IC.chevD}</div>
      </div>

      {open && (
        <div style={{ padding: '1rem 1.25rem 1.25rem', background: '#FAFAF9', borderTop: '1px solid var(--border)' }}>
          {(les.type === 'video' || les.type === 'document') && (
            <Field label={les.type === 'video' ? 'URL del video' : 'URL del documento'} hint={les.type === 'video' ? 'YouTube, Vimeo o cualquier URL de video' : 'Enlace directo al PDF o archivo'}>
              <input style={INP} type="url" value={les.video_url || ''} placeholder="https://..."
                onChange={e => onChange({ video_url: e.target.value })} onFocus={fi} onBlur={fb} />
            </Field>
          )}
          <Field label="Texto explicativo" hint="Notas o transcripción de la lección">
            <textarea style={{ ...INP, resize: 'vertical', minHeight: 80, lineHeight: 1.6 }}
              value={les.content_text || ''} placeholder="Descripción o notas de la lección…"
              onChange={e => onChange({ content_text: e.target.value })} onFocus={fi} onBlur={fb} />
          </Field>
          <div>
            <label style={{ display: 'block', fontSize: '.69rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9B9894', marginBottom: '.5rem' }}>
              {IC.link} Links externos
            </label>
            {(les.links || []).map(lk => (
              <div key={lk.id} style={{ display: 'flex', gap: '.5rem', marginBottom: '.4rem', alignItems: 'center' }}>
                <input style={{ ...INP, flex: 2, padding: '.45rem .7rem', fontSize: '.84rem' }} type="url" value={lk.url} placeholder="URL" onChange={e => onUpdateLink(lk.id, { url: e.target.value })} onFocus={fi} onBlur={fb} />
                <input style={{ ...INP, flex: 1, padding: '.45rem .7rem', fontSize: '.84rem' }} type="text" value={lk.label} placeholder="Etiqueta" onChange={e => onUpdateLink(lk.id, { label: e.target.value })} onFocus={fi} onBlur={fb} />
                <SmallBtn danger onClick={() => onRemoveLink(lk.id)}>{IC.x}</SmallBtn>
              </div>
            ))}
            <button type="button" onClick={onAddLink}
              style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.79rem', color: 'var(--jade)', fontWeight: 600, fontFamily: 'var(--sans)', padding: '.2rem 0', marginTop: '.2rem' }}>
              {IC.plus} Agregar link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 4: Evaluación ───────────────────────────────────────────────────────

function Step4({ eval: ev, setEval }) {
  const { hasEval, evalType, minScore, maxAttempts, showResults, questions } = ev
  const set = (k, v) => setEval(e => ({ ...e, [k]: v }))

  function addQuestion() {
    const q = { id: uid(), type: 'single', text: '', score: 1, answers: [], expanded: true }
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
      ? { ...q, answers: [...q.answers, { id: uid(), text: '', correct: false }] }
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
              <Field label="Tipo de evaluación">
                <PillSelector
                  options={[{ value: 'quiz', label: 'Quiz' }, { value: 'final', label: 'Examen final' }, { value: 'both', label: 'Ambos' }]}
                  value={evalType} onChange={v => set('evalType', v)} />
              </Field>
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
              <Field label="Mostrar resultados">
                <PillSelector
                  options={[{ value: 'grade_only', label: 'Solo nota' }, { value: 'show_correct', label: '+ Respuestas' }, { value: 'show_explanation', label: '+ Explicación' }]}
                  value={showResults} onChange={v => set('showResults', v)} />
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
            <div>
              <Field label="Tipo">
                <select style={{ ...SEL, width: 'auto' }} value={q.type} onChange={e => onUpdate({ type: e.target.value, answers: [] })} onFocus={fi} onBlur={fb}>
                  {Q_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
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
                  ? ['Verdadero', 'Falso'].map((opt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <input type="radio" name={`q-${q.id}`} checked={q.answers.find(a => a.text === opt)?.correct || false}
                          onChange={() => {
                            const answers = [{ id: uid(), text: 'Verdadero', correct: opt === 'Verdadero' }, { id: uid(), text: 'Falso', correct: opt === 'Falso' }]
                            onUpdate({ answers })
                          }}
                          style={{ accentColor: 'var(--jade)', flexShrink: 0 }} />
                        <span style={{ fontSize: '.875rem', color: 'var(--carbon)' }}>{opt}</span>
                      </div>
                    ))
                  : q.answers.map(ans => (
                      <div key={ans.id} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <input
                          type={isMultiple ? 'checkbox' : 'radio'}
                          name={`q-${q.id}`}
                          checked={ans.correct}
                          onChange={() => onSetCorrect(ans.id)}
                          style={{ accentColor: 'var(--jade)', flexShrink: 0 }} />
                        <input style={{ ...INP, flex: 1, padding: '.35rem .65rem', fontSize: '.84rem' }}
                          value={ans.text} placeholder="Opción…"
                          onChange={e => onUpdateAnswer(ans.id, { text: e.target.value })} onFocus={fi} onBlur={fb} />
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

// ─── Step 5: Certificación ────────────────────────────────────────────────────

function Step5({ cert, setCert }) {
  const set = (k, v) => setCert(c => ({ ...c, [k]: v }))
  return (
    <div>
      <StepHeader n={5} title="Certificación" sub="Define si los estudiantes reciben un certificado al completar el curso." />
      <div style={{ maxWidth: 600 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <Toggle checked={cert.hasCert} onChange={e => set('hasCert', e.target.checked)} label="Este curso genera certificado" />
        </div>
        {cert.hasCert && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Nombre en el certificado" hint="El nombre que aparecerá en el certificado junto al del estudiante" req>
              <input style={INP} value={cert.certName} placeholder="ej. Diseño UX desde cero"
                onChange={e => set('certName', e.target.value)} onFocus={fi} onBlur={fb} />
            </Field>
            <Field label="Condición para obtenerlo">
              <PillSelector
                options={[{ value: 'complete', label: 'Completar 100%' }, { value: 'pass', label: 'Aprobar evaluación' }]}
                value={cert.certCondition} onChange={v => set('certCondition', v)} />
            </Field>
            <div style={{ padding: '1rem 1.1rem', background: 'var(--jade-soft)', borderRadius: 9, border: '1px solid rgba(22,125,120,.2)' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--jade)', fontWeight: 600, margin: '0 0 .2rem' }}>Vista previa del certificado</p>
              <p style={{ fontSize: '.78rem', color: 'var(--jade)', margin: 0, opacity: .8 }}>
                "[Nombre del estudiante] completó exitosamente {cert.certName || 'el curso'}" — Cubo Academy
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 6: Precio ───────────────────────────────────────────────────────────

function Step6({ pricing, setPricing }) {
  const set = (k, v) => setPricing(p => ({ ...p, [k]: v }))
  return (
    <div>
      <StepHeader n={6} title="Precio" sub="Define si tu curso es gratuito o de pago y cómo se monetizará." />
      <div style={{ maxWidth: 520 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <Toggle checked={pricing.isFree} onChange={e => set('isFree', e.target.checked)} label="Curso gratuito" />
        </div>
        {!pricing.isFree && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Precio (USD)" req>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)', fontSize: '.95rem', pointerEvents: 'none' }}>$</span>
                <input type="number" min="0" step="0.01" value={pricing.price}
                  onChange={e => set('price', e.target.value)} onFocus={fi} onBlur={fb}
                  style={{ ...INP, paddingLeft: '1.8rem' }} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Descuento (opcional)" hint="Deja vacío si no aplica descuento">
              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type="number" min="0" max="100" value={pricing.discount}
                    onChange={e => set('discount', e.target.value)} onFocus={fi} onBlur={fb}
                    style={{ ...INP }} placeholder="0" />
                </div>
                <span style={{ fontSize: '.9rem', color: 'var(--text-2)', flexShrink: 0 }}>% de descuento</span>
              </div>
            </Field>
            {pricing.price && pricing.discount ? (
              <div style={{ padding: '.85rem 1.1rem', background: 'var(--jade-soft)', borderRadius: 9, border: '1px solid rgba(22,125,120,.2)' }}>
                <p style={{ fontSize: '.82rem', color: 'var(--jade)', margin: 0 }}>
                  Precio final: <strong>${(parseFloat(pricing.price) * (1 - parseFloat(pricing.discount) / 100)).toFixed(2)}</strong>
                  {' '}<span style={{ textDecoration: 'line-through', opacity: .7 }}>${parseFloat(pricing.price).toFixed(2)}</span>
                </p>
              </div>
            ) : null}
            <Field label="Método de cobro">
              <div style={{ padding: '.85rem 1.1rem', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" stroke="var(--text-2)" strokeWidth="1.5"/><line x1="2" y1="10" x2="22" y2="10" stroke="var(--text-2)" strokeWidth="1.5"/></svg>
                <span style={{ fontSize: '.85rem', color: 'var(--carbon)' }}>PayPal integrado</span>
              </div>
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Step 7: Vista previa ─────────────────────────────────────────────────────

function Step7({ info, modules, eval: ev, cert, pricing }) {
  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)

  const checks = [
    { label: 'Tiene título',      ok: Boolean(info.title.trim()) },
    { label: 'Tiene descripción', ok: Boolean(info.description.trim()) },
    { label: 'Tiene portada',     ok: Boolean(info.coverUrl) },
    { label: 'Tiene estructura',  ok: modules.length > 0 && totalLessons > 0 },
    { label: 'Tiene contenido',   ok: modules.some(m => m.lessons.some(l => l.video_url || l.content_text)) },
  ]
  const ready = checks.every(c => c.ok)

  return (
    <div>
      <StepHeader n={7} title="Vista previa" sub="Revisa el resumen de tu curso antes de publicar." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="wiz-grid">
        {/* Course card preview */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ aspectRatio: '16/9', background: 'linear-gradient(140deg,#0d3840,#082830)', position: 'relative' }}>
            {info.coverUrl
              ? <img src={info.coverUrl} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,.3)' }}>{IC.image}</div>
            }
          </div>
          <div style={{ padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: '0 0 .35rem', lineHeight: 1.3 }}>
              {info.title || 'Sin título'}
            </p>
            <p style={{ fontSize: '.8rem', color: 'var(--text-2)', margin: '0 0 .85rem', lineHeight: 1.5 }}>
              {info.description?.slice(0, 120) || 'Sin descripción'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' }}>
              {!pricing.isFree && pricing.price ? (
                <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--jade)' }}>
                  ${pricing.discount ? (parseFloat(pricing.price) * (1 - parseFloat(pricing.discount) / 100)).toFixed(2) : parseFloat(pricing.price).toFixed(2)}
                </span>
              ) : (
                <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--jade)', padding: '.2rem .6rem', background: 'var(--jade-soft)', borderRadius: 6 }}>Gratuito</span>
              )}
              {cert.hasCert && (
                <span style={{ fontSize: '.75rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.25rem' }}>{IC.star} Certificado</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Checklist */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .85rem' }}>Checklist de publicación</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {checks.map(c => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: c.ok ? 'var(--jade)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {c.ok ? <span style={{ color: 'white' }}>{IC.check}</span> : null}
                  </div>
                  <span style={{ fontSize: '.83rem', color: c.ok ? 'var(--carbon)' : 'var(--text-2)' }}>{c.label}</span>
                </div>
              ))}
            </div>
            {ready && (
              <div style={{ marginTop: '1rem', padding: '.7rem', background: 'var(--jade-soft)', borderRadius: 8, fontSize: '.8rem', color: 'var(--jade)', fontWeight: 600 }}>
                ¡Tu curso está listo para publicar!
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.25rem' }}>
            <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .85rem' }}>Resumen</p>
            {[
              { label: 'Módulos', value: modules.length },
              { label: 'Lecciones', value: totalLessons },
              { label: 'Evaluación', value: ev.hasEval ? `Sí · ${ev.minScore}% mínimo` : 'No' },
              { label: 'Certificado', value: cert.hasCert ? 'Sí' : 'No' },
              { label: 'Precio', value: pricing.isFree ? 'Gratuito' : `$${pricing.price || '0'}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '.83rem', color: 'var(--text-2)' }}>{r.label}</span>
                <span style={{ fontSize: '.83rem', fontWeight: 600, color: 'var(--carbon)' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 8: Publicación ──────────────────────────────────────────────────────

function Step8({ status, setStatus, saving, error, onDraft, onReview, isAdmin }) {
  const options = isAdmin
    ? [
        { value: 'draft',     label: 'Guardar como borrador',    sub: 'El curso queda privado. Puedes seguir editándolo.',      icon: '📝' },
        { value: 'review',    label: 'Enviar a revisión',         sub: 'Queda pendiente de revisión antes de publicarse.',       icon: '📤' },
        { value: 'published', label: 'Publicar directamente',     sub: 'El curso queda visible para todos los estudiantes.',     icon: '🚀' },
      ]
    : [
        { value: 'draft',  label: 'Guardar como borrador', sub: 'El curso queda privado. Puedes seguir editándolo.',                       icon: '📝' },
        { value: 'review', label: 'Enviar a revisión',      sub: 'Un administrador revisará el curso y decidirá si lo publica.', icon: '📤' },
      ]

  const canSubmit = status === 'review' || (isAdmin && status === 'published')

  return (
    <div>
      <StepHeader n={8} title="Publicación" sub="Tu curso está listo. Elige cómo quieres lanzarlo." />
      <div style={{ maxWidth: 580 }}>
        {error && (
          <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.84rem', marginBottom: '1.25rem' }}>{error}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '2rem' }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => setStatus(opt.value)}
              style={{ padding: '1.1rem 1.25rem', border: `2px solid ${status === opt.value ? 'var(--jade)' : 'var(--border)'}`, borderRadius: 11, cursor: 'pointer', background: status === opt.value ? 'var(--jade-soft)' : 'white', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: '.9rem' }}>
              <span style={{ fontSize: '1.35rem', lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .2rem' }}>{opt.label}</p>
                <p style={{ fontSize: '.8rem', color: 'var(--text-2)', margin: 0 }}>{opt.sub}</p>
              </div>
              {status === opt.value && (
                <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white' }}>{IC.check}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onDraft} disabled={saving}
            style={{ padding: '.7rem 1.4rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', background: 'white', color: 'var(--carbon)', opacity: saving ? .55 : 1 }}>
            Guardar borrador
          </button>
          <button type="button" onClick={onReview} disabled={saving || !canSubmit}
            style={{ padding: '.7rem 1.6rem', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, cursor: (saving || status !== 'review') ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', background: 'var(--jade)', color: 'white', opacity: (saving || status !== 'review') ? .55 : 1, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            {saving ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} /> Enviando…</>
            ) : status === 'published' ? (
              <>{IC.send} Publicar curso</>
            ) : (
              <>{IC.send} Enviar a revisión</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Step header ──────────────────────────────────────────────────────────────

function StepHeader({ n, title, sub }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <p style={{ fontSize: '.71rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', margin: '0 0 .25rem' }}>Paso {n} de 8</p>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.3rem,2.5vw,1.7rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: '0 0 .4rem' }}>{title}</h2>
      <p style={{ fontSize: '.88rem', color: 'var(--text-2)', margin: 0 }}>{sub}</p>
    </div>
  )
}

// ─── Wizard sidebar ───────────────────────────────────────────────────────────

function WizardSidebar({ step, completed, courseTitle }) {
  return (
    <div style={{ width: 218, flexShrink: 0, background: 'white', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 1.25rem 1.1rem', borderBottom: '1px solid var(--border)' }}>
        <p style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', margin: '0 0 .3rem' }}>Nuevo curso</p>
        <p style={{ fontFamily: 'var(--serif)', fontWeight: 700, fontSize: '.87rem', color: 'var(--carbon)', margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {courseTitle || 'Sin título'}
        </p>
      </div>
      <div style={{ flex: 1, padding: '.6rem 0' }}>
        {STEP_DEFS.map(s => {
          const done    = completed.has(s.n)
          const current = step === s.n
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.58rem 1.1rem', background: current ? 'var(--jade-soft)' : 'transparent', transition: 'background .15s' }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--jade)' : current ? 'white' : 'transparent',
                border: done ? 'none' : current ? '2px solid var(--jade)' : '1.5px solid var(--border)',
                fontSize: '.68rem', fontWeight: 700,
                color: done ? 'white' : current ? 'var(--jade)' : 'var(--text-2)',
              }}>
                {done ? IC.check : s.n}
              </div>
              <span style={{ fontSize: '.83rem', fontWeight: current ? 600 : done ? 500 : 400, color: current ? 'var(--jade)' : done ? 'var(--carbon)' : 'var(--text-2)' }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '1rem 1.1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${(Math.max(...[...completed, step]) / 8) * 100}%`, background: 'var(--jade)', borderRadius: 4, transition: 'width .3s' }} />
        </div>
        <p style={{ fontSize: '.69rem', color: 'var(--text-2)', margin: '.4rem 0 0' }}>{completed.size} de 8 completados</p>
      </div>
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function CourseWizardPage() {
  const { navigate } = useNavigation()
  const { profile }  = useAuth()

  const [step, setStep]           = useState(1)
  const [completed, setCompleted] = useState(new Set())
  const [courseId, setCourseId]   = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [categories, setCategories]   = useState([])
  const [instructors, setInstructors] = useState([])
  const isAdmin = profile?.role === 'admin'

  // Step 1 state
  const [info, setInfo]            = useState({ title: '', categoryId: '', level: 'beginner', description: '', coverUrl: '', instructorId: '' })
  const [imgUploading, setImgUploading] = useState(false)
  const [imgErr, setImgErr]        = useState('')

  // Step 2–3 state
  const [modules, setModules]      = useState([])

  // Step 4 state
  const [evalData, setEvalData]    = useState({ hasEval: false, evalType: 'final', minScore: 70, maxAttempts: 1, showResults: 'grade_only', questions: [] })

  // Step 5 state
  const [cert, setCert]            = useState({ hasCert: false, certName: '', certCondition: 'complete' })

  // Step 6 state
  const [pricing, setPricing]      = useState({ isFree: true, price: '', discount: '' })

  // Step 8
  const [pubStatus, setPubStatus]  = useState('draft')
  const [pubError, setPubError]    = useState('')

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
    if (profile?.role === 'admin') {
      supabase.from('users_view').select('id, full_name').in('role', ['instructor', 'admin']).order('full_name').then(({ data }) => setInstructors(data || []))
    }
  }, [profile?.role])

  // ── image upload ──────────────────────────────────────────────────────────
  async function handleImgUpload(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setImgErr('Solo JPG, PNG o WebP.'); return }
    if (file.size > 5 * 1024 * 1024) { setImgErr('Máximo 5 MB.'); return }
    setImgErr(''); setImgUploading(true)
    const name = `${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('course-images').upload(name, file)
    if (upErr) { setImgErr(upErr.message); setImgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(name)
    setInfo(i => ({ ...i, coverUrl: publicUrl }))
    setImgUploading(false)
  }

  // ── step validations ──────────────────────────────────────────────────────
  function validateStep(n) {
    switch (n) {
      case 1:
        if (!info.title.trim())                  return 'El título del curso es obligatorio.'
        if (isAdmin && !info.instructorId)        return 'Selecciona un instructor.'
        if (!info.categoryId)                     return 'Selecciona una categoría.'
        if (!info.description.trim())             return 'La descripción es obligatoria.'
        if (!info.coverUrl)                       return 'Sube una imagen de portada.'
        return null
      case 2:
        if (modules.length === 0)                            return 'Agrega al menos un módulo.'
        if (modules.every(m => m.lessons.length === 0))     return 'Agrega al menos una lección.'
        if (modules.some(m => !m.title.trim()))             return 'Todos los módulos necesitan un título.'
        if (modules.some(m => m.lessons.some(l => !l.title.trim()))) return 'Todas las lecciones necesitan un título.'
        return null
      case 4:
        if (evalData.hasEval && evalData.questions.length === 0) return 'Agrega al menos una pregunta.'
        return null
      default:
        return null
    }
  }

  // ── save step 1 ───────────────────────────────────────────────────────────
  async function saveStep1() {
    const payload = {
      title: info.title.trim(),
      slug: slug(info.title.trim()),
      description: info.description.trim(),
      instructor_id: (isAdmin && info.instructorId) ? info.instructorId : profile.id,
      category_id: info.categoryId || null,
      cover_image_url: info.coverUrl || null,
      level: info.level,
      status: 'draft',
      price: 0,
    }
    if (courseId) {
      const { error } = await supabase.from('courses').update(payload).eq('id', courseId)
      if (error) throw error
    } else {
      const { data, error } = await supabase.from('courses').insert(payload).select('id').single()
      if (error) throw error
      setCourseId(data.id)
      return data.id
    }
    return courseId
  }

  // ── save step 2 (nuke & re-insert) ───────────────────────────────────────
  async function saveStep2(cId) {
    if (cId) {
      const { data: existingMods } = await supabase.from('modules').select('id').eq('course_id', cId)
      if (existingMods?.length > 0) {
        const modIds = existingMods.map(m => m.id)
        await supabase.from('resources').delete().in('lesson_id',
          (await supabase.from('lessons').select('id').in('module_id', modIds)).data?.map(l => l.id) || [])
        await supabase.from('lessons').delete().in('module_id', modIds)
        await supabase.from('modules').delete().eq('course_id', cId)
      }
    }
    const savedModIds = {}
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i]
      const { data: modData, error: modErr } = await supabase.from('modules')
        .insert({ course_id: cId, title: mod.title.trim(), order_index: i + 1 })
        .select('id').single()
      if (modErr) throw modErr
      savedModIds[mod.id] = modData.id
      for (let j = 0; j < mod.lessons.length; j++) {
        const les = mod.lessons[j]
        const videoUrl = les.video_url ? JSON.stringify([{ url: les.video_url, label: 'Video' }]) : null
        const { error: lesErr } = await supabase.from('lessons').insert({
          module_id: modData.id, title: les.title.trim(),
          description: les.content_text || null,
          video_url: videoUrl,
          duration_mins: les.duration_mins !== '' ? parseInt(les.duration_mins) || null : null,
          is_free_preview: false, order_index: j + 1,
        })
        if (lesErr) throw lesErr
      }
    }
    setModules(ms => ms.map(m => ({ ...m, dbId: savedModIds[m.id] })))
  }

  // ── save step 4 (evaluation quiz) ─────────────────────────────────────────
  async function saveStep4(cId) {
    if (!evalData.hasEval || evalData.questions.length === 0) return

    // Create/find a special eval module
    const { data: evalMod, error: modErr } = await supabase.from('modules')
      .insert({ course_id: cId, title: 'Evaluación Final', order_index: 9999 })
      .select('id').single()
    if (modErr) throw modErr

    const { data: evalLes, error: lesErr } = await supabase.from('lessons')
      .insert({ module_id: evalMod.id, title: 'Examen Final', order_index: 1, is_free_preview: false })
      .select('id').single()
    if (lesErr) throw lesErr

    const { data: quiz, error: qzErr } = await supabase.from('quizzes')
      .insert({ lesson_id: evalLes.id, title: 'Evaluación del curso', passing_score: evalData.minScore, max_attempts: evalData.maxAttempts || 99 })
      .select('id').single()
    if (qzErr) throw qzErr

    for (const q of evalData.questions) {
      const { data: qRow, error: qErr } = await supabase.from('questions')
        .insert({ quiz_id: quiz.id, type: q.type, text: q.text.trim(), score: q.score || 1 })
        .select('id').single()
      if (qErr) throw qErr

      if (q.type === 'true_false' && q.answers.length === 0) {
        await supabase.from('answers').insert([
          { question_id: qRow.id, text: 'Verdadero', is_correct: false },
          { question_id: qRow.id, text: 'Falso', is_correct: false },
        ])
      } else {
        for (const a of q.answers) {
          await supabase.from('answers').insert({ question_id: qRow.id, text: a.text.trim(), is_correct: a.correct })
        }
      }
    }
  }

  // ── save step 6 (price) ───────────────────────────────────────────────────
  async function saveStep6(cId) {
    const finalPrice = pricing.isFree ? 0 : (parseFloat(pricing.price) || 0)
    const { error } = await supabase.from('courses').update({ price: finalPrice }).eq('id', cId)
    if (error) throw error
  }

  // ── next handler ──────────────────────────────────────────────────────────
  async function handleNext() {
    const validErr = validateStep(step)
    if (validErr) { setError(validErr); return }
    setError(''); setSaving(true)

    try {
      let cId = courseId
      if (step === 1) { cId = await saveStep1() }
      if (step === 2) { await saveStep2(cId) }
      if (step === 4) { await saveStep4(cId) }
      if (step === 6) { await saveStep6(cId) }

      setCompleted(s => new Set([...s, step]))
      setStep(n => n + 1)
    } catch (e) {
      setError(e.message || 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() { setError(''); setStep(n => n - 1) }

  // ── publish handlers ──────────────────────────────────────────────────────
  async function handleDraft() {
    if (!courseId) return
    setSaving(true); setPubError('')
    const { error } = await supabase.from('courses').update({ status: 'draft' }).eq('id', courseId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('cursos')
  }

  async function handleReview() {
    if (!courseId) return
    setSaving(true); setPubError('')
    const { error } = await supabase.from('courses').update({ status: 'review' }).eq('id', courseId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('cursos')
  }

  // ── render ────────────────────────────────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1: return <Step1 info={info} onChange={(k, v) => setInfo(i => ({ ...i, [k]: v }))} categories={categories} instructors={instructors} isAdmin={isAdmin} imgUploading={imgUploading} onImgUpload={handleImgUpload} />
      case 2: return <Step2 modules={modules} setModules={setModules} />
      case 3: return <Step3 modules={modules} setModules={setModules} />
      case 4: return <Step4 eval={evalData} setEval={setEvalData} />
      case 5: return <Step5 cert={cert} setCert={setCert} />
      case 6: return <Step6 pricing={pricing} setPricing={setPricing} />
      case 7: return <Step7 info={info} modules={modules} eval={evalData} cert={cert} pricing={pricing} />
      case 8: return <Step8 status={pubStatus} setStatus={setPubStatus} saving={saving} error={pubError} onDraft={handleDraft} onReview={handleReview} isAdmin={isAdmin} />
      default: return null
    }
  }

  return (
    <DashboardLayout>
      <style>{`
        @keyframes wiz-spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .wiz-grid { grid-template-columns: 1fr !important; }
          .wiz-sidebar { display: none !important; }
          .wiz-content { padding: 1.25rem 1rem 6rem !important; }
        }
      `}</style>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 110px)', background: 'var(--cream)' }}>
        {/* Sidebar */}
        <div className="wiz-sidebar" style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100vh', overflowY: 'auto' }}>
          <WizardSidebar step={step} completed={completed} courseTitle={info.title} />
        </div>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="wiz-content" style={{ maxWidth: 860, margin: '0 auto', padding: '2.5rem 2.5rem 6rem' }}>

            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <button type="button" onClick={() => navigate('cursos')}
                style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', padding: 0, transition: 'color .15s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--carbon)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                Mis cursos
              </button>
              {courseId && (
                <span style={{ fontSize: '.72rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--jade)' }} />
                  Borrador guardado
                </span>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 9, padding: '.75rem 1.1rem', fontSize: '.84rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </div>
            )}

            {/* Step content */}
            {renderStep()}

            {/* Navigation */}
            {step < 8 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                {step > 1 ? (
                  <button type="button" onClick={handleBack} disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '.45rem', padding: '.65rem 1.2rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 500, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    {IC.arrowL} Anterior
                  </button>
                ) : <div />}
                <button type="button" onClick={handleNext} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1.6rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .65 : 1, transition: 'background .15s' }}
                  onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--jade-hover)' }}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--jade)'}>
                  {saving ? (
                    <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} /> Guardando…</>
                  ) : (
                    <>Siguiente {IC.arrowR}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
