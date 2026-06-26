import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const navItems = [
  { label: 'Panel general', path: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: 'Usuarios', path: '/dashboard/usuarios', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos', path: '/dashboard/cursos', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Categorías', path: '/dashboard/categorias', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: 'Órdenes', path: '/dashboard/ordenes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Certificados', path: '/dashboard/certificados', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { label: 'Reportes', path: '/dashboard/reportes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Configuración', path: '/dashboard/configuracion', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const ROLE_LABELS = { admin: 'Admin', instructor: 'Instructor', student: 'Estudiante' }
const ROLE_STYLE = {
  admin:      { background: 'rgba(22,125,120,.12)',  color: 'var(--jade)',   border: '1px solid rgba(22,125,120,.25)' },
  instructor: { background: 'rgba(59,130,246,.1)',   color: '#3B7EF6',       border: '1px solid rgba(59,130,246,.25)' },
  student:    { background: 'rgba(113,128,126,.1)',  color: 'var(--text-2)', border: '1px solid rgba(113,128,126,.2)' },
}
const TABS = [
  { label: 'Todos',        value: null },
  { label: 'Estudiantes',  value: 'student' },
  { label: 'Instructores', value: 'instructor' },
  { label: 'Admins',       value: 'admin' },
]

function LabelField({ children }) {
  return (
    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.4rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>
      {children}
    </label>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(null)
  const [toast, setToast] = useState('')

  // Create modal
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('student')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState(false)

  // Edit modal
  const [editTarget, setEditTarget] = useState(null)
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState('student')
  const [editActive, setEditActive] = useState(true)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { closeCreate(); closeEdit() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('users_view')
      .select('id, full_name, email, role, created_at, is_active')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // ── Create user ──
  function closeCreate() {
    setShowCreate(false)
    setCreateError('')
    setCreateSuccess(false)
    setNewName('')
    setNewEmail('')
    setNewPassword('')
    setNewRole('student')
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    if (newPassword.length < 8) { setCreateError('La contraseña debe tener al menos 8 caracteres.'); return }
    setCreateError('')
    setCreateLoading(true)

    const { data: { session: adminSession } } = await supabase.auth.getSession()

    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { emailRedirectTo: null, data: { full_name: newName, role: newRole } },
    })

    if (error) {
      if (adminSession) await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token })
      setCreateError(error?.message || 'Error al crear el usuario.')
      setCreateLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').update({ role: newRole, full_name: newName }).eq('id', data.user.id)
    }

    if (adminSession) {
      await supabase.auth.setSession({ access_token: adminSession.access_token, refresh_token: adminSession.refresh_token })
    }

    setCreateLoading(false)
    setCreateSuccess(true)
    setTimeout(() => { closeCreate(); loadUsers() }, 1400)
  }

  // ── Edit user ──
  function openEdit(u) {
    setEditTarget(u)
    setEditName(u.full_name || '')
    setEditRole(u.role || 'student')
    setEditActive(u.is_active !== false)
    setEditError('')
  }

  function closeEdit() {
    setEditTarget(null)
    setEditError('')
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    if (!editTarget) return
    setEditLoading(true)
    setEditError('')

    const prev = users.find(u => u.id === editTarget.id)
    setUsers(us => us.map(u => u.id === editTarget.id
      ? { ...u, full_name: editName, role: editRole, is_active: editActive }
      : u
    ))

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: editName, role: editRole, is_active: editActive })
      .eq('id', editTarget.id)

    setEditLoading(false)

    if (error) {
      setUsers(us => us.map(u => u.id === editTarget.id ? prev : u))
      setEditError(error?.message || 'Error al guardar.')
      return
    }

    showToast('Usuario actualizado correctamente.')
    closeEdit()
  }

  const filtered = users.filter(u => {
    const matchesTab = !activeTab || u.role === activeTab
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    return matchesTab && matchesSearch
  })

  return (
    <DashboardLayout navItems={navItems}>
      <style>{`
        .tab-btn { padding: .38rem .9rem; border-radius: 6px; border: none; cursor: pointer; font-size: .82rem; font-weight: 500; font-family: var(--sans); transition: background .15s, color .15s; }
        .form-inp-u { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; transition: border-color .2s, background .2s; font-family: var(--sans); }
        .form-inp-u:focus { border-color: var(--jade); background: white; }
        .form-sel-u { width: 100%; padding: .7rem .95rem; background: var(--cream); border: 1px solid var(--border); border-radius: 7px; color: var(--carbon); font-size: 16px; outline: none; cursor: pointer; font-family: var(--sans); transition: border-color .2s; }
        .form-sel-u:focus { border-color: var(--jade); }
        .btn-create { display: flex; align-items: center; gap: .4rem; padding: .5rem 1.1rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .855rem; font-weight: 600; font-family: var(--sans); cursor: pointer; transition: background .2s; -webkit-tap-highlight-color: transparent; }
        .btn-create:hover { background: var(--jade-hover); }
        .btn-submit-u { width: 100%; padding: .875rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .93rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: background .2s, opacity .2s; margin-top: .25rem; }
        .btn-submit-u:hover { background: var(--jade-hover); }
        .btn-submit-u:disabled { opacity: .6; cursor: not-allowed; }
        .users-overlay { position: fixed; inset: 0; z-index: 300; background: rgba(23,26,28,.5); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .icon-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: var(--text-2); display: flex; align-items: center; justify-content: center; transition: background .15s, color .15s; min-width: 30px; min-height: 30px; }
        .icon-btn:hover { background: var(--jade-soft); color: var(--jade); }
        .toggle-track-u { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle-track-u input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider-u { position: absolute; inset: 0; background: var(--border); border-radius: 22px; cursor: pointer; transition: background .2s; }
        .toggle-slider-u::after { content: ''; position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .toggle-track-u input:checked + .toggle-slider-u { background: var(--jade); }
        .toggle-track-u input:checked + .toggle-slider-u::after { transform: translateX(18px); }
        .users-toast { position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%); background: var(--carbon); color: white; padding: .65rem 1.25rem; border-radius: 8px; font-size: .84rem; font-family: var(--sans); font-weight: 500; z-index: 400; white-space: nowrap; box-shadow: 0 4px 20px rgba(23,26,28,.2); pointer-events: none; }
        @media (max-width: 768px) {
          .users-pad { padding: 1.25rem 1rem 2rem !important; }
          .users-header { flex-direction: column !important; align-items: flex-start !important; }
          .users-toolbar { flex-direction: column !important; align-items: stretch !important; }
          .users-search { max-width: 100% !important; flex: none !important; }
          .users-tabs { overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .users-tabs::-webkit-scrollbar { display: none; }
          .tab-btn { white-space: nowrap; }
          .users-modal { padding: 1.5rem 1.25rem !important; border-radius: 12px !important; }
        }
      `}</style>

      <div className="users-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div className="users-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Usuarios</h1>
          </div>
          <button className="btn-create" onClick={() => setShowCreate(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nuevo usuario
          </button>
        </div>

        {/* Toolbar */}
        <div className="users-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="users-search" style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por nombre o correo..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.6rem .75rem .6rem 2rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <div className="users-tabs" style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.label} className="tab-btn" onClick={() => setActiveTab(tab.value)}
                style={{ background: activeTab === tab.value ? 'var(--jade-soft)' : 'transparent', color: activeTab === tab.value ? 'var(--jade)' : 'var(--text-2)' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', height: 68, opacity: 1 - i * 0.15 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>No se encontraron usuarios.</div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {filtered.map(u => {
                const roleStyle = ROLE_STYLE[u.role] || ROLE_STYLE.student
                const isActive = u.is_active !== false
                return (
                  <div key={u.id}
                    style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'box-shadow .18s' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 18px rgba(23,26,28,.07)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: isActive ? 'var(--jade)' : '#C8C5BF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {(u.full_name || u.email || '?')[0].toUpperCase()}
                    </div>

                    {/* Name + email */}
                    <div style={{ flex: '0 0 220px', minWidth: 0 }}>
                      <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.full_name || '—'}</div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{u.email || '—'}</div>
                    </div>

                    {/* Divider */}
                    <div style={{ width: 1, height: 32, background: 'var(--border)', flexShrink: 0 }} />

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flex: '0 0 auto' }}>
                      <span style={{ fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...roleStyle }}>{ROLE_LABELS[u.role] || u.role}</span>
                      {isActive ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(22,125,120,.1)', color: 'var(--jade)', border: '1px solid rgba(22,125,120,.22)' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--jade)', display: 'inline-block' }} />Activo
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(113,128,126,.1)', color: 'var(--text-2)', border: '1px solid rgba(113,128,126,.2)' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C8C5BF', display: 'inline-block' }} />Inactivo
                        </span>
                      )}
                    </div>

                    {/* Date — pushed to the right */}
                    <div style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#B5B2AB', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>

                    {/* Edit button */}
                    <button className="icon-btn" onClick={() => openEdit(u)} title="Editar usuario" style={{ flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '1rem', fontSize: '.75rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>

      {/* ── Modal: crear usuario ── */}
      {showCreate && (
        <div className="users-overlay" onClick={e => { if (e.target === e.currentTarget) closeCreate() }}>
          <div className="users-modal" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)' }}>
            <button onClick={closeCreate} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 6, borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.6rem' }}>Crear usuario</h2>
            {createSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)' }}>Usuario creado correctamente</p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser}>
                {createError && (
                  <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.6rem .9rem', fontSize: '.8rem', marginBottom: '.9rem' }}>{createError}</div>
                )}
                <div style={{ marginBottom: '.85rem' }}>
                  <LabelField>Nombre completo</LabelField>
                  <input type="text" className="form-inp-u" placeholder="Nombre del usuario" required value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.85rem' }}>
                  <LabelField>Correo electrónico</LabelField>
                  <input type="email" className="form-inp-u" placeholder="correo@ejemplo.com" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                </div>
                <div style={{ marginBottom: '.85rem' }}>
                  <LabelField>Contraseña</LabelField>
                  <input type="password" className="form-inp-u" placeholder="Mínimo 8 caracteres" required minLength={8} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div style={{ marginBottom: '1.1rem' }}>
                  <LabelField>Rol</LabelField>
                  <select className="form-sel-u" value={newRole} onChange={e => setNewRole(e.target.value)}>
                    <option value="student">Estudiante</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit-u" disabled={createLoading}>
                  {createLoading ? 'Creando usuario…' : 'Crear usuario'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: editar usuario ── */}
      {editTarget && (
        <div className="users-overlay" onClick={e => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className="users-modal" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem', width: '100%', maxWidth: 420, position: 'relative', boxShadow: '0 24px 60px rgba(23,26,28,.18)' }}>
            <button onClick={closeEdit} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-2)', cursor: 'pointer', padding: 6, borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.6rem' }}>Editar usuario</h2>

            <form onSubmit={handleSaveEdit}>
              {editError && (
                <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.6rem .9rem', fontSize: '.8rem', marginBottom: '.9rem' }}>{editError}</div>
              )}

              {/* Correo — solo lectura */}
              <div style={{ marginBottom: '.85rem', padding: '.65rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7 }}>
                <div style={{ fontSize: '.68rem', fontWeight: 600, color: '#B5B2AB', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: '.2rem' }}>Correo</div>
                <div style={{ fontSize: '.9rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>{editTarget.email}</div>
              </div>

              <div style={{ marginBottom: '.85rem' }}>
                <LabelField>Nombre completo</LabelField>
                <input type="text" className="form-inp-u" placeholder="Nombre del usuario" required value={editName} onChange={e => setEditName(e.target.value)} />
              </div>

              <div style={{ marginBottom: '.85rem' }}>
                <LabelField>Rol</LabelField>
                <select className="form-sel-u" value={editRole} onChange={e => setEditRole(e.target.value)}>
                  <option value="student">Estudiante</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.75rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7 }}>
                  <div>
                    <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>Usuario activo</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.1rem' }}>Puede iniciar sesión en la plataforma</div>
                  </div>
                  <label className="toggle-track-u">
                    <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                    <span className="toggle-slider-u" />
                  </label>
                </div>
              </div>

              <button type="submit" className="btn-submit-u" disabled={editLoading}>
                {editLoading ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="users-toast">{toast}</div>}
    </DashboardLayout>
  )
}
