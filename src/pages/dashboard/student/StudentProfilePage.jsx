import { useState, useEffect, useRef } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { STUDENT_NAV } from '../../../config/navigation'
import { Toast } from '../../../components/ui/index'
import { supabase } from '../../../lib/supabase'

const COUNTRIES = ['Costa Rica','México','Colombia','Argentina','Chile','Perú','Ecuador','Guatemala','Honduras','El Salvador','Nicaragua','Panamá','Uruguay','Paraguay','Bolivia','Venezuela','República Dominicana','España','Otro']

const INP = { width: '100%', padding: '.7rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--carbon)', fontSize: '15px', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .2s, background .2s' }
const LBL = { display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: '.95rem' }}>
      <label style={LBL}>{label}</label>
      {hint && <p style={{ fontSize: '.72rem', color: '#B5B2AB', marginBottom: '.3rem', marginTop: '-.1rem' }}>{hint}</p>}
      {children}
    </div>
  )
}

function ReadOnlySection({ icon, title, text, onCtaClick, cta }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{title}</h3>
      </div>
      <div style={{ padding: '1.75rem 1.25rem', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto .75rem', color: 'var(--jade)' }}>{icon}</div>
        <p style={{ fontSize: '.8rem', color: 'var(--text-2)', marginBottom: cta ? '.9rem' : 0, lineHeight: 1.55, fontWeight: 300 }}>{text}</p>
        {cta && <button onClick={onCtaClick} style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--jade)', background: 'transparent', border: '1px solid rgba(22,125,120,.3)', padding: '.4rem .9rem', borderRadius: 7, cursor: 'pointer', fontFamily: 'var(--sans)' }}>{cta}</button>}
      </div>
    </div>
  )
}

export default function StudentProfilePage() {
  const { navigate } = useNavigation()
  const { profile, user } = useAuth()
  const fileRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Form state — initialised from profile
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [company, setCompany] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Interests as array of strings
  const [interests, setInterests] = useState([])
  const [interestInput, setInterestInput] = useState('')

  useEffect(() => {
    if (!profile) return
    const parts = (profile.full_name || '').split(' ')
    setFirstName(parts[0] || '')
    setLastName(profile.last_name || parts.slice(1).join(' ') || '')
    setBio(profile.bio || '')
    setPhone(profile.phone || '')
    setCountry(profile.country || '')
    setProfession(profile.profession || '')
    setCompany(profile.current_company || '')
    setLinkedin(profile.linkedin_url || '')
    setWebsite(profile.website_url || '')
    setTwitter(profile.twitter_url || '')
    setAvatarUrl(profile.avatar_url || '')
    setInterests(profile.interests || [])
  }, [profile])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setAvatarUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('course-images').upload(path, file, { upsert: true })
    if (upErr) { showToast('Error al subir la imagen.'); setAvatarUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(path)
    setAvatarUrl(publicUrl)
    setAvatarUploading(false)
    showToast('Foto actualizada. Guarda los cambios para confirmar.')
  }

  function addInterest() {
    const val = interestInput.trim()
    if (val && !interests.includes(val)) setInterests(prev => [...prev, val])
    setInterestInput('')
  }

  function handleInterestKey(e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addInterest() }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || profile?.full_name
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      last_name: lastName.trim() || null,
      bio: bio.trim() || null,
      phone: phone.trim() || null,
      country: country || null,
      profession: profession.trim() || null,
      current_company: company.trim() || null,
      linkedin_url: linkedin.trim() || null,
      website_url: website.trim() || null,
      twitter_url: twitter.trim() || null,
      avatar_url: avatarUrl || null,
      interests: interests.length > 0 ? interests : null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    if (error) { showToast('Error al guardar. Intenta de nuevo.'); return }
    showToast('Perfil guardado correctamente.')
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Estudiante'
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  const STAR_ICON = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
  const CERT_ICON = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
  const BOOK_ICON = <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>

  return (
    <DashboardLayout navItems={STUDENT_NAV}>
      <style>{`
        @media (max-width: 768px) { .prf-pad { padding: 1.25rem 1rem 2rem !important; } .prf-grid { grid-template-columns: 1fr !important; } .prf-name-row { grid-template-columns: 1fr !important; } }
        .prf-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .prf-sel:focus { border-color: var(--jade) !important; }
        .prf-ta:focus { border-color: var(--jade) !important; background: white !important; }
        .interest-chip { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .65rem; background: var(--jade-soft); border: 1px solid var(--jade-light); border-radius: 20px; font-size: .76rem; font-weight: 500; color: var(--jade-dark); }
        .save-btn { padding: .8rem 2rem; background: var(--jade); color: white; border: none; border-radius: 9px; font-size: .92rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: opacity .2s; }
        .save-btn:hover { opacity: .9; }
        .save-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div className="prf-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mi perfil</h1>
        </div>

        <form onSubmit={handleSave}>
          <div className="prf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left: editable */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Avatar + nombre */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>Información personal</h2>

                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                      : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, color: 'white' }}>{initials}</div>
                    }
                  </div>
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    <button type="button" onClick={() => fileRef.current?.click()}
                      style={{ padding: '.45rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 7, fontSize: '.8rem', fontWeight: 600, color: 'var(--carbon)', cursor: avatarUploading ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)' }}
                      disabled={avatarUploading}>
                      {avatarUploading ? 'Subiendo…' : 'Cambiar foto'}
                    </button>
                    <p style={{ fontSize: '.72rem', color: '#B5B2AB', marginTop: '.35rem' }}>JPG, PNG o GIF. Máx 2 MB.</p>
                  </div>
                </div>

                <div className="prf-name-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Nombre *">
                    <input className="prf-inp" style={INP} type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                  </Field>
                  <Field label="Apellidos">
                    <input className="prf-inp" style={INP} type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="García López" />
                  </Field>
                </div>

                <Field label="Correo electrónico">
                  <input style={{ ...INP, background: '#F5F5F0', color: '#9B9894', cursor: 'not-allowed' }} type="email" value={user?.email || ''} readOnly />
                </Field>

                <Field label="Biografía" hint="Cuéntanos quién eres (máx. 300 caracteres)">
                  <textarea className="prf-ta" style={{ ...INP, resize: 'vertical', minHeight: 90 }} maxLength={300}
                    value={bio} onChange={e => setBio(e.target.value)} placeholder="Soy profesional en..." />
                  <div style={{ fontSize: '.68rem', color: '#B5B2AB', textAlign: 'right', marginTop: '.2rem' }}>{bio.length}/300</div>
                </Field>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Teléfono">
                    <input className="prf-inp" style={INP} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+506 8888-0000" />
                  </Field>
                  <Field label="País">
                    <select className="prf-sel" style={{ ...INP, cursor: 'pointer' }} value={country} onChange={e => setCountry(e.target.value)}>
                      <option value="">Selecciona</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Intereses */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.1rem' }}>Intereses</h2>
                {interests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem', marginBottom: '1rem' }}>
                    {interests.map(tag => (
                      <span key={tag} className="interest-chip">
                        {tag}
                        <button type="button" onClick={() => setInterests(prev => prev.filter(t => t !== tag))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--jade)', opacity: .7 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <input className="prf-inp" style={{ ...INP, flex: 1 }} type="text" placeholder="Agrega un interés y presiona Enter…"
                    value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={handleInterestKey} />
                  <button type="button" onClick={addInterest}
                    style={{ padding: '.7rem 1rem', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', borderRadius: 8, fontSize: '.82rem', fontWeight: 600, color: 'var(--jade)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--sans)' }}>
                    + Agregar
                  </button>
                </div>
                <p style={{ fontSize: '.72rem', color: '#B5B2AB', marginTop: '.4rem' }}>Ej: Análisis de datos, Gestión de procesos, Liderazgo</p>
              </div>

              {/* Perfil profesional */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.1rem' }}>Perfil profesional</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Profesión / Cargo">
                    <input className="prf-inp" style={INP} type="text" value={profession} onChange={e => setProfession(e.target.value)} placeholder="Analista de procesos" />
                  </Field>
                  <Field label="Empresa actual">
                    <input className="prf-inp" style={INP} type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Empresa XYZ" />
                  </Field>
                </div>
              </div>

              {/* Redes sociales */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.1rem' }}>Redes y contacto</h2>
                <Field label="LinkedIn">
                  <input className="prf-inp" style={INP} type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/tu-perfil" />
                </Field>
                <Field label="Sitio web / Portafolio">
                  <input className="prf-inp" style={INP} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://tusitioweb.com" />
                </Field>
                <Field label="Twitter / X">
                  <input className="prf-inp" style={INP} type="url" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/tu_usuario" />
                </Field>
              </div>

              {/* Save button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="save-btn" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {/* Right: read-only */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile card preview */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .85rem', display: 'block', border: '2px solid var(--border)' }} />
                  : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'white', margin: '0 auto .85rem' }}>{initials}</div>
                }
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--carbon)' }}>{[firstName, lastName].filter(Boolean).join(' ') || displayName}</div>
                {profession && <div style={{ fontSize: '.78rem', color: 'var(--text-2)', marginTop: '.25rem' }}>{profession}{company ? ` · ${company}` : ''}</div>}
                <div style={{ display: 'inline-block', marginTop: '.65rem', fontSize: '.68rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' }}>Estudiante</div>
                {interests.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.35rem', justifyContent: 'center', marginTop: '1rem' }}>
                    {interests.slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: '.68rem', padding: '2px 8px', borderRadius: 10, background: '#F5F5F0', color: 'var(--text-2)' }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <ReadOnlySection
                icon={STAR_ICON}
                title="Mis logros"
                text="Completa cursos y desafíos para desbloquear logros."
                cta="Ver sección"
                onCtaClick={() => navigate('logros')}
              />
              <ReadOnlySection
                icon={CERT_ICON}
                title="Certificados"
                text="Tus certificados digitales aparecerán aquí."
                cta="Ver sección"
                onCtaClick={() => navigate('certificados')}
              />
              <ReadOnlySection
                icon={BOOK_ICON}
                title="Cursos completados"
                text="Los cursos que hayas finalizado se mostrarán aquí."
                cta="Explorar cursos"
                to="/cursos"
              />
            </div>
          </div>
        </form>
      </div>

      <Toast message={toast} />
    </DashboardLayout>
  )
}
