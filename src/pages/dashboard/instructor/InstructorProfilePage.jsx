import { useState, useEffect, useRef } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'
import { useAuth } from '../../../context/AuthContext'
import { INSTRUCTOR_NAV } from '../../../config/navigation'
import { Toast } from '../../../components/ui/index'
import { supabase } from '../../../lib/supabase'

const COUNTRIES = ['Costa Rica','México','Colombia','Argentina','Chile','Perú','Ecuador','Guatemala','Honduras','El Salvador','Nicaragua','Panamá','Uruguay','Paraguay','Bolivia','Venezuela','República Dominicana','España','Otro']
const EXP_OPTIONS = [{ value: 2, label: '1-2 años' }, { value: 5, label: '3-5 años' }, { value: 10, label: '6-10 años' }, { value: 15, label: '10+ años' }]

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

export default function InstructorProfilePage() {
  const { navigate } = useNavigation()
  const { profile, user } = useAuth()
  const fileRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [courseCount, setCourseCount] = useState(null)
  const [studentCount, setStudentCount] = useState(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [company, setCompany] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [website, setWebsite] = useState('')
  const [twitter, setTwitter] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (!profile) return
    const parts = (profile.full_name || '').split(' ')
    setFirstName(parts[0] || '')
    setLastName(profile.last_name || parts.slice(1).join(' ') || '')
    setBio(profile.bio || '')
    setPhone(profile.phone || '')
    setCountry(profile.country || '')
    setProfession(profile.profession || '')
    setSpecialty(profile.specialty || '')
    setYearsExp(profile.years_experience ? String(profile.years_experience) : '')
    setCompany(profile.current_company || '')
    setLinkedin(profile.linkedin_url || '')
    setWebsite(profile.website_url || '')
    setTwitter(profile.twitter_url || '')
    setAvatarUrl(profile.avatar_url || '')
  }, [profile])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('courses').select('id', { count: 'exact', head: true })
      .eq('instructor_id', profile.id).eq('status', 'published')
      .then(({ count }) => setCourseCount(count || 0))
    supabase.from('courses').select('id').eq('instructor_id', profile.id)
      .then(async ({ data: courses }) => {
        if (!courses?.length) { setStudentCount(0); return }
        const ids = courses.map(c => c.id)
        const { count } = await supabase.from('enrollments').select('id', { count: 'exact', head: true }).in('course_id', ids)
        setStudentCount(count || 0)
      }).catch(() => setStudentCount(0))
  }, [profile?.id])

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
      specialty: specialty.trim() || null,
      years_experience: yearsExp ? Number(yearsExp) : null,
      current_company: company.trim() || null,
      linkedin_url: linkedin.trim() || null,
      website_url: website.trim() || null,
      twitter_url: twitter.trim() || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    setSaving(false)
    if (error) { showToast('Error al guardar. Intenta de nuevo.'); return }
    showToast('Perfil guardado correctamente.')
  }

  const displayName = [firstName, lastName].filter(Boolean).join(' ') || profile?.full_name || 'Instructor'
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const expLabel = EXP_OPTIONS.find(o => o.value === Number(yearsExp))?.label

  return (
    <DashboardLayout navItems={INSTRUCTOR_NAV}>
      <style>{`
        @media (max-width: 768px) { .ipr-pad { padding: 1.25rem 1rem 2rem !important; } .ipr-grid { grid-template-columns: 1fr !important; } .ipr-2col { grid-template-columns: 1fr !important; } }
        .ipr-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .ipr-sel:focus { border-color: var(--jade) !important; }
        .ipr-ta:focus { border-color: var(--jade) !important; background: white !important; }
        .save-btn-i { padding: .8rem 2rem; background: var(--jade); color: white; border: none; border-radius: 9px; font-size: .92rem; font-weight: 700; cursor: pointer; font-family: var(--sans); transition: opacity .2s; }
        .save-btn-i:hover { opacity: .9; }
        .save-btn-i:disabled { opacity: .6; cursor: not-allowed; }
        .stat-link { display: flex; align-items: center; justify-content: space-between; padding: .5rem .6rem; border-radius: 8px; text-decoration: none; transition: background .15s; }
        .stat-link:hover { background: var(--cream); }
      `}</style>

      <div className="ipr-pad" style={{ padding: '2.5rem 2.5rem 3rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Instructor</p>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.15, margin: 0 }}>Mi perfil</h1>
        </div>

        <form onSubmit={handleSave}>
          <div className="ipr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

            {/* Left: editable sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Personal info */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.25rem' }}>Información personal</h2>

                {/* Avatar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ flexShrink: 0 }}>
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

                <div className="ipr-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Nombre *">
                    <input className="ipr-inp" style={INP} type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="María" />
                  </Field>
                  <Field label="Apellidos">
                    <input className="ipr-inp" style={INP} type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Rodríguez Pérez" />
                  </Field>
                </div>

                <Field label="Correo electrónico">
                  <input style={{ ...INP, background: '#F5F5F0', color: '#9B9894', cursor: 'not-allowed' }} type="email" value={user?.email || ''} readOnly />
                </Field>

                <Field label="Biografía profesional" hint="Describe tu trayectoria y experiencia (máx. 300 caracteres)">
                  <textarea className="ipr-ta" style={{ ...INP, resize: 'vertical', minHeight: 100 }} maxLength={300}
                    value={bio} onChange={e => setBio(e.target.value)}
                    placeholder="Soy consultor con X años de experiencia en..." />
                  <div style={{ fontSize: '.68rem', color: '#B5B2AB', textAlign: 'right', marginTop: '.2rem' }}>{bio.length}/300</div>
                </Field>

                <div className="ipr-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Teléfono">
                    <input className="ipr-inp" style={INP} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+506 8888-0000" />
                  </Field>
                  <Field label="País">
                    <select className="ipr-sel" style={{ ...INP, cursor: 'pointer' }} value={country} onChange={e => setCountry(e.target.value)}>
                      <option value="">Selecciona</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Professional profile */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.1rem' }}>Perfil profesional</h2>
                <div className="ipr-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Profesión / Título">
                    <input className="ipr-inp" style={INP} type="text" value={profession} onChange={e => setProfession(e.target.value)} placeholder="Consultor de procesos" />
                  </Field>
                  <Field label="Especialidad">
                    <input className="ipr-inp" style={INP} type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Gestión de procesos BPM" />
                  </Field>
                </div>
                <div className="ipr-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <Field label="Años de experiencia">
                    <select className="ipr-sel" style={{ ...INP, cursor: 'pointer' }} value={yearsExp} onChange={e => setYearsExp(e.target.value)}>
                      <option value="">Selecciona</option>
                      {EXP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Empresa actual">
                    <input className="ipr-inp" style={INP} type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Consultora XYZ" />
                  </Field>
                </div>
              </div>

              {/* Social links */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.1rem' }}>Redes y contacto</h2>
                <Field label="LinkedIn">
                  <input className="ipr-inp" style={INP} type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/tu-perfil" />
                </Field>
                <Field label="Sitio web / Portafolio">
                  <input className="ipr-inp" style={INP} type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://tusitioweb.com" />
                </Field>
                <Field label="Twitter / X">
                  <input className="ipr-inp" style={INP} type="url" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/tu_usuario" />
                </Field>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="save-btn-i" disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </div>

            {/* Right: public preview + stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Public preview card */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '.85rem 1.25rem', background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  <span style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--jade)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Vista previa pública</span>
                </div>
                <div style={{ background: 'white', padding: '1.75rem 1.4rem', textAlign: 'center' }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .9rem', display: 'block', border: '2px solid var(--border)' }} />
                    : <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto .9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'white', background: 'var(--jade)' }}>{initials}</div>
                  }
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.2rem' }}>{displayName}</div>
                  {specialty && <div style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 500, marginBottom: '.5rem', letterSpacing: '.02em' }}>{specialty}</div>}
                  {bio && <div style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6, marginBottom: '.75rem' }}>{bio.slice(0, 90)}{bio.length > 90 ? '…' : ''}</div>}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                    {expLabel && <span style={{ fontSize: '.7rem', color: 'var(--text-2)', background: 'var(--cream)', padding: '3px 10px', borderRadius: 10 }}>{expLabel}</span>}
                    {country && <span style={{ fontSize: '.7rem', color: 'var(--text-2)', background: 'var(--cream)', padding: '3px 10px', borderRadius: 10 }}>{country}</span>}
                  </div>
                  {(linkedin || website) && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '.75rem', marginTop: '.85rem', flexWrap: 'wrap' }}>
                      {linkedin && (
                        <a href={linkedin} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--jade)', textDecoration: 'none', fontWeight: 500 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                          LinkedIn
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.78rem', color: 'var(--jade)', textDecoration: 'none', fontWeight: 500 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          Web
                        </a>
                      )}
                    </div>
                  )}
                  {!bio && !specialty && (
                    <p style={{ fontSize: '.76rem', color: '#C5C2BB', fontStyle: 'italic', marginTop: '.5rem' }}>Completa tu perfil para que los estudiantes puedan conocerte.</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Mi actividad</h3>
                </div>
                <div style={{ padding: '.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  {[
                    { label: 'Cursos publicados', value: courseCount === null ? '…' : courseCount, key: 'cursos' },
                    { label: 'Estudiantes totales', value: studentCount === null ? '…' : studentCount, key: 'estudiantes' },
                  ].map(item => (
                    <button key={item.label} onClick={() => navigate(item.key)} className="stat-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', padding: 0, width: '100%' }}>
                      <span style={{ fontSize: '.84rem', color: 'var(--text-2)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)' }}>{item.value}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick action */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                <button onClick={() => navigate('curso-form', { courseId: null })}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '.7rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 600, border: 'none', cursor: 'pointer', width: '100%' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Crear nuevo curso
                </button>
                <button onClick={() => navigate('cursos')}
                  style={{ display: 'block', textAlign: 'center', marginTop: '.65rem', fontSize: '.8rem', color: 'var(--jade)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', fontWeight: 500, width: '100%' }}>
                  Gestionar mis cursos →
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <Toast message={toast} />
    </DashboardLayout>
  )
}
