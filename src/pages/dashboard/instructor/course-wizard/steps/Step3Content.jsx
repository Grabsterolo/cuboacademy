import { useRef, useState } from 'react'
import { supabase } from '../../../../../lib/supabase'
import RichTextEditor from '../../../../../components/ui/RichTextEditor'
import { StepHeader } from '../components/StepHeader'
import { Field, IC, INP, fi, fb, SmallBtn, uid, isLessonContentComplete } from '../components/shared'

export function Step3Content({ modules, setModules }) {
  function updateLesson(mId, lId, patch) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, ...patch } : l) }
      : m
    ))
  }

  function addLink(mId, lId, initial = {}) {
    setModules(ms => ms.map(m => m.id === mId
      ? { ...m, lessons: m.lessons.map(l => l.id === lId ? { ...l, links: [...(l.links || []), { id: uid(), url: '', label: '', fileType: 'link', ...initial }] } : l) }
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
                onAddFileResource={initial => addLink(mod.id, les.id, initial)}
                onUpdateLink={(linkId, p) => updateLink(mod.id, les.id, linkId, p)}
                onRemoveLink={linkId => removeLink(mod.id, les.id, linkId)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function LessonContentEditor({ les, mIdx, lIdx, onChange, onAddLink, onAddFileResource, onUpdateLink, onRemoveLink }) {
  const [open, setOpen] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docErr, setDocErr] = useState('')
  const [resUploading, setResUploading] = useState(false)
  const [resErr, setResErr] = useState('')
  const fileRef = useRef()
  const resFileRef = useRef()
  const typeLabel = { video: 'Video', text: 'Texto', document: 'Documento' }
  const typeIcon  = { video: IC.video, text: IC.text, document: IC.doc }

  async function handleDocUpload(file) {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setDocErr('Máximo 20 MB.'); return }
    setDocErr(''); setDocUploading(true)
    const name = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('course-resources').upload(name, file)
    if (error) { setDocErr(error.message); setDocUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-resources').getPublicUrl(name)
    onChange({ video_url: publicUrl })
    setDocUploading(false)
  }

  async function handleResourceUpload(file) {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setResErr('Máximo 20 MB.'); return }
    setResErr(''); setResUploading(true)
    const name = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('course-resources').upload(name, file)
    if (error) { setResErr(error.message); setResUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-resources').getPublicUrl(name)
    const ext = file.name.split('.').pop()?.toLowerCase()
    const fileType = ext === 'pdf' ? 'pdf' : ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext) ? 'template' : 'pdf'
    onAddFileResource({ url: publicUrl, label: file.name, fileType })
    setResUploading(false)
  }

  const docFileName = les.video_url ? decodeURIComponent(les.video_url.split('/').pop().split('?')[0]) : ''

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
        {isLessonContentComplete(les) ? (
          <span title="Contenido listo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', background: 'var(--jade-soft)', color: 'var(--jade)', flexShrink: 0 }}>{IC.check}</span>
        ) : (
          <span title="Falta contenido" style={{ width: 8, height: 8, borderRadius: '50%', background: '#DC2626', flexShrink: 0 }} />
        )}
        <div style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s', color: 'var(--text-2)' }}>{IC.chevD}</div>
      </div>

      {open && (
        <div style={{ padding: '1rem 1.25rem 1.25rem', background: '#FAFAF9', borderTop: '1px solid var(--border)' }}>
          {les.type === 'video' && (
            <Field label="URL del video" hint="YouTube, Vimeo o cualquier URL de video" id={`wiz-lesson-video-${les.id}`}>
              <input style={INP} type="url" value={les.video_url || ''} placeholder="https://..."
                onChange={e => onChange({ video_url: e.target.value })} onFocus={fi} onBlur={fb} />
            </Field>
          )}
          {les.type === 'document' && (
            <Field label="Documento" hint="PDF, Word, Excel o ZIP · Máx. 20 MB" id={`wiz-lesson-doc-${les.id}`}>
              <input id={`wiz-lesson-doc-${les.id}`} ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip" style={{ display: 'none' }}
                onChange={e => { handleDocUpload(e.target.files[0]); e.target.value = '' }} />
              {les.video_url ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.6rem .8rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8 }}>
                  <span style={{ color: 'var(--jade)', flexShrink: 0 }}>{IC.doc}</span>
                  <a href={les.video_url} target="_blank" rel="noopener noreferrer"
                    style={{ flex: 1, fontSize: '.84rem', color: 'var(--carbon)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {docFileName}
                  </a>
                  <SmallBtn onClick={() => fileRef.current?.click()} title="Reemplazar archivo">{IC.upload}</SmallBtn>
                  <SmallBtn danger onClick={() => onChange({ video_url: '' })} title="Quitar archivo">{IC.x}</SmallBtn>
                </div>
              ) : (
                <div onClick={() => !docUploading && fileRef.current?.click()}
                  style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.1rem', textAlign: 'center', cursor: docUploading ? 'wait' : 'pointer', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem' }}>
                  {docUploading ? (
                    <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>Subiendo…</span>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-2)' }}>{IC.upload}</span>
                      <span style={{ fontSize: '.82rem', color: 'var(--carbon)', fontWeight: 500 }}>Haz clic para subir un documento</span>
                    </>
                  )}
                </div>
              )}
              {docErr && <p style={{ fontSize: '.75rem', color: '#DC2626', margin: '.4rem 0 0' }}>{docErr}</p>}
            </Field>
          )}
          <Field label="Texto explicativo" hint="Notas o transcripción de la lección">
            <RichTextEditor value={les.content_text} placeholder="Descripción o notas de la lección…"
              minHeight={80} onChange={html => onChange({ content_text: html })} />
          </Field>
          <div>
            <div style={{ display: 'block', fontSize: '.69rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#9B9894', marginBottom: '.5rem' }}>
              {IC.link} Recursos de la lección
            </div>
            {(les.links || []).map(lk => (
              <div key={lk.id} style={{ display: 'flex', gap: '.5rem', marginBottom: '.4rem', alignItems: 'center' }}>
                {(lk.fileType === 'pdf' || lk.fileType === 'template') ? (
                  <div style={{ ...INP, flex: 2, padding: '.45rem .7rem', fontSize: '.84rem', display: 'flex', alignItems: 'center', gap: '.4rem', background: 'white', color: 'var(--text-2)' }}>
                    <span style={{ color: 'var(--jade)', flexShrink: 0 }}>{IC.doc}</span>
                    <a href={lk.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--carbon)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lk.label}</a>
                  </div>
                ) : (
                  <input style={{ ...INP, flex: 2, padding: '.45rem .7rem', fontSize: '.84rem' }} type="url" value={lk.url} placeholder="URL" onChange={e => onUpdateLink(lk.id, { url: e.target.value })} onFocus={fi} onBlur={fb} />
                )}
                <input style={{ ...INP, flex: 1, padding: '.45rem .7rem', fontSize: '.84rem' }} type="text" value={lk.label} placeholder="Etiqueta" onChange={e => onUpdateLink(lk.id, { label: e.target.value })} onFocus={fi} onBlur={fb} />
                <SmallBtn danger onClick={() => onRemoveLink(lk.id)}>{IC.x}</SmallBtn>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '.2rem' }}>
              <button type="button" onClick={onAddLink}
                style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '.79rem', color: 'var(--jade)', fontWeight: 600, fontFamily: 'var(--sans)', padding: '.2rem 0' }}>
                {IC.plus} Agregar link
              </button>
              <input ref={resFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }}
                onChange={e => { handleResourceUpload(e.target.files[0]); e.target.value = '' }} />
              <button type="button" onClick={() => !resUploading && resFileRef.current?.click()} disabled={resUploading}
                style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'none', border: 'none', cursor: resUploading ? 'wait' : 'pointer', fontSize: '.79rem', color: 'var(--jade)', fontWeight: 600, fontFamily: 'var(--sans)', padding: '.2rem 0' }}>
                {IC.upload} {resUploading ? 'Subiendo…' : 'Subir PDF o plantilla'}
              </button>
            </div>
            {resErr && <p style={{ fontSize: '.75rem', color: '#DC2626', margin: '.4rem 0 0' }}>{resErr}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
