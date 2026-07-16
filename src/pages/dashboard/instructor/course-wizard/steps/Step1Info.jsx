import { useRef } from 'react'
import RichTextEditor from '../../../../../components/ui/RichTextEditor'
import { StepHeader } from '../components/StepHeader'
import { Field, PillSelector, INP, SEL, fi, fb, IC } from '../components/shared'

export function Step1Info({ info, onChange, categories, instructors, isAdmin, imgUploading, onImgUpload }) {
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
            <RichTextEditor value={info.description} placeholder="En este curso aprenderás…"
              onChange={html => onChange('description', html)} />
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
