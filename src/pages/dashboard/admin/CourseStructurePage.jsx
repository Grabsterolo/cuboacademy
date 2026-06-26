import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const navItems = [
  { label: 'Panel general',  path: '/dashboard',               icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: 'Usuarios',       path: '/dashboard/usuarios',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos',         path: '/dashboard/cursos',        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Categorías',     path: '/dashboard/categorias',    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: 'Órdenes',        path: '/dashboard/ordenes',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Certificados',   path: '/dashboard/certificados',  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { label: 'Reportes',       path: '/dashboard/reportes',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Configuración',  path: '/dashboard/configuracion', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const INP = { width: '100%', padding: '.65rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)', fontSize: '15px', outline: 'none', fontFamily: 'var(--sans)', transition: 'border-color .2s, background .2s', boxSizing: 'border-box' }

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '.9rem' }}>
      <label style={{ display: 'block', fontSize: '.7rem', fontWeight: 600, color: '#9B9894', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>{label}</label>
      {children}
    </div>
  )
}

function SmallBtn({ onClick, danger, children, title }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: danger ? '#DC2626' : 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, minHeight: 26, transition: 'background .15s, color .15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(239,68,68,.09)' : 'var(--jade-soft)'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--jade)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = danger ? '#DC2626' : 'var(--text-2)' }}>
      {children}
    </button>
  )
}

const EDIT_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const DEL_ICON  = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const PLUS_ICON = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>

