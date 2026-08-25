import { cloneElement, isValidElement } from 'react'
import { Icon } from '../../../../../components/ui/icons'
import { INP, SEL, fi, fb } from '../../../../../components/ui/tokens'

export { INP, SEL, fi, fb }

export function uid() { return `_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

export function stripHtml(html) { return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() }

// a lesson has usable content once it carries what its type promises: a
// video/document URL, or actual explanatory text for text-only lessons
export function isLessonContentComplete(les) {
  if (les.type === 'video' || les.type === 'document') return Boolean(les.video_url && les.video_url.trim())
  if (les.type === 'text') return stripHtml(les.content_text).length > 0
  return false
}

// a question is gradable once it has text, and — unless it's an open/manually
// graded question — at least one answer marked correct
export function isQuestionComplete(q) {
  if (!q.text.trim()) return false
  if (q.type === 'open') return true
  return (q.answers || []).some(a => a.correct)
}

// ─── icons ────────────────────────────────────────────────────────────────────

export const IC = {
  plus:   <Icon name="plus" size={14} strokeWidth={2.5} />,
  trash:  <Icon name="trash" size={13} strokeWidth={2} />,
  check:  <Icon name="check" size={12} strokeWidth={3} />,
  drag:   <Icon name="drag" size={14} />,
  chevD:  <Icon name="chevD" size={13} strokeWidth={2} />,
  chevR:  <Icon name="chevR" size={13} strokeWidth={2} />,
  arrowR: <Icon name="arrowR" size={14} strokeWidth={2} />,
  arrowL: <Icon name="arrowL" size={14} strokeWidth={2} />,
  image:  <Icon name="image" size={28} strokeWidth={1.5} />,
  video:  <Icon name="video" size={12} strokeWidth={2} />,
  text:   <Icon name="text" size={12} strokeWidth={2} />,
  doc:    <Icon name="doc" size={12} strokeWidth={2} />,
  link:   <Icon name="link" size={12} strokeWidth={2} />,
  x:      <Icon name="x" size={13} strokeWidth={2.5} />,
  upload: <Icon name="upload" size={22} strokeWidth={1.5} />,
  star:   <Icon name="star" size={14} strokeWidth={2} />,
  dollar: <Icon name="dollar" size={14} strokeWidth={2} />,
  send:   <Icon name="send" size={14} strokeWidth={2} />,
}

// ─── step defs ────────────────────────────────────────────────────────────────

export const STEP_DEFS = [
  { n: 1, label: 'Información' },
  { n: 2, label: 'Estructura' },
  { n: 3, label: 'Contenido' },
  { n: 4, label: 'Evaluación' },
  { n: 5, label: 'Certificación' },
  { n: 6, label: 'Precio' },
  { n: 7, label: 'Vista previa' },
  { n: 8, label: 'Publicación' },
]

export const LESSON_TYPES = [
  { value: 'video', label: 'Video', icon: IC.video },
  { value: 'text',  label: 'Texto', icon: IC.text },
  { value: 'document', label: 'Documento', icon: IC.doc },
]

export const Q_TYPES = [
  { value: 'single',     label: 'Opción múltiple' },
  { value: 'multiple',   label: 'Selección múltiple' },
  { value: 'true_false', label: 'Verdadero / Falso' },
  { value: 'open',       label: 'Respuesta corta' },
]

// ─── micro ui ─────────────────────────────────────────────────────────────────

const FORM_TAGS = ['input', 'textarea', 'select']
export function Field({ label, req, hint, children, id }) {
  const input = id && isValidElement(children) && FORM_TAGS.includes(children.type) && !children.props.id
    ? cloneElement(children, { id })
    : children
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      {label && (
        <label htmlFor={id} style={{ display: 'block', fontSize: '.69rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '.35rem' }}>
          {label}{req && <span style={{ color: 'var(--jade)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {input}
      {hint && <p style={{ fontSize: '.71rem', color: 'var(--text-2)', margin: '.3rem 0 0' }}>{hint}</p>}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
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

export function PillSelector({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '.45rem', flexWrap: 'wrap' }}>
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          style={{ padding: '.4rem .95rem', borderRadius: 20, fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s', border: value === o.value ? '1.5px solid var(--jade)' : '1.5px solid var(--border)', background: value === o.value ? 'var(--jade-soft)' : 'white', color: value === o.value ? 'var(--jade-ink)' : 'var(--text-2)' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SmallBtn({ onClick, danger, title, children }) {
  return (
    <button type="button" onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: danger ? '#DC2626' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 28, minHeight: 28, transition: 'background .15s, color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,.1)' : 'var(--jade-soft)'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--jade)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--text-2)' }}>
      {children}
    </button>
  )
}
