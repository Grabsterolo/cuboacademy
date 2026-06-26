import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useSettings } from '../../../context/SettingsContext'

const navItems = [
  { label: 'Panel general',  path: '/dashboard',              icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
  { label: 'Usuarios',       path: '/dashboard/usuarios',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { label: 'Cursos',         path: '/dashboard/cursos',       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
  { label: 'Categorías',     path: '/dashboard/categorias',   icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { label: 'Órdenes',        path: '/dashboard/ordenes',      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg> },
  { label: 'Certificados',   path: '/dashboard/certificados', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg> },
  { label: 'Reportes',       path: '/dashboard/reportes',     icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { label: 'Configuración',  path: '/dashboard/configuracion',icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

const DEFAULTS = {
  platform_name: 'Cubo Academy',
  platform_description: '',
  logo_url: '',
  primary_color: '#167D78',
  allow_public_registration: 'true',
  require_email_confirmation: 'false',
  allowed_registration_roles: 'student',
  hero_title: '',
  hero_subtitle: '',
  contact_email: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
}

function LabelField({ children, hint }) {
  return (
    <div style={{ marginBottom: '.35rem' }}>
      <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', letterSpacing: '.05em', textTransform: 'uppercase' }}>{children}</label>
      {hint && <span style={{ fontSize: '.72rem', color: '#B5B2AB', marginTop: '.15rem', display: 'block' }}>{hint}</span>}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', whiteSpace: 'nowrap' }}>{children}</h2>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

export default function SettingsPage() {
  const { setSettings: setContextSettings } = useSettings()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saving2, setSaving2] = useState(false)
  const [saveSuccess2, setSaveSuccess2] = useState(false)
  const [saveError2, setSaveError2] = useState('')

  useEffect(() => {
    supabase.from('platform_settings').select('*').then(({ data }) => {
      if (data?.length) {
        const map = {}
        data.forEach(row => { map[row.key] = row.value })
        setSettings(prev => ({ ...prev, ...map }))
      }
      setLoadingInit(false)
    })
  }, [])

  function set(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSaveIdentity(e) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    const rows = ['platform_name', 'platform_description', 'logo_url', 'primary_color'].map(key => ({
      key,
      value: settings[key] ?? '',
    }))

    const { error } = await supabase
      .from('platform_settings')
      .upsert(rows, { onConflict: 'key' })

    setSaving(false)
    if (error) {
      setSaveError(error?.message || 'Error al guardar.')
    } else {
      setContextSettings(prev => ({ ...prev, ...rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}) }))
      if (settings.primary_color) document.documentElement.style.setProperty('--jade', settings.primary_color)
      if (settings.platform_name) document.title = settings.platform_name
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  async function handleSaveContent(e) {
    e.preventDefault()
    setSaving2(true)
    setSaveError2('')
    setSaveSuccess2(false)

    const rows = ['hero_title', 'hero_subtitle', 'contact_email', 'social_instagram', 'social_linkedin', 'social_youtube'].map(key => ({
      key,
      value: settings[key] ?? '',
    }))

    const { error } = await supabase
      .from('platform_settings')
      .upsert(rows, { onConflict: 'key' })

    setSaving2(false)
    if (error) {
      setSaveError2(error?.message || 'Error al guardar.')
    } else {
      setContextSettings(prev => ({ ...prev, ...rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {}) }))
      setSaveSuccess2(true)
      setTimeout(() => setSaveSuccess2(false), 3000)
    }
  }

  async function handleToggle(key, checked) {
    const value = checked ? 'true' : 'false'
    set(key, value)
    await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' })
    setContextSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSelectSetting(key, value) {
    set(key, value)
    await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' })
    setContextSettings(prev => ({ ...prev, [key]: value }))
  }

  const inp = {
    width: '100%',
    padding: '.7rem .95rem',
    background: 'var(--cream)',
    border: '1px solid var(--border)',
    borderRadius: 7,
    color: 'var(--carbon)',
    fontSize: '.9rem',
    outline: 'none',
    fontFamily: 'var(--sans)',
    boxSizing: 'border-box',
    transition: 'border-color .2s, background .2s',
  }

  return (
    <DashboardLayout navItems={navItems}>
      <style>{`
        .sett-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .sett-sel:focus { border-color: var(--jade) !important; }
        .toggle-track { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
        .toggle-track input { opacity: 0; width: 0; height: 0; position: absolute; }
        .toggle-slider { position: absolute; inset: 0; background: var(--border); border-radius: 22px; cursor: pointer; transition: background .2s; }
        .toggle-slider::after { content: ''; position: absolute; left: 3px; top: 3px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
        .toggle-track input:checked + .toggle-slider { background: var(--jade); }
        .toggle-track input:checked + .toggle-slider::after { transform: translateX(18px); }
        .btn-save-sett { padding: .75rem 1.75rem; background: var(--jade); color: white; border: none; border-radius: 8px; font-size: .875rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: background .2s, opacity .2s; }
        .btn-save-sett:hover { background: var(--jade-hover); }
        .btn-save-sett:disabled { opacity: .6; cursor: not-allowed; }
        @media (max-width: 768px) {
          .sett-pad { padding: 1.25rem 1rem 2rem !important; }
          .sett-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="sett-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Administración</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15 }}>Configuración</h1>
        </div>

        <div className="sett-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

          {/* ── Sección 1: Identidad ── */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem' }}>
            <SectionTitle>Identidad de la plataforma</SectionTitle>

            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {[120, 80, 200, 60].map((w, i) => (
                  <div key={i} style={{ height: 42, background: 'var(--border)', borderRadius: 7, width: w }} />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSaveIdentity} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <LabelField>Nombre de la plataforma</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.platform_name}
                    onChange={e => set('platform_name', e.target.value)} placeholder="Cubo Academy" />
                </div>
                <div>
                  <LabelField hint="Aparece en la página de inicio y en emails">Descripción corta</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.platform_description}
                    onChange={e => set('platform_description', e.target.value)} placeholder="Formación práctica para profesionales consultivos" />
                </div>
                <div>
                  <LabelField hint="URL pública de la imagen">URL del logo</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.logo_url}
                    onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <LabelField>Color principal</LabelField>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                    <input type="color" value={settings.primary_color || '#167D78'}
                      onChange={e => set('primary_color', e.target.value)}
                      style={{ width: 42, height: 42, padding: 2, border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', background: 'white', flexShrink: 0 }} />
                    <input className="sett-inp" style={{ ...inp, width: 130, fontFamily: 'monospace', fontSize: '.88rem' }}
                      type="text" value={settings.primary_color}
                      onChange={e => set('primary_color', e.target.value)}
                      placeholder="#167D78" maxLength={7} />
                  </div>
                </div>

                {saveError && (
                  <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.55rem .9rem', fontSize: '.8rem' }}>
                    {saveError}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '.25rem' }}>
                  <button type="submit" className="btn-save-sett" disabled={saving}>
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  {saveSuccess && (
                    <span style={{ fontSize: '.83rem', color: 'var(--jade)', fontFamily: 'var(--sans)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Guardado
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* ── Sección 2: Acceso y seguridad ── */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem' }}>
            <SectionTitle>Acceso y seguridad</SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Toggle: allow_public_registration */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>Permitir registro público</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text-2)', marginTop: '.15rem' }}>Los visitantes pueden crear una cuenta sin invitación.</div>
                </div>
                <label className="toggle-track">
                  <input type="checkbox"
                    checked={settings.allow_public_registration === 'true'}
                    onChange={e => handleToggle('allow_public_registration', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Toggle: require_email_confirmation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>Requerir confirmación de email</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text-2)', marginTop: '.15rem' }}>El usuario debe verificar su correo antes de acceder.</div>
                </div>
                <label className="toggle-track">
                  <input type="checkbox"
                    checked={settings.require_email_confirmation === 'true'}
                    onChange={e => handleToggle('require_email_confirmation', e.target.checked)} />
                  <span className="toggle-slider" />
                </label>
              </div>

              <div style={{ height: 1, background: 'var(--border)' }} />

              {/* Select: allowed_registration_roles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>Roles permitidos en registro</div>
                  <div style={{ fontSize: '.76rem', color: 'var(--text-2)', marginTop: '.15rem' }}>Qué roles puede elegir un nuevo usuario al registrarse.</div>
                </div>
                <select className="sett-sel"
                  value={settings.allowed_registration_roles}
                  onChange={e => handleSelectSetting('allowed_registration_roles', e.target.value)}
                  style={{ padding: '.5rem .8rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.84rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', cursor: 'pointer', flexShrink: 0 }}>
                  <option value="student">Solo estudiantes</option>
                  <option value="student_instructor">Estudiantes e instructores</option>
                </select>
              </div>

            </div>
          </div>

          {/* ── Sección 3: Contenido y contacto ── */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '2rem', gridColumn: '1 / -1' }}>
            <SectionTitle>Contenido y contacto</SectionTitle>

            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {[160, 100, 120, 80, 80, 80].map((w, i) => (
                  <div key={i} style={{ height: 42, background: 'var(--border)', borderRadius: 7, width: w }} />
                ))}
              </div>
            ) : (
              <form onSubmit={handleSaveContent} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <LabelField hint="Texto principal del hero en la página de inicio">Título del hero</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.hero_title}
                    onChange={e => set('hero_title', e.target.value)} placeholder="El conocimiento que transforma" />
                </div>
                <div>
                  <LabelField hint="Párrafo descriptivo debajo del título">Subtítulo del hero</LabelField>
                  <textarea className="sett-inp" style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                    value={settings.hero_subtitle}
                    onChange={e => set('hero_subtitle', e.target.value)}
                    placeholder="Cubo Academy convierte experiencia consultiva real en cursos de alto impacto…" />
                </div>
                <div>
                  <LabelField>Email de contacto</LabelField>
                  <input className="sett-inp" style={inp} type="email" value={settings.contact_email}
                    onChange={e => set('contact_email', e.target.value)} placeholder="contacto@cuboacademy.com" />
                </div>
                <div>
                  <LabelField>Instagram URL</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.social_instagram}
                    onChange={e => set('social_instagram', e.target.value)} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <LabelField>LinkedIn URL</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.social_linkedin}
                    onChange={e => set('social_linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
                </div>
                <div>
                  <LabelField>YouTube URL</LabelField>
                  <input className="sett-inp" style={inp} type="text" value={settings.social_youtube}
                    onChange={e => set('social_youtube', e.target.value)} placeholder="https://youtube.com/@..." />
                </div>

                {saveError2 && (
                  <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 7, padding: '.55rem .9rem', fontSize: '.8rem' }}>
                    {saveError2}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '.25rem' }}>
                  <button type="submit" className="btn-save-sett" disabled={saving2}>
                    {saving2 ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                  {saveSuccess2 && (
                    <span style={{ fontSize: '.83rem', color: 'var(--jade)', fontFamily: 'var(--sans)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Guardado
                    </span>
                  )}
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </DashboardLayout>
  )
}
