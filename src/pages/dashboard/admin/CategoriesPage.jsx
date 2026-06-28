import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { FieldLabel as LabelField } from '../../../components/ui'
import { ADMIN_NAV } from '../../../config/navigation'

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  // Create / edit modal
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { closeModal(); setDeleteTarget(null) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('id, name, description, slug, created_at')
      .order('name', { ascending: true })
    if (data) setCategories(data)
    setLoading(false)
  }

  function openCreate() {
    setEditTarget(null)
    setFormName('')
    setFormDesc('')
    setFormSlug('')
    setSlugManual(false)
    setFormError('')
    setFormSuccess(false)
    setShowModal(true)
  }

  function openEdit(cat) {
    setEditTarget(cat)
    setFormName(cat.name)
    setFormDesc(cat.description || '')
    setFormSlug(cat.slug || '')
    setSlugManual(true)
    setFormError('')
    setFormSuccess(false)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditTarget(null)
    setFormError('')
    setFormSuccess(false)
    setSlugManual(false)
  }

  function handleNameChange(val) {
    setFormName(val)
    if (!slugManual) setFormSlug(slugify(val))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (editTarget) {
      const { error } = await supabase
        .from('categories')
        .update({ name: formName.trim(), description: formDesc.trim(), slug: formSlug.trim() })
        .eq('id', editTarget.id)
      if (error) { setFormError(error?.message || 'Error al actualizar.'); setFormLoading(false); return }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({ name: formName.trim(), description: formDesc.trim(), slug: formSlug.trim() })
      if (error) { setFormError(error?.message || 'Error al crear.'); setFormLoading(false); return }
    }

    setFormLoading(false)
    setFormSuccess(true)
    setTimeout(() => { closeModal(); loadCategories() }, 1200)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    await supabase.from('categories').delete().eq('id', deleteTarget.id)
    setDeleteLoading(false)
    setDeleteTarget(null)
    loadCategories()
  }

  return (
    <DashboardLayout navItems={ADMIN_NAV}>
      <style>{`
        .cat-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.4rem 1.5rem; display: flex; flex-direction: column; gap: .65rem; transition: box-shadow .18s; }
        .cat-card:hover { box-shadow: 0 4px 18px rgba(23,26,28,.07); }
        .cat-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: var(--text-2); display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; min-width: 28px; min-height: 28px; }
        .cat-icon-btn:hover { background: var(--cream); color: var(--carbon); }
        .cat-icon-btn.delete:hover { background: #fef2f0; color: #c0392b; }
        .btn-create-cat { display: flex; align-items: center; gap: .4rem; padding: .5rem 1.1rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .855rem; font-weight: 600; font-family: var(--sans); cursor: pointer; transition: background .2s; -webkit-tap-highlight-color: transparent; }
        .btn-create-cat:hover { background: var(--jade-hover); }
        .form-inp-c { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); box-sizing: border-box; }
        .form-inp-c:focus { border-color: var(--jade); background: white; }
        .form-area-c { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; resize: vertical; min-height: 80px; font-family: var(--sans); transition: border-color .2s, background .2s; box-sizing: border-box; }
        .form-area-c:focus { border-color: var(--jade); background: white; }
        .btn-submit-c { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: background .2s, opacity .2s; margin-top: .25rem; }
        .btn-submit-c:hover { background: var(--jade-hover); }
        .btn-submit-c:disabled { opacity: .6; cursor: not-allowed; }
        .cat-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(23,26,28,.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        @media (max-width: 768px) {
          .cat-pad { padding: 1.25rem 1rem 2rem !important; }
          .cat-header { flex-direction: column !important; align-items: flex-start !important; }
          .cat-grid { grid-template-columns: 1fr; }
          .cat-modal { padding: 1.5rem 1.25rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="cat-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div className="cat-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Categorías</h1>
          </div>
          <button className="btn-create-cat" onClick={openCreate}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva categoría
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>Cargando categorías…</div>
        ) : categories.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 440 }}>
            <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>Sin categorías</h2>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.4rem', fontWeight: 300 }}>Crea la primera categoría para organizar el catálogo de cursos.</p>
            <button className="btn-create-cat" onClick={openCreate} style={{ margin: '0 auto' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nueva categoría
            </button>
          </div>
        ) : (
          <>
            <div className="cat-grid">
              {categories.map(cat => (
                <div key={cat.id} className="cat-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '.5rem' }}>
                    <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.3, flex: 1 }}>{cat.name}</h3>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button className="cat-icon-btn" onClick={() => openEdit(cat)} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className="cat-icon-btn delete" onClick={() => setDeleteTarget(cat)} title="Eliminar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {cat.description && (
                    <p style={{ fontSize: '.83rem', color: 'var(--text-2)', lineHeight: 1.6, fontWeight: 300 }}>{cat.description}</p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '.25rem', flexWrap: 'wrap', gap: '.4rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '.72rem', background: 'var(--cream)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 5, padding: '2px 8px' }}>
                      /{cat.slug}
                    </span>
                    <span style={{ fontSize: '.72rem', color: '#B5B2AB' }}>
                      {cat.created_at ? new Date(cat.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '.75rem', color: 'var(--text-2)' }}>
              {categories.length} categoría{categories.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* Create / edit modal */}
      {showModal && (
        <div className="cat-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="cat-modal" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 6, borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.6rem' }}>
              {editTarget ? 'Editar categoría' : 'Nueva categoría'}
            </h2>

            {formSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)' }}>
                  {editTarget ? 'Categoría actualizada' : 'Categoría creada'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {formError && (
                  <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.6rem .9rem', fontSize: '.8rem', marginBottom: '.9rem' }}>
                    {formError}
                  </div>
                )}
                <div style={{ marginBottom: '.85rem' }}>
                  <LabelField>Nombre</LabelField>
                  <input
                    type="text"
                    className="form-inp-c"
                    placeholder="Ej: Marketing Digital"
                    required
                    value={formName}
                    onChange={e => handleNameChange(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '.85rem' }}>
                  <LabelField>Slug</LabelField>
                  <input
                    type="text"
                    className="form-inp-c"
                    placeholder="marketing-digital"
                    required
                    value={formSlug}
                    onChange={e => { setSlugManual(true); setFormSlug(e.target.value) }}
                  />
                  <span style={{ fontSize: '.7rem', color: 'var(--text-2)', marginTop: '.3rem', display: 'block' }}>
                    Se genera automáticamente. Puedes editarlo manualmente.
                  </span>
                </div>
                <div style={{ marginBottom: '1.1rem' }}>
                  <LabelField>Descripción <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></LabelField>
                  <textarea
                    className="form-area-c"
                    placeholder="Breve descripción de la categoría…"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-submit-c" disabled={formLoading}>
                  {formLoading
                    ? (editTarget ? 'Guardando…' : 'Creando…')
                    : (editTarget ? 'Guardar cambios' : 'Crear categoría')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="cat-overlay" onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem 2.25rem', width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(23,26,28,.18)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, background: '#fef2f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c0392b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.45rem' }}>¿Eliminar categoría?</h3>
            <p style={{ fontSize: '.84rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1.5rem', fontWeight: 300 }}>
              Vas a eliminar <strong style={{ color: 'var(--carbon)', fontWeight: 600 }}>{deleteTarget.name}</strong>. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '.75rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ flex: 1, padding: '.75rem', background: '#e74c3c', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'var(--sans)', opacity: deleteLoading ? .6 : 1 }}
              >
                {deleteLoading ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
