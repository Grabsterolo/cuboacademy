import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { ModalOverlay, ConfirmModal, Badge, Toast, STATUS_TONE } from '../../../components/ui/index'
import { supabase } from '../../../lib/supabase'
import { slugify } from '../../../lib/slugify'
import { formatDateShort } from '../../../lib/formatDate'
import { runQuery } from '../../../lib/db'
import { ErrorState } from '../../../components/ui/ErrorState'

const EXP_LABEL = { 2: '1-2 años', 5: '3-5 años', 10: '6-10 años', 15: '10+ años' }
const LEVEL_LABEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }

const STATUS_BADGE = {
  pending:  { label: 'Pendiente', ...STATUS_TONE.warning },
  approved: { label: 'Aprobado',  ...STATUS_TONE.success },
  rejected: { label: 'Rechazado', ...STATUS_TONE.danger },
}

function fmt(iso) {
  if (!iso) return '—'
  return formatDateShort(iso)
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
      <span style={{ color: 'var(--text-3)', flexShrink: 0, width: 140 }}>{label}:</span>
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
      <span style={{ color: 'var(--text-3)', flexShrink: 0, width: 140 }}>CV / Documento:</span>
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
  const [profileByEmail, setProfileByEmail] = useState({})
  const [provisioning, setProvisioning] = useState(null) // id de la solicitud en curso
  const [actionLink, setActionLink] = useState(null)     // { email, link } si el correo falló
  const [loadErr, setLoadErr] = useState(null)

  useEffect(() => {
    loadData()
    runQuery(supabase.from('categories').select('id, name'), 'RequestsPage: categorías').then(({ data }) => {
      if (data) setCategories(Object.fromEntries(data.map(c => [c.id, c.name])))
    })
  }, [])

  async function loadData() {
    setLoading(true)
    const { data, error } = await runQuery(
      supabase
        .from('instructor_applications')
        .select('*')
        .order('created_at', { ascending: false }),
      'RequestsPage: listar solicitudes',
    )
    setLoadErr(error)
    const rows = data || []
    setApps(rows)

    // `profile_id` no basta para saber si el instructor tiene cuenta: en las
    // solicitudes antiguas quedó en null aunque la persona sí se hubiera
    // registrado por su cuenta. Se resuelve por correo para no marcar como
    // «sin cuenta» a alguien que sí la tiene.
    const emails = rows.map(a => a.email).filter(Boolean)
    if (emails.length) {
      const variants = [...new Set([...emails, ...emails.map(e => e.toLowerCase())])]
      const { data: profs } = await runQuery(
        supabase
        .from('profiles').select('id, email').in('email', variants),
        'RequestsPage: consulta 1',
      )
      setProfileByEmail(Object.fromEntries(
        (profs || []).map(p => [(p.email || '').toLowerCase(), p.id]),
      ))
    } else {
      setProfileByEmail({})
    }
    setLoading(false)
  }

  function hasAccount(app) {
    return Boolean(app.profile_id || profileByEmail[(app.email || '').toLowerCase()])
  }

  /**
   * Crea la cuenta real del instructor. Todo el trabajo privilegiado (alta en
   * Auth, perfil con rol instructor, correo de invitación) ocurre en la edge
   * function, que revalida que quien llama es admin con la service key.
   */
  async function provisionInstructor(app) {
    const { data, error } = await supabase.functions.invoke('provision-instructor', {
      body: { applicationId: app.id },
    })
    // functions.invoke da un error genérico; el motivo real viene en el cuerpo.
    if (error) {
      let detail = ''
      try { detail = (await error.context?.json())?.error || '' } catch { /* sin cuerpo legible */ }
      return { error: detail || error.message || 'No se pudo crear la cuenta.' }
    }
    if (data?.error) return { error: data.error }
    return { data }
  }

  function accountToast(res) {
    if (res.actionLink) {
      return 'Cuenta creada, pero no se pudo enviar el correo de invitación. Copia el enlace para establecer contraseña desde la ficha de la solicitud.'
    }
    if (res.invited) return 'Cuenta de instructor creada. Se le envió un correo para establecer su contraseña.'
    return 'La persona ya tenía cuenta: se le otorgó el rol de instructor.'
  }

  /**
   * Enlace de acceso bajo demanda. Una cuenta creada por invitación no tiene
   * contraseña hasta que la persona abre el correo; si ese correo no llegó, sin
   * esto el instructor se queda fuera y el admin sin forma de ayudarle.
   */
  async function handleAccessLink(app) {
    setProvisioning(app.id)
    const { data, error } = await supabase.functions.invoke('provision-instructor', {
      body: { applicationId: app.id, mode: 'access-link' },
    })
    setProvisioning(null)
    let detail = data?.error || ''
    if (error && !detail) {
      try { detail = (await error.context?.json())?.error || '' } catch { /* sin cuerpo legible */ }
    }
    if (detail || !data?.actionLink) { showToast(`Error: ${detail || 'No se pudo generar el enlace.'}`); return }
    setActionLink({ email: app.email, link: data.actionLink })
  }

  async function handleCreateAccount(app) {
    setProvisioning(app.id)
    const { data, error } = await provisionInstructor(app)
    setProvisioning(null)
    if (error) { showToast(`Error: ${error}`); return }
    if (data?.actionLink) setActionLink({ email: app.email, link: data.actionLink })
    showToast(accountToast(data || {}))
    loadData()
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // Seeds a draft course from the applicant's proposal so they don't have to
  // retype it into the wizard. Now runs for every approval: provisioning
  // returns the profile id even for brand-new accounts, which is what this
  // used to be missing.
  async function seedDraftCourseFromApplication(app, instructorId) {
    if (!app.course_title?.trim()) return
    const baseSlug = slugify(app.course_title.trim())
    let candidate = baseSlug
    for (let attempt = 0; attempt < 5; attempt++) {
      const { error } = await supabase.from('courses').insert({
        title: app.course_title.trim(),
        description: app.course_description?.trim() || null,
        category_id: app.course_category_id || null,
        level: app.course_level || 'beginner',
        instructor_id: instructorId,
        slug: candidate,
        status: 'draft',
      })
      if (!error) return
      if (error.code === '23505' && /slug/.test(error.message || '')) {
        candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
        continue
      }
      return // some other error -- don't block approval over the course seed
    }
  }

  /**
   * Aprobar significa que la persona pueda entrar como instructor. Antes esto
   * solo cambiaba el estado y notificaba: la cuenta nunca se creaba, así que
   * quedaban instructores «aprobados» sin poder iniciar sesión.
   *
   * La cuenta se crea primero y el estado solo se mueve si eso salió bien; si
   * falla, la solicitud se queda exactamente como estaba y el admin ve el
   * motivo, en vez de quedar marcada como resuelta sin estarlo.
   */
  async function handleApprove() {
    if (!selected) return
    const app = selected
    setActionLoading(true)

    const { data: provisioned, error: provisionErr } = await provisionInstructor(app)
    if (provisionErr) {
      setActionLoading(false)
      showToast(`No se aprobó: ${provisionErr}`)
      return
    }

    const { error } = await supabase
      .from('instructor_applications')
      .update({ status: 'approved', reviewer_notes: notes || null, reviewed_at: new Date().toISOString() })
      .eq('id', app.id)

    setActionLoading(false)

    if (error) {
      // La cuenta ya existe; solo quedó sin marcar. Decirlo tal cual, porque
      // reintentar es seguro (la función reutiliza la cuenta ya creada).
      showToast('La cuenta se creó, pero no se pudo marcar la solicitud como aprobada. Vuelve a intentarlo.')
      loadData()
      return
    }

    if (provisioned?.actionLink) setActionLink({ email: app.email, link: provisioned.actionLink })

    setSelected(null)
    setNotes('')

    if (provisioned?.profileId) {
      await seedDraftCourseFromApplication(app, provisioned.profileId)
    }
    loadData()
    showToast(`Solicitud aprobada. ${accountToast(provisioned || {})}`)
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
        .rq-srch { width: 100%; padding: .6rem .9rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; color: var(--carbon); font-size: .875rem; font-family: var(--sans); }
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.6rem 1rem', background: 'var(--cream)', borderBottom: '1px solid var(--border)', fontSize: '.72rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '.05em', textTransform: 'uppercase' }}>
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
          {!loading && loadErr && (
            <div style={{ padding: '1rem' }}>
              <ErrorState
                title="No pudimos cargar las solicitudes"
                description="Falló la consulta. Puede haber solicitudes pendientes que esta lista no está mostrando."
                error={loadErr}
                onRetry={loadData}
                compact
              />
            </div>
          )}
          {!loading && !loadErr && filtered.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.875rem', fontFamily: 'var(--sans)' }}>No hay solicitudes en esta categoría.</div>
          )}

          {filtered.map(a => {
            const sb = STATUS_BADGE[a.status] || STATUS_BADGE.pending
            const initials = `${a.full_name?.[0] || ''}${a.last_name?.[0] || ''}`.toUpperCase()
            // Aprobada pero sin cuenta: el instructor no puede entrar. Es el
            // rastro que dejaron las aprobaciones anteriores a que esto se
            // creara la cuenta de verdad.
            const missingAccount = a.status === 'approved' && !hasAccount(a)
            return (
              <div key={a.id}>
              <div className="rq-row" onClick={() => { setSelected(a); setNotes(a.reviewer_notes || '') }}>
                <div style={{ flex: '0 0 36px', width: 36, height: 36, borderRadius: '50%', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, color: 'var(--jade-ink)', flexShrink: 0 }}>
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

              {missingAccount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', padding: '.6rem 1rem .7rem 3.7rem', background: '#FFFBEB', borderBottom: '1px solid var(--border)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span style={{ fontSize: '.76rem', color: '#92400E', flex: 1, minWidth: 180 }}>
                    Aprobada pero sin cuenta: <strong>{a.email}</strong> no puede iniciar sesión.
                  </span>
                  <button onClick={e => { e.stopPropagation(); handleCreateAccount(a) }} disabled={provisioning === a.id}
                    style={{ padding: '.35rem .8rem', borderRadius: 7, border: '1px solid #FDE68A', background: 'white', color: '#92400E', fontSize: '.76rem', fontWeight: 700, cursor: provisioning === a.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: provisioning === a.id ? .6 : 1, flexShrink: 0 }}>
                    {provisioning === a.id ? 'Creando…' : 'Crear cuenta ahora'}
                  </button>
                </div>
              )}
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
                    <label htmlFor="req-reviewer-notes" style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }}>
                      Notas del revisor (opcional)
                    </label>
                    <textarea
                      id="req-reviewer-notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Agrega notas o feedback para el solicitante…"
                      style={{ width: '100%', minHeight: 80, padding: '.7rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', fontFamily: 'var(--sans)', color: 'var(--carbon)', resize: 'vertical', boxSizing: 'border-box' }}
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

              {/* Acceso del instructor ya aprobado */}
              {selected.status === 'approved' && hasAccount(selected) && (
                <Section title="Acceso del instructor">
                  <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.6, margin: '0 0 .75rem' }}>
                    Si no recibió el correo de invitación, genera un enlace y hazlo llegar tú. Le sirve tanto para establecer su contraseña por primera vez como para recuperarla.
                  </p>
                  <button onClick={() => handleAccessLink(selected)} disabled={provisioning === selected.id}
                    style={{ padding: '.6rem 1.1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--cream)', color: 'var(--carbon)', fontSize: '.82rem', fontWeight: 600, cursor: provisioning === selected.id ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: provisioning === selected.id ? .6 : 1 }}>
                    {provisioning === selected.id ? 'Generando…' : 'Generar enlace de acceso'}
                  </button>
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

      {/* Enlace de respaldo: la cuenta existe pero Auth no pudo enviar el
          correo (SMTP sin configurar). Sin esto el instructor quedaría creado
          y sin forma de entrar. */}
      {actionLink && (
        <ModalOverlay onClose={() => setActionLink(null)}>
          <div style={{ background: 'white', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(23,26,28,.2)' }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>
              Enlace de acceso
            </h3>
            <p style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Hazle llegar este enlace a <strong>{actionLink.email}</strong> para que establezca su contraseña y pueda entrar. Es de un solo uso y caduca.
            </p>
            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: '.7rem .85rem', fontSize: '.75rem', color: 'var(--carbon)', wordBreak: 'break-all', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', marginBottom: '1rem' }}>
              {actionLink.link}
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button onClick={() => navigator.clipboard?.writeText(actionLink.link)}
                style={{ flex: 1, padding: '.7rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Copiar enlace
              </button>
              <button onClick={() => setActionLink(null)}
                style={{ flex: 1, padding: '.7rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      <Toast message={toast} />
    </DashboardLayout>
  )
}