const MODAL_OVERLAY = {
  position: 'fixed', inset: 0, zIndex: 300,
  background: 'rgba(23,26,28,.5)', backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const MODAL_BOX = {
  background: 'white', border: '1px solid var(--border)', borderRadius: 14,
  padding: '1.75rem', width: '100%', maxWidth: 440,
  boxShadow: '0 24px 60px rgba(23,26,28,.18)', position: 'relative',
}

function nextOrder(items) {
  if (!items.length) return 1
  return Math.max(...items.map(i => i.order_index ?? 0)) + 1
}

export default function CourseStructurePage() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())

  // Module modal
  const [showModModal, setShowModModal] = useState(false)
  const [editingMod, setEditingMod] = useState(null)
  const [modTitle, setModTitle] = useState('')
  const [modDesc, setModDesc] = useState('')
  const [modSaving, setModSaving] = useState(false)
  const [modError, setModError] = useState('')
  const [confirmDelMod, setConfirmDelMod] = useState(null)

  // Lesson modal
  const [showLesModal, setShowLesModal] = useState(false)
  const [editingLes, setEditingLes] = useState(null)
  const [lesModuleId, setLesModuleId] = useState(null)
  const [lesTitle, setLesTitle] = useState('')
  const [lesDesc, setLesDesc] = useState('')
  const [lesVideo, setLesVideo] = useState('')
  const [lesDuration, setLesDuration] = useState('')
  const [lesPreview, setLesPreview] = useState(false)
  const [lesSaving, setLesSaving] = useState(false)
  const [lesError, setLesError] = useState('')
  const [confirmDelLes, setConfirmDelLes] = useState(null)

  useEffect(() => {
    loadAll()
  }, [id])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { closeModModal(); closeLesModal() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: courseData }, { data: modulesData }] = await Promise.all([
      supabase.from('courses').select('id, title').eq('id', id).single(),
      supabase.from('modules')
        .select('*, lessons(*)')
        .eq('course_id', id)
        .order('order_index', { ascending: true })
        .order('order_index', { ascending: true, foreignTable: 'lessons' }),
    ])
    if (courseData) setCourse(courseData)
    if (modulesData) {
      setModules(modulesData.map(m => ({ ...m, lessons: m.lessons || [] })))
      if (modulesData.length > 0) setExpanded(new Set([modulesData[0].id]))
    }
    setLoading(false)
  }

  function toggleExpanded(modId) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(modId)) next.delete(modId)
      else next.add(modId)
      return next
    })
  }

  function onFocus(e) { e.target.style.borderColor = 'var(--jade)'; e.target.style.background = 'white' }
  function onBlur(e)  { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)' }

  // ── Module modal ──
  function openModModal(mod = null) {
    setEditingMod(mod)
    setModTitle(mod?.title || '')
    setModDesc(mod?.description || '')
    setModError('')
    setShowModModal(true)
  }
  function closeModModal() { setShowModModal(false); setEditingMod(null); setModError('') }

  async function handleSaveMod(e) {
    e.preventDefault()
    if (!modTitle.trim()) { setModError('El título es obligatorio.'); return }
    setModSaving(true); setModError('')

    if (editingMod) {
      const { error } = await supabase.from('modules').update({ title: modTitle.trim(), description: modDesc.trim() || null }).eq('id', editingMod.id)
      setModSaving(false)
      if (error) { setModError(error.message); return }
      setModules(ms => ms.map(m => m.id === editingMod.id ? { ...m, title: modTitle.trim(), description: modDesc.trim() || null } : m))
    } else {
      const order_index = nextOrder(modules)
      const { data, error } = await supabase.from('modules')
        .insert({ course_id: id, title: modTitle.trim(), description: modDesc.trim() || null, order_index })
        .select('*')
        .single()
      setModSaving(false)
      if (error) { setModError(error.message); return }
      setModules(ms => [...ms, { ...data, lessons: [] }])
      setExpanded(prev => new Set([...prev, data.id]))
    }
    closeModModal()
  }

  async function handleDeleteMod(modId) {
    setConfirmDelMod(null)
    // Delete lessons first, then module
    await supabase.from('lessons').delete().eq('module_id', modId)
    await supabase.from('modules').delete().eq('id', modId)
    setModules(ms => ms.filter(m => m.id !== modId))
  }

  // ── Lesson modal ──
  function openLesModal(moduleId, les = null) {
    setLesModuleId(moduleId)
    setEditingLes(les)
    setLesTitle(les?.title || '')
    setLesDesc(les?.description || '')
    setLesVideo(les?.video_url || '')
    setLesDuration(les?.duration_minutes != null ? String(les.duration_minutes) : '')
    setLesPreview(les?.is_preview ?? false)
    setLesError('')
    setShowLesModal(true)
  }
  function closeLesModal() { setShowLesModal(false); setEditingLes(null); setLesError('') }

  async function handleSaveLes(e) {
    e.preventDefault()
    if (!lesTitle.trim()) { setLesError('El título es obligatorio.'); return }
    setLesSaving(true); setLesError('')

    const module = modules.find(m => m.id === lesModuleId)

    if (editingLes) {
      const payload = {
        title: lesTitle.trim(),
        description: lesDesc.trim() || null,
        video_url: lesVideo.trim() || null,
        duration_minutes: lesDuration !== '' ? parseInt(lesDuration) : null,
        is_preview: lesPreview,
      }
      const { error } = await supabase.from('lessons').update(payload).eq('id', editingLes.id)
      setLesSaving(false)
      if (error) { setLesError(error.message); return }
      setModules(ms => ms.map(m => m.id === lesModuleId
        ? { ...m, lessons: m.lessons.map(l => l.id === editingLes.id ? { ...l, ...payload } : l) }
        : m
      ))
    } else {
      const order_index = nextOrder(module?.lessons || [])
      const payload = {
        module_id: lesModuleId,
        title: lesTitle.trim(),
        description: lesDesc.trim() || null,
        video_url: lesVideo.trim() || null,
        duration_minutes: lesDuration !== '' ? parseInt(lesDuration) : null,
        is_preview: lesPreview,
        order_index,
      }
      const { data, error } = await supabase.from('lessons').insert(payload).select('*').single()
      setLesSaving(false)
      if (error) { setLesError(error.message); return }
      setModules(ms => ms.map(m => m.id === lesModuleId ? { ...m, lessons: [...m.lessons, data] } : m))
    }
    closeLesModal()
  }

  async function handleDeleteLes(moduleId, lesId) {
    setConfirmDelLes(null)
    await supabase.from('lessons').delete().eq('id', lesId)
    setModules(ms => ms.map(m => m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lesId) } : m))
  }

  return (
    <DashboardLayout navItems={navItems}>
      <style>{`
        .csp-mod-card { background: white; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 1rem; }
        .csp-mod-header { display: flex; align-items: center; gap: .75rem; padding: 1rem 1.25rem; cursor: pointer; user-select: none; -webkit-user-select: none; }
        .csp-mod-header:hover { background: var(--cream); }
        .csp-les-row { display: flex; align-items: center; gap: .75rem; padding: .7rem 1.25rem .7rem 3rem; border-top: 1px solid var(--border); }
        .csp-les-row:hover { background: #fafafa; }
        .csp-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .toggle-track-csp { position: relative; display: inline-block; width: 38px; height: 20px; flex-shrink: 0; }
        .toggle-track-csp input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider-csp { position: absolute; inset: 0; background: var(--border); border-radius: 20px; cursor: pointer; transition: background .2s; }
        .toggle-slider-csp::after { content: ''; position: absolute; left: 3px; top: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .toggle-track-csp input:checked + .toggle-slider-csp { background: var(--jade); }
        .toggle-track-csp input:checked + .toggle-slider-csp::after { transform: translateX(18px); }
        @media (max-width: 768px) { .csp-pad { padding: 1.25rem 1rem 2rem !important; } }
      `}</style>

      <div className="csp-pad" style={{ padding: '2.5rem 2.5rem 3rem', maxWidth: 820 }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/dashboard/cursos" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.85rem', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Cursos
          </Link>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estructura del curso</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2 }}>
            {loading ? '…' : course?.title || 'Curso'}
          </h1>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>Cargando estructura…</div>
        ) : (
          <>
            {/* Modules list */}
            {modules.length === 0 && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '3rem 2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem' }}>Sin módulos todavía</p>
                <p style={{ fontSize: '.82rem', color: 'var(--text-2)', marginBottom: 0 }}>Agrega el primer módulo para empezar a estructurar el contenido.</p>
              </div>
            )}

            {modules.map((mod, mi) => {
              const isOpen = expanded.has(mod.id)
              return (
                <div key={mod.id} className="csp-mod-card">
                  {/* Module header */}
                  <div className="csp-mod-header" onClick={() => toggleExpanded(mod.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', flexShrink: 0 }}>
                      <span style={{ fontSize: '.7rem', fontWeight: 700, color: 'var(--jade)' }}>{mi + 1}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--carbon)', lineHeight: 1.3 }}>{mod.title}</div>
                      {mod.description && <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.15rem' }}>{mod.description}</div>}
                    </div>
                    <span style={{ fontSize: '.73rem', color: 'var(--text-2)', whiteSpace: 'nowrap', marginRight: '.25rem' }}>
                      {mod.lessons.length} {mod.lessons.length === 1 ? 'lección' : 'lecciones'}
                    </span>
                    {/* Chevron */}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                    {/* Module actions */}
                    <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                      <SmallBtn title="Editar módulo" onClick={() => openModModal(mod)}>{EDIT_ICON}</SmallBtn>
                      {confirmDelMod === mod.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button onClick={() => handleDeleteMod(mod.id)} style={{ fontSize: '.7rem', fontWeight: 700, color: '#DC2626', background: 'rgba(239,68,68,.09)', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Sí</button>
                          <button onClick={() => setConfirmDelMod(null)} style={{ fontSize: '.7rem', color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>No</button>
                        </div>
                      ) : (
                        <SmallBtn title="Eliminar módulo" danger onClick={() => setConfirmDelMod(mod.id)}>{DEL_ICON}</SmallBtn>
                      )}
                    </div>
                  </div>

                  {/* Lessons */}
                  {isOpen && (
                    <>
                      {mod.lessons.map((les, li) => (
                        <div key={les.id} className="csp-les-row">
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--cream)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: '.62rem', fontWeight: 600, color: 'var(--text-2)' }}>{li + 1}</span>
                          </div>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="var(--jade)" stroke="none"/>
                          </svg>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.845rem', fontWeight: 500, color: 'var(--carbon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{les.title}</div>
                            <div style={{ display: 'flex', gap: '.75rem', marginTop: '.15rem' }}>
                              {les.duration_minutes != null && (
                                <span style={{ fontSize: '.68rem', color: 'var(--text-2)' }}>{les.duration_minutes} min</span>
                              )}
                              {les.is_preview && (
                                <span style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', padding: '1px 6px', borderRadius: 10 }}>Preview</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            <SmallBtn title="Editar lección" onClick={() => openLesModal(mod.id, les)}>{EDIT_ICON}</SmallBtn>
                            {confirmDelLes === les.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <button onClick={() => handleDeleteLes(mod.id, les.id)} style={{ fontSize: '.7rem', fontWeight: 700, color: '#DC2626', background: 'rgba(239,68,68,.09)', border: 'none', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Sí</button>
                                <button onClick={() => setConfirmDelLes(null)} style={{ fontSize: '.7rem', color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)' }}>No</button>
                              </div>
                            ) : (
                              <SmallBtn title="Eliminar lección" danger onClick={() => setConfirmDelLes(les.id)}>{DEL_ICON}</SmallBtn>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add lesson row */}
                      <div style={{ padding: '.6rem 1.25rem .6rem 3rem', borderTop: '1px solid var(--border)' }}>
                        <button onClick={() => openLesModal(mod.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.78rem', fontWeight: 600, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', borderRadius: 6, padding: '.35rem .75rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'background .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-light)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--jade-soft)'}>
                          {PLUS_ICON} Agregar lección
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}

            {/* Add module button */}
            <button onClick={() => openModModal()}
              style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.7rem 1.25rem', background: 'white', border: '1px dashed var(--jade)', borderRadius: 10, width: '100%', cursor: 'pointer', color: 'var(--jade)', fontFamily: 'var(--sans)', fontSize: '.875rem', fontWeight: 600, transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--jade-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              {PLUS_ICON} Agregar módulo
            </button>
          </>
        )}
      </div>

      {/* ── Module modal ── */}
      {showModModal && (
        <div style={MODAL_OVERLAY} onClick={e => { if (e.target === e.currentTarget) closeModModal() }}>
          <div style={MODAL_BOX}>
            <button onClick={closeModModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>
              {editingMod ? 'Editar módulo' : 'Nuevo módulo'}
            </h2>
            <form onSubmit={handleSaveMod}>
              {modError && <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.55rem .85rem', fontSize: '.78rem', marginBottom: '.85rem' }}>{modError}</div>}
              <Field label="Título *">
                <input className="csp-inp" type="text" placeholder="Título del módulo" required value={modTitle} onChange={e => setModTitle(e.target.value)} style={INP} onFocus={onFocus} onBlur={onBlur} autoFocus />
              </Field>
              <Field label="Descripción">
                <textarea className="csp-inp" placeholder="Descripción breve (opcional)" value={modDesc} onChange={e => setModDesc(e.target.value)} rows={3}
                  style={{ ...INP, resize: 'vertical' }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <button type="submit" disabled={modSaving}
                style={{ width: '100%', padding: '.8rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 700, cursor: modSaving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: modSaving ? .65 : 1, marginTop: '.25rem' }}>
                {modSaving ? 'Guardando…' : editingMod ? 'Guardar cambios' : 'Crear módulo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Lesson modal ── */}
      {showLesModal && (
        <div style={MODAL_OVERLAY} onClick={e => { if (e.target === e.currentTarget) closeLesModal() }}>
          <div style={{ ...MODAL_BOX, maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={closeLesModal} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 5, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>
              {editingLes ? 'Editar lección' : 'Nueva lección'}
            </h2>
            <form onSubmit={handleSaveLes}>
              {lesError && <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.55rem .85rem', fontSize: '.78rem', marginBottom: '.85rem' }}>{lesError}</div>}
              <Field label="Título *">
                <input className="csp-inp" type="text" placeholder="Título de la lección" required value={lesTitle} onChange={e => setLesTitle(e.target.value)} style={INP} onFocus={onFocus} onBlur={onBlur} autoFocus />
              </Field>
              <Field label="Descripción">
                <textarea className="csp-inp" placeholder="Descripción breve (opcional)" value={lesDesc} onChange={e => setLesDesc(e.target.value)} rows={2}
                  style={{ ...INP, resize: 'vertical' }} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="URL del video">
                <input className="csp-inp" type="url" placeholder="https://vimeo.com/... o https://youtube.com/..." value={lesVideo} onChange={e => setLesVideo(e.target.value)} style={INP} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              <Field label="Duración (minutos)">
                <input className="csp-inp" type="number" min="0" step="1" placeholder="0" value={lesDuration} onChange={e => setLesDuration(e.target.value)} style={INP} onFocus={onFocus} onBlur={onBlur} />
              </Field>
              {/* Preview toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.7rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, marginBottom: '.9rem' }}>
                <div>
                  <div style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>Preview gratuito</div>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-2)', marginTop: '.1rem' }}>Visible sin estar matriculado</div>
                </div>
                <label className="toggle-track-csp">
                  <input type="checkbox" checked={lesPreview} onChange={e => setLesPreview(e.target.checked)} />
                  <span className="toggle-slider-csp" />
                </label>
              </div>
              <button type="submit" disabled={lesSaving}
                style={{ width: '100%', padding: '.8rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.9rem', fontWeight: 700, cursor: lesSaving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: lesSaving ? .65 : 1 }}>
                {lesSaving ? 'Guardando…' : editingLes ? 'Guardar cambios' : 'Crear lección'}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
