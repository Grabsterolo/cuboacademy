import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useSettings } from '../../../context/SettingsContext'

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

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function Card({ title, desc, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: '.78rem', color: 'var(--text-2)', margin: '.2rem 0 0', fontWeight: 300 }}>{desc}</p>}
      </div>
      <div style={{ padding: '1.25rem 1.5rem' }}>{children}</div>
    </div>
  )
}

function Row({ label, desc, children, last }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--carbon)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.75rem', color: 'var(--text-2)', marginTop: '.15rem', fontWeight: 300 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 42, height: 24, borderRadius: 12, background: on ? 'var(--jade)' : 'var(--border)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.15)' }} />
    </button>
  )
}

function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-2)', marginLeft: '.4rem' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  )
}

function SaveRow({ loading, success, error }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '.5rem', borderTop: '1px solid var(--border)', marginTop: '.5rem' }}>
      <button type="submit" disabled={loading}
        style={{ padding: '.6rem 1.4rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.855rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: loading ? .7 : 1, transition: 'opacity .2s' }}>
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
      {success && (
        <span style={{ fontSize: '.82rem', color: 'var(--jade)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
          {CHECK} Guardado
        </span>
      )}
      {error && (
        <span style={{ fontSize: '.78rem', color: '#c0392b' }}>{error}</span>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { setSettings: setCtx } = useSettings()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loadingInit, setLoadingInit] = useState(true)

  const [s1, setS1] = useState({ saving: false, ok: false, err: '' })
  const [s2, setS2] = useState({ saving: false, ok: false, err: '' })
  const [s3, setS3] = useState({ saving: false, ok: false, err: '' })

  useEffect(() => {
    supabase.from('platform_settings').select('*').then(({ data }) => {
      if (data?.length) {
        const map = {}
        data.forEach(r => { map[r.key] = r.value })
        setSettings(prev => ({ ...prev, ...map }))
      }
      setLoadingInit(false)
    })
  }, [])

  function set(key, val) { setSettings(prev => ({ ...prev, [key]: val })) }

  async function saveKeys(keys, st, setSt) {
    setSt({ saving: true, ok: false, err: '' })
    const rows = keys.map(k => ({ key: k, value: settings[k] ?? '' }))
    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    if (error) { setSt({ saving: false, ok: false, err: error.message || 'Error al guardar.' }); return }
    setCtx(prev => ({ ...prev, ...rows.reduce((a, r) => ({ ...a, [r.key]: r.value }), {}) }))
    setSt({ saving: false, ok: true, err: '' })
    setTimeout(() => setSt(p => ({ ...p, ok: false })), 3000)
  }

  async function handleSavePlatform(e) {
    e.preventDefault()
    await saveKeys(['platform_name', 'platform_description', 'logo_url', 'primary_color'], s1, setS1)
    if (settings.primary_color) document.documentElement.style.setProperty('--jade', settings.primary_color)
    if (settings.platform_name) document.title = settings.platform_name
  }

  async function handleSaveLanding(e) {
    e.preventDefault()
    await saveKeys(['hero_title', 'hero_subtitle', 'contact_email'], s2, setS2)
  }

  async function handleSaveSocial(e) {
    e.preventDefault()
    await saveKeys(['social_instagram', 'social_linkedin', 'social_youtube'], s3, setS3)
  }

  async function handleToggle(key, checked) {
    const value = checked ? 'true' : 'false'
    set(key, value)
    await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' })
    setCtx(prev => ({ ...prev, [key]: value }))
  }

  async function handleSelectSetting(key, value) {
    set(key, value)
    await supabase.from('platform_settings').upsert([{ key, value }], { onConflict: 'key' })
    setCtx(prev => ({ ...prev, [key]: value }))
  }

  const inp = {
    width: '100%', padding: '.6rem .85rem', background: 'var(--cream)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--carbon)', fontSize: '.875rem', outline: 'none',
    fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .18s, background .18s',
  }

  return (
    <DashboardLayout>
      <style>{`
        .sett-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .sett-sel { padding: .5rem .75rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; font-size: .84rem; color: var(--carbon); font-family: var(--sans); outline: none; cursor: pointer; transition: border-color .18s; }
        .sett-sel:focus { border-color: var(--jade); }
        @media (max-width: 768px) { .sett-pad { padding: 1.25rem 1rem 2rem !important; } }
      `}</style>

      <div className="sett-pad" style={{ padding: '2.5rem 2.5rem 3rem', maxWidth: 720 }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Administración</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Configuración</h1>
        </div>

        {/* ── 1. Identidad de la plataforma ── */}
        <Card title="Identidad de la plataforma" desc="Nombre, imagen y color que definen la marca en toda la app.">
          {loadingInit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[200, 260, 180, 80].map((w, i) => <div key={i} style={{ height: 38, background: 'var(--border)', borderRadius: 7, width: w, opacity: 1 - i * 0.15 }} />)}
            </div>
          ) : (
            <form onSubmit={handleSavePlatform} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Nombre de la plataforma">
                <input className="sett-inp" style={inp} type="text" value={settings.platform_name}
                  onChange={e => set('platform_name', e.target.value)} placeholder="Cubo Academy" />
              </Field>
              <Field label="Descripción" hint="se muestra en emails y meta tags">
                <input className="sett-inp" style={inp} type="text" value={settings.platform_description}
                  onChange={e => set('platform_description', e.target.value)} placeholder="Formación práctica para profesionales consultivos" />
              </Field>
              <Field label="URL del logo" hint="imagen pública accesible por URL">
                <input className="sett-inp" style={inp} type="text" value={settings.logo_url}
                  onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
              </Field>
              <Field label="Color principal">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                  <input type="color" value={settings.primary_color || '#167D78'}
                    onChange={e => set('primary_color', e.target.value)}
                    style={{ width: 40, height: 40, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'white', flexShrink: 0 }} />
                  <input className="sett-inp" style={{ ...inp, width: 120, fontFamily: 'monospace', fontSize: '.85rem' }}
                    type="text" value={settings.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    placeholder="#167D78" maxLength={7} />
                </div>
              </Field>
              <SaveRow loading={s1.saving} success={s1.ok} error={s1.err} />
            </form>
          )}
        </Card>

        {/* ── 2. Acceso y registro ── */}
        <Card title="Acceso y registro" desc="Controla cómo los usuarios pueden crear una cuenta en la plataforma.">
          <Row label="Registro público" desc="Cualquier visitante puede crear una cuenta sin invitación.">
            <Toggle on={settings.allow_public_registration === 'true'} onChange={v => handleToggle('allow_public_registration', v)} />
          </Row>
          <Row label="Confirmación de email" desc="El usuario debe verificar su correo antes de poder acceder.">
            <Toggle on={settings.require_email_confirmation === 'true'} onChange={v => handleToggle('require_email_confirmation', v)} />
          </Row>
          <Row label="Roles disponibles en registro" desc="Qué roles puede elegir un nuevo usuario al registrarse." last>
            <select className="sett-sel" value={settings.allowed_registration_roles}
              onChange={e => handleSelectSetting('allowed_registration_roles', e.target.value)}>
              <option value="student">Solo estudiantes</option>
              <option value="student_instructor">Estudiantes e instructores</option>
            </select>
          </Row>
        </Card>

        {/* ── 3. Landing page ── */}
        <Card title="Página de inicio" desc="Textos que aparecen en el hero y datos de contacto de la plataforma.">
          {loadingInit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[220, 300, 160].map((w, i) => <div key={i} style={{ height: 38, background: 'var(--border)', borderRadius: 7, width: w, opacity: 1 - i * 0.15 }} />)}
            </div>
          ) : (
            <form onSubmit={handleSaveLanding} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Título principal">
                <input className="sett-inp" style={inp} type="text" value={settings.hero_title}
                  onChange={e => set('hero_title', e.target.value)} placeholder="El conocimiento que transforma" />
              </Field>
              <Field label="Subtítulo">
                <textarea className="sett-inp" style={{ ...inp, resize: 'vertical', minHeight: 80 }}
                  value={settings.hero_subtitle}
                  onChange={e => set('hero_subtitle', e.target.value)}
                  placeholder="Cubo Academy convierte experiencia consultiva real en cursos de alto impacto…" />
              </Field>
              <Field label="Email de contacto">
                <input className="sett-inp" style={inp} type="email" value={settings.contact_email}
                  onChange={e => set('contact_email', e.target.value)} placeholder="contacto@cuboacademy.com" />
              </Field>
              <SaveRow loading={s2.saving} success={s2.ok} error={s2.err} />
            </form>
          )}
        </Card>

        {/* ── 4. Redes sociales ── */}
        <Card title="Redes sociales" desc="URLs que aparecen en el footer y la página de inicio.">
          {loadingInit ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {[180, 200, 160].map((w, i) => <div key={i} style={{ height: 38, background: 'var(--border)', borderRadius: 7, width: w, opacity: 1 - i * 0.15 }} />)}
            </div>
          ) : (
            <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Field label="Instagram">
                <input className="sett-inp" style={inp} type="text" value={settings.social_instagram}
                  onChange={e => set('social_instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </Field>
              <Field label="LinkedIn">
                <input className="sett-inp" style={inp} type="text" value={settings.social_linkedin}
                  onChange={e => set('social_linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
              </Field>
              <Field label="YouTube">
                <input className="sett-inp" style={inp} type="text" value={settings.social_youtube}
                  onChange={e => set('social_youtube', e.target.value)} placeholder="https://youtube.com/@..." />
              </Field>
              <SaveRow loading={s3.saving} success={s3.ok} error={s3.err} />
            </form>
          )}
        </Card>

      </div>
    </DashboardLayout>
  )
}
