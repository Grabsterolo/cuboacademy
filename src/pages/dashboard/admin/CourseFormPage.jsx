import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ADMIN_NAV } from '../../../config/navigation'

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '1.1rem' }}>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</label>
      {children}
      {hint && <p style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '.3rem' }}>{hint}</p>}
    </div>
  )
}

const INP = { width: '100%', padding: '.7rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)', fontSize: '16px', outline: 'none', fontFamily: 'var(--sans)', transition: 'border-color .2s, background .2s', boxSizing: 'border-box' }
const SEL = { ...INP, cursor: 'pointer' }

export default function CourseFormPage() {
  const { params, navigate } = useNavigation()
  const id = params?.courseId || null
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [instructors, setInstructors] = useState([])
  const [categories, setCategories] = useState([])

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [description, setDescription] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [imgUploading, setImgUploading] = useState(false)
  const [imgError, setImgError] = useState('')
  const fileInputRef = useRef(null)
  const [promoVideoUrl, setPromoVideoUrl] = useState('')
  const [price, setPrice] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [level, setLevel] = useState('beginner')
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    loadSupport()
    if (isEdit) loadCourse()
  }, [id])

  async function loadSupport() {
    const [{ data: instr }, { data: cats }] = await Promise.all([
      supabase.from('users_view').select('id, full_name, role').in('role', ['instructor', 'admin']).order('full_name'),
      supabase.from('categories').select('id, name').order('name'),
    ])
    if (instr) setInstructors(instr)
    if (cats) setCategories(cats)
  }

  async function loadCourse() {
    const { data } = await supabase.from('courses').select('*').eq('id', id).single()
    if (data) {
      setTitle(data.title || '')
      setSlug(data.slug || '')
      setSlugManual(true)
      setDescription(data.description || '')
      setInstructorId(data.instructor_id || '')
      setCategoryId(data.category_id || '')
      setCoverImageUrl(data.cover_image_url || '')
      setPromoVideoUrl(data.promo_video_url || '')
      setPrice(data.price != null ? String(data.price) : '')
      setDurationHours(data.duration_hours != null ? String(data.duration_hours) : '')
      setLevel(data.level || 'beginner')
      setStatus(data.status || 'draft')
    }
    setLoading(false)
  }

  function handleTitleChange(val) {
    setTitle(val)
    if (!slugManual) setSlug(generateSlug(val))
  }

  function handleSlugChange(val) {
    setSlug(val)
    setSlugManual(true)
  }

  function onFocusInp(e) { e.target.style.borderColor = 'var(--jade)'; e.target.style.background = 'white' }
  function onBlurInp(e)  { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)' }

  async function handleImageUpload(file) {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) { setImgError('Solo se aceptan JPG, PNG o WebP.'); return }
    if (file.size > 5 * 1024 * 1024) { setImgError('La imagen no puede superar 5 MB.'); return }
    setImgError('')
    setImgUploading(true)
    const fileName = `${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('course-images').upload(fileName, file)
    if (upErr) { setImgError(upErr.message); setImgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(fileName)
    setCoverImageUrl(publicUrl)
    setImgUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio.'); return }
    if (!instructorId) { setError('Debes seleccionar un instructor.'); return }
    setError('')
    setSaving(true)

    const payload = {
      title: title.trim(),
      slug: slug.trim() || generateSlug(title.trim()),
      description: description.trim() || null,
      instructor_id: instructorId,
      category_id: categoryId || null,
      cover_image_url: coverImageUrl.trim() || null,
      promo_video_url: promoVideoUrl.trim() || null,
      price: price !== '' ? parseFloat(price) : null,
      duration_hours: durationHours !== '' ? parseInt(durationHours) : null,
      level,
      status,
    }

    if (isEdit) {
      const { error: err } = await supabase.from('courses').update(payload).eq('id', id)
      setSaving(false)
      if (err) { setError(err.message); return }
      navigate('cursos')
    } else {
      const { data, error: err } = await supabase.from('courses').insert(payload).select('id').single()
      setSaving(false)
      if (err) { setError(err.message); return }
      navigate('curso-estructura', { courseId: data.id })
    }
  }

  if (loading) {
    return (
      <DashboardLayout navItems={ADMIN_NAV}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Cargando…</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <style>{`
        .cfp-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .cfp-drop:hover { border-color: var(--jade) !important; background: var(--jade-soft) !important; }
        @keyframes cfpPulse { 0% { transform: translateX(-100%) scaleX(.4); } 100% { transform: translateX(250%) scaleX(.4); } }
        @media (max-width: 768px) { .cfp-pad { padding: 1.25rem 1rem 2rem !important; } .cfp-grid { grid-template-columns: 1fr !important; } }
      `}</style>
      <div className="cfp-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.85rem', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Cursos
          </Link>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>
            {isEdit ? 'Editar curso' : 'Nuevo curso'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 8, padding: '.7rem 1rem', fontSize: '.83rem', marginBottom: '1.25rem', fontFamily: 'var(--sans)' }}>{error}</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }} className="cfp-grid">
            {/* Left column */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.75rem' }}>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>Información básica</h2>

              <Field label="Título *">
                <input className="cfp-inp" type="text" placeholder="Nombre del curso" required value={title} onChange={e => handleTitleChange(e.target.value)} style={INP} onFocus={onFocusInp} onBlur={onBlurInp} />
              </Field>

              <Field label="Slug (URL)" hint="Se genera automáticamente desde el título">
                <input className="cfp-inp" type="text" placeholder="nombre-del-curso" value={slug} onChange={e => handleSlugChange(e.target.value)} style={INP} onFocus={onFocusInp} onBlur={onBlurInp} />
              </Field>

              <Field label="Descripción">
                <textarea className="cfp-inp" placeholder="Descripción del curso…" value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  style={{ ...INP, resize: 'vertical', minHeight: 100, lineHeight: 1.6 }} onFocus={onFocusInp} onBlur={onBlurInp} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                <Field label="Instructor">
                  <select className="cfp-inp" value={instructorId} onChange={e => setInstructorId(e.target.value)} style={SEL} onFocus={onFocusInp} onBlur={onBlurInp}>
                    <option value="">— Sin asignar —</option>
                    {instructors.map(ins => <option key={ins.id} value={ins.id}>{ins.full_name}</option>)}
                  </select>
                </Field>
                <Field label="Categoría">
                  <select className="cfp-inp" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={SEL} onFocus={onFocusInp} onBlur={onBlurInp}>
                    <option value="">— Sin categoría —</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Media */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>Multimedia</h2>
                <Field label="Imagen de portada">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                    onChange={e => { handleImageUpload(e.target.files[0]); e.target.value = '' }} />
                  {imgError && (
                    <div style={{ fontSize: '.75rem', color: '#c0392b', background: '#fef2f0', border: '1px solid #f5c6bb', borderRadius: 6, padding: '.4rem .7rem', marginBottom: '.5rem' }}>{imgError}</div>
                  )}
                  {coverImageUrl ? (
                    <div style={{ position: 'relative' }}>
                      <img src={coverImageUrl} alt="Portada"
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }} />
                      <button type="button" onClick={() => setCoverImageUrl('')}
                        style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', background: 'rgba(23,26,28,.65)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', lineHeight: 1 }}>
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="cfp-drop"
                      onClick={() => !imgUploading && fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--jade)'; e.currentTarget.style.background = 'var(--jade-soft)' }}
                      onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)' }}
                      onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)'; handleImageUpload(e.dataTransfer.files[0]) }}
                      style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '1.75rem 1rem', textAlign: 'center', cursor: imgUploading ? 'wait' : 'pointer', background: 'var(--cream)', transition: 'border-color .2s, background .2s' }}>
                      {imgUploading ? (
                        <>
                          <div style={{ fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.6rem' }}>Subiendo imagen…</div>
                          <div style={{ height: 3, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--jade)', borderRadius: 3, animation: 'cfpPulse 1.2s ease-in-out infinite' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto .6rem', display: 'block' }}>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
                          </svg>
                          <div style={{ fontSize: '.82rem', color: 'var(--carbon)', fontWeight: 500, marginBottom: '.2rem' }}>Arrastra una imagen o haz clic para seleccionar</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>JPG, PNG o WebP · Máx. 5MB</div>
                        </>
                      )}
                    </div>
                  )}
                </Field>
                <Field label="Video promocional (URL)" hint="Acepta links de YouTube o Vimeo">
                  <input className="cfp-inp" type="url" placeholder="https://youtube.com/..." value={promoVideoUrl} onChange={e => setPromoVideoUrl(e.target.value)} style={INP} onFocus={onFocusInp} onBlur={onBlurInp} />
                </Field>
              </div>

              {/* Detalles */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.75rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>Detalles</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                  <Field label="Precio ($)">
                    <input className="cfp-inp" type="number" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} style={INP} onFocus={onFocusInp} onBlur={onBlurInp} />
                  </Field>
                  <Field label="Duración (horas)">
                    <input className="cfp-inp" type="number" min="0" step="1" placeholder="0" value={durationHours} onChange={e => setDurationHours(e.target.value)} style={INP} onFocus={onFocusInp} onBlur={onBlurInp} />
                  </Field>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                  <Field label="Nivel">
                    <select className="cfp-inp" value={level} onChange={e => setLevel(e.target.value)} style={SEL} onFocus={onFocusInp} onBlur={onBlurInp}>
                      <option value="beginner">Básico</option>
                      <option value="intermediate">Intermedio</option>
                      <option value="advanced">Avanzado</option>
                    </select>
                  </Field>
                  <Field label="Estado">
                    <select className="cfp-inp" value={status} onChange={e => setStatus(e.target.value)} style={SEL} onFocus={onFocusInp} onBlur={onBlurInp}>
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="archived">Archivado</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate('cursos')}
              style={{ padding: '.7rem 1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'border-color .2s, color .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--carbon)'; e.currentTarget.style.color = 'var(--carbon)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}>
              Cancelar
            </button>
            {isEdit && (
              <button type="button" onClick={() => navigate('curso-estructura', { courseId: id })}
                style={{ padding: '.7rem 1.5rem', background: 'white', border: '1px solid var(--jade)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, color: 'var(--jade)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background .2s, color .2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--jade-soft)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white' }}>
                Editar estructura
              </button>
            )}
            <button type="submit" disabled={saving}
              style={{ padding: '.7rem 1.75rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .65 : 1, transition: 'background .2s, opacity .2s' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--jade-hover)' }}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--jade)'}>
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
