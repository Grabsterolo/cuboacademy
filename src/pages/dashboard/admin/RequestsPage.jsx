import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ModalOverlay, ConfirmModal, Badge, Toast } from '../../../components/ui/index'
import { supabase } from '../../../lib/supabase'

const EXP_LABEL = { 2: '1-2 años', 5: '3-5 años', 10: '6-10 años', 15: '10+ años' }
const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

const STATUS_BADGE = {
  pending:  { label: 'Pendiente', bg: '#FFF9E6', color: '#B45309', border: '1px solid #FBBF24' },
  approved: { label: 'Aprobado',  bg: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' },
  rejected: { label: 'Rechazado', bg: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.75rem', paddingBottom: '.4rem', borderBottom: '1px solid var(--border)' }}>{title}</div>
      {children}
    </div>
  )
}

function DRow({ label, value, isLink }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem', fontSize: '.84rem' }}>
      <span style={{ color: '#9B9894', flexShrink: 0, width: 140 }}>{label}:</span>
      {isLink
        ? <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--jade)', wordBreak: 'break-all' }}>{value}</a>
        : <span style={{ color: 'var(--carbon)', fontWeight: 400, wordBreak: 'break-word' }}>{value}</span>
      }
    </div>
  )
}

function CvRow({ path }) {
  const [loading, setLoading] = useState(false)
  if (!path) return null

  async function openCv() {
    setLoading(true)
    const { data, error } = await supabase.storage.from('instructor-documents').createSignedUrl(path, 60 * 5)
    setLoading(false)
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', gap: '.5rem', marginBottom: '.5rem', fontSize: '.84rem', alignItems: 'center' }}>
      <span style={{ color: '#9B9894', flexShrink: 0, width: 140 }}>CV / Documento:</span>
      <button onClick={openCv} disabled={loading}
        style={{ background: 'none', border: '1px solid var(--jade-light)', color: 'var(--jade)', borderRadius: 6, padding: '.3rem .7rem', fontSize: '.8rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}>
        {loading ? 'Abriendo…' : 'Ver documento PDF'}
      </button>
    </div>
  )
}

export default function RequestsPage() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmReject, setConfirmReject] = useState(false)
  const [toast, setToast] = useState('')
  const [categories, setCategories] = useState({})

  useEffect(() => {
    loadData()
    supabase.from('categories').select('id, name').then(({ data }) => {
      if (data) setCategories(Object.fromEntries(data.map(c => [c.id, c.name])))
    })
  }, [])

  async function loadData() {
    setLoading(true)
    const { data } = await supabase
      .from('instructor_applications')
      .select('*')
      .order('created_at', { ascending: false })
    setApps(data || [])
    setLoading(false)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleApprove() {
    if (!selected) return
    setActionLoading(true)
    const { error } = await supabase
      .from('instructor_applications')
      .update({ status: 'approved', reviewer_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq('id', selected.id)
    setActionLoading(false)
    if (error) { showToast('Error al aprobar.'); return }
    showToast('Solicitud aprobada. Crea el usuario instructor desde la sección Usuarios.')
    setSelected(null)
    setNotes('')
    loadData()
  }

  async function handleReject() {
    if (!selected) return
    setActionLoading(true)
    const { error } = await supabase
      .from('instructor_applications')
      .update({ status: 'rejected', reviewer_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq('id', selected.id)
    setActionLoading(false)
    if (error) { showToast('Error al rechazar.'); return }
    setConfirmReject(false)
    showToast('Solicitud rechazada.')
    setSelected(null)
    setNotes('')
    loadData()
  }

  const TABS = [
    { key: 'all', label: 'Todas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'approved', label: 'Aprobadas' },
    { key: 'rejected', label: 'Rechazadas' },
  ]

  const filtered = apps.filter(a => {
    if (tab !== 'all' && a.status !== tab) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const name = `${a.full_name} ${a.last_name}`.toLowerCase()
      return name.includes(q) || (a.email || '').toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    all: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  }

  return (
    <DashboardLayout>
      <style>{`
        .rq-tab { padding: .45rem 1rem; border: 1px solid transparent; border-radius: 7px; font-size: .82rem; font-weight: 500; cursor: pointer; transition: background .15s, color .15s, border-color .15s; background: transparent; color: var(--text-2); font-family: var(--sans); }
        .rq-tab:hover { background: var(--cream); }
        .rq-tab.active { background: var(--jade-soft); color: var(--jade-dark); border-color: var(--jade-light); font-weight: 600; }
        .rq-row { display: flex; align-items: center; gap: 1rem; padding: .85rem 1rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: background .15s; }
        .rq-row:last-child { border-bottom: none; }
        .rq-row:hover { background: var(--cream); }
        .rq-srch { width: 100%; padding: .6rem .9rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; color: var(--carbon); font-size: .875rem; outline: none; font-family: var(--sans); }
        .rq-srch:focus { border-color: var(--jade); background: white; }
        @media (max-width: 768px) { .rq-row-meta { display: none !important; } .rq-pad { padding: 1.25rem 1rem 2rem !important; } }
      `}</style>

      <div className="rq-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Gestión</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Solicitudes de instructor</h1>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
          <div style={{ position: 'relative', maxWidth: 340 }}>
            <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="rq-srch" placeholder="Buscar por nombre o email…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: '2.1rem', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '.35rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.key} className={`rq-tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label} {counts[t.key] > 0 && <span style={{ fontSize: '.7rem', fontWeight: 500, opacity: .7 }}>({counts[t.key]})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.6rem 1rem', background: 'var(--cream)', borderBottom: '1px solid var(--border)', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', letterSpacing: '.05em', textTransform: 'uppercase' }}>
            <span style={{ flex: '0 0 36px' }}></span>
            <span style={{ flex: '1 1 200px', minWidth: 0 }}>Nombre</span>
            <span style={{ flex: '1 1 180px', minWidth: 0 }} className="rq-row-meta">Email</span>
            <span style={{ flex: '1 1 180px', minWidth: 0 }} className="rq-row-meta">Profesión</span>
            <span style={{ flex: '0 0 110px' }} className="rq-row-meta">Fecha</span>
            <span style={{ flex: '0 0 100px' }}>Estado</span>
          </div>

          {loading && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.875rem', fontFamily: 'var(--sans)' }}>Cargando…</div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.875rem', fontFamily: 'var(--sans)' }}>No hay solicitudes en esta categoría.</div>
          )}

          {filtered.map(a => {
            const sb = STATUS_BADGE[a.status] || STATUS_BADGE.pending
            const initials = `${a.full_name?.[0] || ''}${a.last_name?.[0] || ''}`.toUpperCase()
            return (
              <div key={a.id} className="rq-row" onClick={() => { setSelected(a); setNotes(a.reviewer_notes || '') }}>
                <div style={{ flex: '0 0 36px', width: 36, height: 36, borderRadius: '50%', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: 'var(--jade)', flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.full_name} {a.last_name}</div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-2)' }}>{a.country}</div>
                </div>
                <span style={{ flex: '1 1 180px', minWidth: 0, fontSize: '.82rem', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="rq-row-meta">{a.email}</span>
                <span style={{ flex: '1 1 180px', minWidth: 0, fontSize: '.82rem', color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} className="rq-row-meta">{a.profession} · {a.specialty}</span>
                <span style={{ flex: '0 0 110px', fontSize: '.78rem', color: 'var(--text-2)' }} className="rq-row-meta">{fmt(a.created_at)}</span>
                <span style={{ flex: '0 0 100px' }}>
                  <Badge {...sb} />
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <ModalOverlay onClose={() => { setSelected(null); setNotes('') }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(23,26,28,.2)' }}>
            {/* Modal header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{selected.full_name} {selected.last_name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.2rem' }}>
                  <Badge {...(STATUS_BADGE[selected.status] || STATUS_BADGE.pending)} />
                  <span style={{ fontSize: '.75rem', color: 'var(--text-2)' }}>Recibida {fmt(selected.created_at)}</span>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setNotes('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, color: 'var(--text-2)', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', padding: '1.5rem', flex: 1 }}>
              <Section title="Información personal">
                <DRow label="Nombre completo" value={`${selected.full_name} ${selected.last_name}`} />
                <DRow label="Email" value={selected.email} />
                <DRow label="Teléfono" value={selected.phone} />
                <DRow label="País" value={selected.country} />
                <DRow label="Profesión" value={selected.profession} />
                <DRow label="Especialidad" value={selected.specialty} />
                <DRow label="Años de experiencia" value={EXP_LABEL[selected.years_experience]} />
                <DRow label="Empresa actual" value={selected.current_company} />
              </Section>

              <Section title="Perfil">
                <div style={{ fontSize: '.84rem', color: 'var(--carbon)', lineHeight: 1.65, marginBottom: '.75rem', background: 'var(--cream)', borderRadius: 8, padding: '.75rem 1rem' }}>
                  {selected.bio}
                </div>
                <DRow label="LinkedIn / portafolio" value={selected.linkedin_url} isLink />
                <CvRow path={selected.cv_document_url} />
              </Section>

              <Section title="Propuesta de curso">
                <DRow label="Título" value={selected.course_title} />
                <DRow label="Categoría" value={categories[selected.course_category_id] || '—'} />
                <DRow label="Nivel" value={LEVEL_LABEL[selected.course_level]} />
                <div style={{ fontSize: '.84rem', color: 'var(--carbon)', lineHeight: 1.65, marginTop: '.4rem', background: 'var(--cream)', borderRadius: 8, padding: '.75rem 1rem' }}>
                  {selected.course_description}
                </div>
              </Section>

              {/* Decision section */}
              {selected.status === 'pending' && (
                <Section title="Decisión">
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                      Notas del revisor (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Agrega notas o feedback para el solicitante…"
                      style={{ width: '100%', minHeight: 80, padding: '.7rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', fontFamily: 'var(--sans)', color: 'var(--carbon)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '.8rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.875rem', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: actionLoading ? .6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      Aprobar
                    </button>
                    <button
                      onClick={() => setConfirmReject(true)}
                      disabled={actionLoading}
                      style={{ flex: 1, padding: '.8rem', background: 'white', color: '#B91C1C', border: '1px solid #FECACA', borderRadius: 9, fontSize: '.875rem', fontWeight: 700, cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Rechazar
                    </button>
                  </div>
                </Section>
              )}

              {/* Show reviewer notes if already decided */}
              {selected.status !== 'pending' && selected.reviewer_notes && (
                <Section title="Notas del revisor">
                  <div style={{ fontSize: '.84rem', color: 'var(--carbon)', lineHeight: 1.65, background: 'var(--cream)', borderRadius: 8, padding: '.75rem 1rem' }}>
                    {selected.reviewer_notes}
                  </div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.5rem' }}>Revisado el {fmt(selected.reviewed_at)}</div>
                </Section>
              )}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Reject confirmation */}
      {confirmReject && (
        <ConfirmModal
          title="¿Rechazar esta solicitud?"
          description="Esta acción cambia el estado a Rechazado. Podrás revisar la solicitud más tarde."
          onConfirm={handleReject}
          onCancel={() => setConfirmReject(false)}
          loading={actionLoading}
          danger
        />
      )}

      <Toast message={toast} />
    </DashboardLayout>
  )
}
