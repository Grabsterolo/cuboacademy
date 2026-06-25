import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const navItems = [
  { label: 'Panel general', path: '/dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: 'Usuarios', path: '/dashboard/usuarios', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos', path: '/dashboard/cursos', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Categorías', path: '/dashboard/categorias', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: 'Órdenes', path: '/dashboard/ordenes', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
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
]

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState(null)
  const [roleChanging, setRoleChanging] = useState(null)

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
    if (data) setUsers(data)
    setLoading(false)
  }

  async function handleRoleChange(userId, newRole) {
    setRoleChanging(userId)
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
    if (!error) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
    }
    setRoleChanging(null)
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
        .users-table tr:hover td { background: #fafafa; }
        .role-select { padding: .35rem .6rem; font-size: .8rem; border: 1px solid var(--border); border-radius: 6px; background: white; color: var(--carbon); cursor: pointer; font-family: var(--sans); transition: border-color .15s; outline: none; }
        .role-select:focus { border-color: var(--jade); }
        .role-select:disabled { opacity: .5; cursor: not-allowed; }
        .tab-btn { padding: .38rem .9rem; border-radius: 6px; border: none; cursor: pointer; font-size: .82rem; font-weight: 500; font-family: var(--sans); transition: background .15s, color .15s; }
      `}</style>
      <div style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Usuarios</h1>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 340 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Buscar por nombre o correo..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '.6rem .75rem .6rem 2rem', background: 'white', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.855rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: 3, gap: 2 }}>
            {TABS.map(tab => (
              <button key={tab.label} className="tab-btn" onClick={() => setActiveTab(tab.value)}
                style={{ background: activeTab === tab.value ? 'var(--jade-soft)' : 'transparent', color: activeTab === tab.value ? 'var(--jade)' : 'var(--text-2)' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>Cargando usuarios…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)' }}>No se encontraron usuarios.</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--sans)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
                    {['Usuario', 'Correo', 'Rol', 'Registro', 'Acciones'].map(h => (
                      <th key={h} style={{ padding: '.75rem 1.1rem', textAlign: 'left', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                            {(u.full_name || u.email || '?')[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--carbon)' }}>{u.full_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '.85rem 1.1rem' }}>
                        <span style={{ fontSize: '.845rem', color: 'var(--text-2)' }}>{u.email || '—'}</span>
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, letterSpacing: '.04em', ...(ROLE_STYLE[u.role] || ROLE_STYLE.student) }}>
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '.85rem 1.1rem', whiteSpace: 'nowrap' }}>
                        <select className="role-select" value={u.role} disabled={roleChanging === u.id}
                          onChange={e => handleRoleChange(u.id, e.target.value)}>
                          <option value="student">Estudiante</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div style={{ padding: '.65rem 1.1rem', borderTop: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text-2)' }}>
              {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
