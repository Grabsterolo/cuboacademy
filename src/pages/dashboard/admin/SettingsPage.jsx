import { useEffect, useRef, useState, cloneElement, isValidElement } from 'react'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useSettings } from '../../../context/SettingsContext'
import { runQuery } from '../../../lib/db'
import { evaluateAccent, formatRatio, AA_MIN } from '../../../lib/contrast'

const DEFAULTS = {
  platform_name: 'Cubo Campus',
  platform_description: '',
  logo_url: '',
  primary_color: '#167D78',
  allow_public_registration: 'true',
  require_email_confirmation: 'false',
  allowed_registration_roles: 'student',
  hero_title: '',
  hero_subtitle: '',
  hero_video_url: '',
  contact_email: '',
  social_instagram: '',
  social_linkedin: '',
  social_youtube: '',
  payment_instructions: '',
  sinpe_number: '',
  bank_account: '',
  payment_note: '',
  contact_whatsapp: '',
  legal_terms: '',
  legal_privacy: '',
  legal_refund: '',
}

const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function Card({ title, desc, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.4rem 1.75rem', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: '.79rem', color: 'var(--text-2)', margin: '.25rem 0 0', fontWeight: 400, lineHeight: 1.5 }}>{desc}</p>}
      </div>
      <div style={{ padding: '1.5rem 1.75rem', flex: 1 }}>{children}</div>
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

const FORM_TAGS = ['input', 'textarea', 'select']
function Field({ label, hint, children, id }) {
  const input = id && isValidElement(children) && FORM_TAGS.includes(children.type) && !children.props.id ? cloneElement(children, { id }) : children
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
      <label htmlFor={id} style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', fontFamily: 'var(--sans)' }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: 'var(--text-2)', marginLeft: '.4rem' }}>— {hint}</span>}
      </label>
      {input}
    </div>
  )
}

/**
 * Ratio del color de acento contra los fondos reales de la app.
 *
 * Se enseñan los dos números en vez de un simple «no válido»: si el admin
 * quiere acercarse al color de marca, necesita ver cuánto le falta.
 */
function ContrastReadout({ accent }) {
  if (!accent.valid) return null
  const bad = !accent.passes
  return (
    <div style={{ marginTop: '.55rem', display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
      {accent.results.map(r => (
        <span key={r.label} style={{ fontSize: '.74rem', color: r.ratio >= AA_MIN ? 'var(--text-2)' : '#b3541e', fontWeight: 500 }}>
          {formatRatio(r.ratio)} sobre {r.label}
        </span>
      ))}
      <span style={{ fontSize: '.74rem', fontWeight: 600, color: bad ? '#b3541e' : 'var(--jade)' }}>
        {bad ? `Por debajo del mínimo de ${AA_MIN}:1` : `Cumple el mínimo de ${AA_MIN}:1`}
      </span>
      {bad && (
        <p style={{ width: '100%', margin: '.15rem 0 0', fontSize: '.74rem', color: '#b3541e', lineHeight: 1.5 }}>
          Este color se usa también para texto (enlaces, precios, etiquetas). Con
          este tono no se lee bien sobre el fondo de la web, así que no se puede
          guardar: prueba uno más oscuro.
        </p>
      )}
    </div>
  )
}

function SaveRow({ loading, success, error, blocked }) {
  const off = loading || blocked
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '.75rem', borderTop: '1px solid var(--border)', marginTop: '.25rem' }}>
      <button type="submit" disabled={off}
        style={{ padding: '.6rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.855rem', fontWeight: 600, cursor: off ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: off ? .7 : 1, transition: 'opacity .2s' }}>
        {loading ? 'Guardando…' : 'Guardar cambios'}
      </button>
      {success && (
        <span style={{ fontSize: '.82rem', color: 'var(--jade)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '.35rem' }}>
          {CHECK} Guardado
        </span>
      )}
      {error && <span style={{ fontSize: '.78rem', color: '#c0392b' }}>{error}</span>}
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
  const [s4, setS4] = useState({ saving: false, ok: false, err: '' })
  const [s5, setS5] = useState({ saving: false, ok: false, err: '' })

  const [heroVideoUploading, setHeroVideoUploading] = useState(false)
  const [heroVideoErr, setHeroVideoErr] = useState('')
  const [pendingHeroVideoPath, setPendingHeroVideoPath] = useState('')
  const [pendingHeroVideoUrl, setPendingHeroVideoUrl] = useState('')
  const heroVideoInputRef = useRef()

  useEffect(() => {
    runQuery(supabase.from('platform_settings').select('*'), 'SettingsPage: ajustes').then(({ data }) => {
      if (data?.length) {
        const map = {}
        data.forEach(r => { map[r.key] = r.value })
        setSettings(prev => ({ ...prev, ...map }))
      }
      setLoadingInit(false)
    })
  }, [])

  function set(key, val) { setSettings(prev => ({ ...prev, [key]: val })) }

  async function saveKeys(keys, setSt, overrides = {}) {
    setSt({ saving: true, ok: false, err: '' })
    const merged = { ...settings, ...overrides }
    const rows = keys.map(k => ({ key: k, value: merged[k] ?? '' }))
    const { error } = await supabase.from('platform_settings').upsert(rows, { onConflict: 'key' })
    if (error) { setSt({ saving: false, ok: false, err: error.message || 'Error al guardar.' }); return }
    setCtx(prev => ({ ...prev, ...rows.reduce((a, r) => ({ ...a, [r.key]: r.value }), {}) }))
    if (Object.keys(overrides).length) setSettings(prev => ({ ...prev, ...overrides }))
    setSt({ saving: false, ok: true, err: '' })
    setTimeout(() => setSt(p => ({ ...p, ok: false })), 3000)
  }

  async function handleSavePlatform(e) {
    e.preventDefault()
    // El color de acento sobrescribe --jade en toda la app, y --jade no es solo
    // relleno: es color de texto en enlaces, precios y etiquetas. Un tono claro
    // deja ilegibles decenas de nodos de una sola vez, así que aquí se para el
    // guardado en lugar de dejarlo pasar con un aviso que se puede ignorar.
    const check = evaluateAccent(settings.primary_color)
    if (!check.valid) {
      setS1({ saving: false, ok: false, err: 'El color principal debe ser un hex de 6 dígitos, por ejemplo #167D78.' })
      return
    }
    if (!check.passes) {
      setS1({ saving: false, ok: false, err: `El color principal no se guardó: ${formatRatio(check.worst.ratio)} sobre ${check.worst.label}, por debajo del mínimo de ${AA_MIN}:1. Elige un tono más oscuro.` })
      return
    }
    await saveKeys(['platform_name', 'platform_description', 'logo_url', 'primary_color'], setS1)
    if (settings.primary_color) document.documentElement.style.setProperty('--jade', settings.primary_color)
    if (settings.platform_name) document.title = settings.platform_name
  }

  // Uploads go to a temp object first, not the live hero.mp4 -- so picking a
  // file only affects the live site once "Guardar cambios" actually moves it
  // into place. Fixed temp path + upsert keeps the bucket from accumulating
  // abandoned uploads across repeated selections before saving.
  async function handleHeroVideoUpload(file) {
    if (!file) return
    if (file.type !== 'video/mp4') { setHeroVideoErr('Solo se acepta formato MP4.'); return }
    if (file.size > 50 * 1024 * 1024) { setHeroVideoErr('Máximo 50 MB.'); return }
    setHeroVideoErr(''); setHeroVideoUploading(true)
    const tempPath = 'pending-hero.mp4'
    const { error: upErr } = await supabase.storage.from('hero-video')
      .upload(tempPath, file, { upsert: true, contentType: 'video/mp4' })
    if (upErr) { setHeroVideoErr(upErr.message); setHeroVideoUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('hero-video').getPublicUrl(tempPath)
    setPendingHeroVideoPath(tempPath)
    setPendingHeroVideoUrl(`${publicUrl}?v=${Date.now()}`)
    setHeroVideoUploading(false)
  }

  function handleRemoveHeroVideo() {
    set('hero_video_url', '')
    if (pendingHeroVideoPath) {
      supabase.storage.from('hero-video').remove([pendingHeroVideoPath])
      setPendingHeroVideoPath('')
      setPendingHeroVideoUrl('')
    }
  }

  async function handleSaveLanding(e) {
    e.preventDefault()
    if (pendingHeroVideoPath) {
      setS2({ saving: true, ok: false, err: '' })
      const { error: moveErr } = await supabase.storage.from('hero-video').move(pendingHeroVideoPath, 'hero.mp4')
      if (moveErr) { setS2({ saving: false, ok: false, err: 'No se pudo aplicar el nuevo video: ' + moveErr.message }); return }
      const { data: { publicUrl } } = supabase.storage.from('hero-video').getPublicUrl('hero.mp4')
      setPendingHeroVideoPath('')
      setPendingHeroVideoUrl('')
      await saveKeys(['hero_title', 'hero_subtitle', 'hero_video_url', 'contact_email', 'contact_whatsapp'], setS2, { hero_video_url: `${publicUrl}?v=${Date.now()}` })
      return
    }
    await saveKeys(['hero_title', 'hero_subtitle', 'hero_video_url', 'contact_email', 'contact_whatsapp'], setS2)
  }

  async function handleSaveSocial(e) {
    e.preventDefault()
    await saveKeys(['social_instagram', 'social_linkedin', 'social_youtube'], setS3)
  }

  async function handleSavePayment(e) {
    e.preventDefault()
    await saveKeys(['sinpe_number', 'bank_account', 'payment_instructions', 'payment_note'], setS4)
  }

  async function handleSaveLegal(e) {
    e.preventDefault()
    await saveKeys(['legal_terms', 'legal_privacy', 'legal_refund'], setS5)
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
    width: '100%', padding: '.65rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--carbon)', fontSize: '.875rem',
    fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .18s, background .18s',
  }

  const skel = (w, h = 38) => (
    <div style={{ height: h, background: 'var(--border)', borderRadius: 7, width: w, opacity: .55 }} />
  )


  // Se recalcula en cada tecleo: el admin ve el ratio mientras elige, no
  // después de guardar.
  const accent = evaluateAccent(settings.primary_color)

  return (
    <DashboardLayout>
      <style>{`
        .sett-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .sett-sel { padding: .5rem .75rem; background: var(--cream); border: 1px solid var(--border); border-radius: 8px; font-size: .84rem; color: var(--carbon); font-family: var(--sans); cursor: pointer; transition: border-color .18s; }
        .sett-sel:focus { border-color: var(--jade); }
        .sett-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 900px) { .sett-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .sett-pad { padding: 1.25rem 1rem 2rem !important; } }
      `}</style>

      <div className="sett-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Administración</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Configuración</h1>
        </div>

        <div className="sett-grid">

          {/* ── 1. Identidad ── */}
          <Card title="Identidad de la plataforma" desc="Nombre, imagen y color que definen la marca en toda la app.">
            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {skel(200)} {skel(260)} {skel(180)} {skel(80)}
              </div>
            ) : (
              <form onSubmit={handleSavePlatform} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Field label="Nombre de la plataforma" id="setting-platform-name">
                  <input className="sett-inp" style={inp} type="text" value={settings.platform_name}
                    onChange={e => set('platform_name', e.target.value)} placeholder="Cubo Campus" />
                </Field>
                <Field label="Descripción" hint="meta tags y emails" id="setting-platform-description">
                  <input className="sett-inp" style={inp} type="text" value={settings.platform_description}
                    onChange={e => set('platform_description', e.target.value)} placeholder="Formación práctica para profesionales consultivos" />
                </Field>
                <Field label="URL del logo" hint="imagen pública por URL" id="setting-logo-url">
                  <input className="sett-inp" style={inp} type="text" value={settings.logo_url}
                    onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                </Field>
                <Field label="Color principal" id="setting-color-hex">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem' }}>
                    <input type="color" value={settings.primary_color || '#167D78'}
                      onChange={e => set('primary_color', e.target.value)}
                      style={{ width: 40, height: 40, padding: 2, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: 'white', flexShrink: 0 }} />
                    <input id="setting-color-hex" className="sett-inp" style={{ ...inp, width: 120, fontFamily: 'monospace', fontSize: '.85rem' }}
                      type="text" value={settings.primary_color}
                      onChange={e => set('primary_color', e.target.value)}
                      placeholder="#167D78" maxLength={7} />
                  </div>
                  <ContrastReadout accent={accent} />
                </Field>
                <SaveRow loading={s1.saving} success={s1.ok} error={s1.err} blocked={!accent.passes} />
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
            <Row label="Roles disponibles al registrarse" desc="Qué roles puede elegir un nuevo usuario." last>
              <select className="sett-sel" value={settings.allowed_registration_roles}
                onChange={e => handleSelectSetting('allowed_registration_roles', e.target.value)}>
                <option value="student">Solo estudiantes</option>
                <option value="student_instructor">Estudiantes e instructores</option>
              </select>
            </Row>
          </Card>

          {/* ── 3. Página de inicio ── */}
          <Card title="Página de inicio" desc="Textos del hero y datos de contacto de la plataforma.">
            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {skel(220)} {skel(300, 80)} {skel(160)}
              </div>
            ) : (
              <form onSubmit={handleSaveLanding} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Field label="Título principal" id="setting-hero-title">
                  <input className="sett-inp" style={inp} type="text" value={settings.hero_title}
                    onChange={e => set('hero_title', e.target.value)} placeholder="El conocimiento que transforma" />
                </Field>
                <Field label="Subtítulo" id="setting-hero-subtitle">
                  <textarea className="sett-inp" style={{ ...inp, resize: 'vertical', minHeight: 90 }}
                    value={settings.hero_subtitle}
                    onChange={e => set('hero_subtitle', e.target.value)}
                    placeholder="Cubo Campus convierte experiencia consultiva real en cursos de alto impacto…" />
                </Field>
                <Field label="Video de fondo del hero" hint="MP4 · máx. 50 MB · se reproduce en loop, sin sonido · deja vacío para usar el fondo por defecto" id="setting-hero-video">
                  <input id="setting-hero-video" ref={heroVideoInputRef} type="file" accept="video/mp4" style={{ display: 'none' }}
                    onChange={e => { handleHeroVideoUpload(e.target.files[0]); e.target.value = '' }} />
                  {pendingHeroVideoUrl && (
                    <p style={{ fontSize: '.75rem', color: '#A16207', margin: '0 0 .5rem' }}>Video nuevo listo — se aplica al sitio cuando guardes los cambios.</p>
                  )}
                  {(pendingHeroVideoUrl || settings.hero_video_url) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
                      <video src={pendingHeroVideoUrl || settings.hero_video_url} muted loop autoPlay playsInline
                        style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--carbon)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                        <button type="button" onClick={() => heroVideoInputRef.current?.click()} disabled={heroVideoUploading}
                          style={{ padding: '.45rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: 'var(--carbon)', cursor: heroVideoUploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: heroVideoUploading ? .6 : 1 }}>
                          {heroVideoUploading ? 'Subiendo…' : 'Reemplazar video'}
                        </button>
                        <button type="button" onClick={handleRemoveHeroVideo} disabled={heroVideoUploading}
                          style={{ padding: '.45rem .9rem', background: 'none', border: '1px solid #FECACA', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: '#C81E1E', cursor: heroVideoUploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}>
                          Quitar video
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => heroVideoInputRef.current?.click()} disabled={heroVideoUploading}
                      style={{ padding: '.6rem 1.1rem', background: 'var(--cream)', border: '1.5px dashed var(--border)', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, color: 'var(--carbon)', cursor: heroVideoUploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: heroVideoUploading ? .6 : 1 }}>
                      {heroVideoUploading ? 'Subiendo…' : 'Subir video'}
                    </button>
                  )}
                  {heroVideoErr && <p style={{ fontSize: '.75rem', color: '#C81E1E', margin: '.5rem 0 0' }}>{heroVideoErr}</p>}
                </Field>
                <Field label="Email de contacto" id="setting-contact-email">
                  <input className="sett-inp" style={inp} type="email" value={settings.contact_email}
                    onChange={e => set('contact_email', e.target.value)} placeholder="contacto@cuboacademy.com" />
                </Field>
                <Field label="WhatsApp de contacto" hint="se muestra en el pie y junto al botón de compra" id="setting-contact-whatsapp">
                  <input className="sett-inp" style={inp} type="text" value={settings.contact_whatsapp}
                    onChange={e => set('contact_whatsapp', e.target.value)} placeholder="+506 8888 8888" />
                </Field>
                <SaveRow loading={s2.saving} success={s2.ok} error={s2.err} />
              </form>
            )}
          </Card>

          {/* ── 4. Redes sociales ── */}
          <Card title="Redes sociales" desc="URLs que aparecen en el footer y la página de inicio.">
            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {skel(180)} {skel(200)} {skel(160)}
              </div>
            ) : (
              <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Field label="Instagram" id="setting-instagram">
                  <input className="sett-inp" style={inp} type="text" value={settings.social_instagram}
                    onChange={e => set('social_instagram', e.target.value)} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="LinkedIn" id="setting-linkedin">
                  <input className="sett-inp" style={inp} type="text" value={settings.social_linkedin}
                    onChange={e => set('social_linkedin', e.target.value)} placeholder="https://linkedin.com/company/..." />
                </Field>
                <Field label="YouTube" id="setting-youtube">
                  <input className="sett-inp" style={inp} type="text" value={settings.social_youtube}
                    onChange={e => set('social_youtube', e.target.value)} placeholder="https://youtube.com/@..." />
                </Field>
                <SaveRow loading={s3.saving} success={s3.ok} error={s3.err} />
              </form>
            )}
          </Card>

          {/* ── 5. Datos de pago ── */}
          <Card title="Datos de pago" desc="Lo que ve el estudiante al solicitar una inscripción de pago, y lo que recibe por correo. No hay pasarela: el pago es manual.">
            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {skel(180)} {skel(200)} {skel(220, 70)}
              </div>
            ) : (
              <form onSubmit={handleSavePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <Field label="SINPE Móvil" hint="número al que transferir" id="setting-sinpe">
                  <input className="sett-inp" style={inp} type="text" value={settings.sinpe_number}
                    onChange={e => set('sinpe_number', e.target.value)} placeholder="8888 8888" />
                </Field>
                <Field label="Cuenta bancaria" hint="IBAN o número de cuenta" id="setting-bank">
                  <input className="sett-inp" style={inp} type="text" value={settings.bank_account}
                    onChange={e => set('bank_account', e.target.value)} placeholder="CR00 0000 0000 0000 0000 00 · Banco · Titular" />
                </Field>
                <Field label="Instrucciones adicionales" hint="opcional" id="setting-pay-instructions">
                  <textarea className="sett-inp" style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={settings.payment_instructions}
                    onChange={e => set('payment_instructions', e.target.value)}
                    placeholder="Ej: El pago debe hacerse a nombre de Cubo Academy S.A." />
                </Field>
                <Field label="Plazo de activación" hint="se muestra tal cual al estudiante" id="setting-pay-note">
                  <textarea className="sett-inp" style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={settings.payment_note}
                    onChange={e => set('payment_note', e.target.value)}
                    placeholder="Ej: Activamos tu acceso en un plazo de 1 a 2 días hábiles." />
                </Field>
                <p style={{ fontSize: '.74rem', color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
                  El comprobante se pide al correo de contacto configurado en <strong>Página de inicio</strong>
                  {settings.contact_email ? <> (<strong>{settings.contact_email}</strong>)</> : <span style={{ color: '#B45309' }}> — aún sin definir</span>}.
                  Si dejas SINPE y cuenta en blanco, al estudiante se le pedirá escribir a ese correo para coordinar el pago.
                </p>
                <SaveRow loading={s4.saving} success={s4.ok} error={s4.err} />
              </form>
            )}
          </Card>


          {/* ── 6. Textos legales ── */}
          <Card title="Textos legales" desc="Se publican en el pie del sitio. Mientras estén vacíos, la página pública dice que el documento está en preparación y ofrece el contacto — nunca mostramos condiciones inventadas.">
            {loadingInit ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {skel(200, 80)} {skel(200, 80)} {skel(200, 80)}
              </div>
            ) : (
              <form onSubmit={handleSaveLegal} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <p style={{ fontSize: '.78rem', color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '.7rem .9rem', margin: 0, lineHeight: 1.55 }}>
                  Estos documentos tienen efectos legales. Conviene que los revise un abogado antes de publicarlos, sobre todo los plazos y condiciones de reembolso.
                </p>
                <Field label="Términos y condiciones" id="setting-legal-terms">
                  <textarea className="sett-inp" style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }} value={settings.legal_terms}
                    onChange={e => set('legal_terms', e.target.value)} placeholder="Texto completo de los términos y condiciones…" />
                </Field>
                <Field label="Política de privacidad" id="setting-legal-privacy">
                  <textarea className="sett-inp" style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }} value={settings.legal_privacy}
                    onChange={e => set('legal_privacy', e.target.value)} placeholder="Qué datos se recogen, para qué y cómo ejercer derechos…" />
                </Field>
                <Field label="Política de reembolso" id="setting-legal-refund">
                  <textarea className="sett-inp" style={{ ...inp, minHeight: 160, resize: 'vertical', lineHeight: 1.6 }} value={settings.legal_refund}
                    onChange={e => set('legal_refund', e.target.value)} placeholder="En qué casos se reembolsa, en qué plazo y cómo solicitarlo…" />
                </Field>
                <SaveRow loading={s5.saving} success={s5.ok} error={s5.err} />
              </form>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
