import { useState, useEffect } from 'react'
import { useNavigation } from '../../context/NavigationContext'
import { supabase } from '../../lib/supabase'

const COUNTRIES = ['Costa Rica','México','Colombia','Argentina','Chile','Perú','Ecuador','Guatemala','Honduras','El Salvador','Nicaragua','Panamá','Uruguay','Paraguay','Bolivia','Venezuela','República Dominicana','España','Otro']
const EXP_MAP = { '1-2': 2, '3-5': 5, '6-10': 10, '10+': 15 }
const LEVEL_MAP = { 'Básico': 'beginner', 'Intermedio': 'intermediate', 'Avanzado': 'advanced' }

const STEPS = ['Información personal', 'Sobre ti', 'Propuesta de curso']

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: '2.5rem' }}>
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.35rem', width: 80 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: done || active ? 'var(--jade)' : '#E8E6E0', color: done || active ? 'white' : '#B5B2AB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.78rem', fontWeight: 700, flexShrink: 0, transition: 'background .3s' }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : n}
              </div>
              <span style={{ fontSize: '.68rem', color: active ? 'var(--jade)' : done ? 'var(--jade)' : '#B5B2AB', fontWeight: active ? 600 : 400, textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? 'var(--jade)' : '#E8E6E0', marginTop: 15, flexShrink: 0, transition: 'background .3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const INP_STYLE = { width: '100%', padding: '.72rem 1rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--carbon)', fontSize: '15px', outline: 'none', fontFamily: 'var(--sans)', boxSizing: 'border-box', transition: 'border-color .2s, background .2s' }
const LBL_STYLE = { display: 'block', fontSize: '.72rem', fontWeight: 600, color: '#9B9894', marginBottom: '.35rem', letterSpacing: '.05em', textTransform: 'uppercase' }
const FIELD_STYLE = { marginBottom: '.95rem' }

function Fld({ label, children }) {
  return <div style={FIELD_STYLE}><label style={LBL_STYLE}>{label}</label>{children}</div>
}

export default function InstructorApplicationPage() {
  const { navigate } = useNavigation()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [categories, setCategories] = useState([])

  // Step 1
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')
  const [profession, setProfession] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [company, setCompany] = useState('')

  // Step 2
  const [bio, setBio] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [cvUrl, setCvUrl] = useState('')

  // Step 3
  const [courseTitle, setCourseTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [courseDesc, setCourseDesc] = useState('')
  const [courseLevel, setCourseLevel] = useState('')
  const [chkDecl, setChkDecl] = useState(false)
  const [chkTerms, setChkTerms] = useState(false)
  const [chkReview, setChkReview] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  function validateStep1() {
    if (!nombre.trim()) return 'Ingresa tu nombre.'
    if (!apellidos.trim()) return 'Ingresa tus apellidos.'
    if (!email.trim()) return 'Ingresa tu correo electrónico.'
    if (!phone.trim()) return 'Ingresa tu teléfono.'
    if (!country) return 'Selecciona tu país.'
    if (!profession.trim()) return 'Ingresa tu profesión.'
    if (!specialty.trim()) return 'Ingresa tu especialidad.'
    if (!yearsExp) return 'Selecciona tus años de experiencia.'
    return null
  }

  function validateStep2() {
    if (!bio.trim()) return 'Escribe tu biografía.'
    if (!cvUrl.trim()) return 'Pega el enlace a tu documento.'
    return null
  }

  function validateStep3() {
    if (!courseTitle.trim()) return 'Ingresa el título del curso.'
    if (!courseDesc.trim()) return 'Ingresa la descripción del curso.'
    if (!courseLevel) return 'Selecciona el nivel del curso.'
    if (!chkDecl) return 'Debes confirmar que la información es verdadera.'
    if (!chkTerms) return 'Debes aceptar los términos y condiciones.'
    if (!chkReview) return 'Debes aceptar la revisión de tu perfil.'
    return null
  }

  function goNext() {
    const err = step === 1 ? validateStep1() : validateStep2()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setError('')
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateStep3()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const { error: dbErr } = await supabase.from('instructor_applications').insert({
      full_name: nombre.trim(),
      last_name: apellidos.trim(),
      email: email.trim(),
      phone: phone.trim(),
      country,
      profession: profession.trim(),
      specialty: specialty.trim(),
      years_experience: EXP_MAP[yearsExp],
      current_company: company.trim() || null,
      bio: bio.trim(),
      linkedin_url: linkedin.trim() || null,
      cv_document_url: cvUrl.trim(),
      course_title: courseTitle.trim(),
      course_category_id: categoryId || null,
      course_description: courseDesc.trim(),
      course_level: LEVEL_MAP[courseLevel],
    })

    setLoading(false)
    if (dbErr) { setError('Error al enviar la solicitud. Intenta de nuevo.'); return }
    setSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const selStyle = { ...INP_STYLE, cursor: 'pointer' }
  const taStyle = { ...INP_STYLE, resize: 'vertical', minHeight: 100 }
  const btnBack = { padding: '.8rem 1.5rem', background: 'white', border: '1px solid var(--border)', borderRadius: 9, fontSize: '.9rem', fontWeight: 600, color: 'var(--carbon)', cursor: 'pointer', fontFamily: 'var(--sans)' }
  const btnNext = { padding: '.8rem 1.75rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.9rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }
  const btnSubmit = { width: '100%', padding: '.9rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.95rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'opacity .2s', opacity: loading ? .6 : 1 }
  const chkLabel = { display: 'flex', alignItems: 'flex-start', gap: '.6rem', fontSize: '.85rem', color: 'var(--carbon)', cursor: 'pointer', marginBottom: '.7rem', lineHeight: 1.5 }

  if (submitted) {
    return (
      <>
        {/* Navbar */}
        <div style={{ paddingTop: 66 }} />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', background: 'var(--cream)' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ width: 80, height: 80, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.75rem' }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.75rem' }}>¡Solicitud enviada con éxito!</h1>
            <p style={{ fontSize: '.95rem', color: 'var(--text-2)', lineHeight: 1.7, marginBottom: '2rem' }}>
              Revisaremos tu perfil y propuesta de curso en los próximos días.<br />
              Te contactaremos al correo <strong style={{ color: 'var(--carbon)' }}>{email}</strong>.
            </p>
            <button onClick={() => navigate('landing')} style={{ display: 'inline-block', padding: '.85rem 2rem', background: 'var(--jade)', color: 'white', borderRadius: 9, fontFamily: 'var(--sans)', fontSize: '.93rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
              Volver al inicio
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
        .app-inp:focus { border-color: var(--jade) !important; background: white !important; }
        .app-chk { width: 17px; height: 17px; accent-color: var(--jade); cursor: pointer; flex-shrink: 0; margin-top: 2px; }
        .app-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        @media (max-width: 600px) { .app-grid2 { grid-template-columns: 1fr; } }
      `}</style>

      {/* Hero */}
      <div style={{ paddingTop: 66 }} />
      <div style={{ background: 'var(--carbon)', padding: '4rem 5% 3.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.73rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.5rem' }}>Comparte tu expertise</p>
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 700, color: 'white', lineHeight: 1.15, marginBottom: '.9rem', maxWidth: 620, margin: '0 auto .9rem' }}>
          Conviértete en instructor de Cubo Academy
        </h1>
        <p style={{ fontSize: '.95rem', color: 'rgba(255,255,255,.6)', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
          Diseñado para consultores activos que quieren convertir su experiencia real en formación de impacto.
        </p>
      </div>

      {/* Form section */}
      <div style={{ background: 'var(--cream)', minHeight: 'calc(100vh - 66px)', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <StepBar current={step} />

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2.25rem', boxShadow: '0 4px 24px rgba(23,26,28,.07)' }}>

            {error && (
              <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 8, padding: '.65rem 1rem', fontSize: '.82rem', marginBottom: '1.25rem' }}>
                {error}
              </div>
            )}

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.5rem' }}>Información personal y perfil profesional</h2>
                <div className="app-grid2">
                  <Fld label="Nombre *">
                    <input className="app-inp" style={INP_STYLE} type="text" placeholder="Juan" value={nombre} onChange={e => setNombre(e.target.value)} />
                  </Fld>
                  <Fld label="Apellidos *">
                    <input className="app-inp" style={INP_STYLE} type="text" placeholder="García López" value={apellidos} onChange={e => setApellidos(e.target.value)} />
                  </Fld>
                </div>
                <div className="app-grid2">
                  <Fld label="Correo electrónico *">
                    <input className="app-inp" style={INP_STYLE} type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </Fld>
                  <Fld label="Teléfono *">
                    <input className="app-inp" style={INP_STYLE} type="tel" placeholder="+506 8888-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                  </Fld>
                </div>
                <Fld label="País *">
                  <select className="app-inp" style={selStyle} value={country} onChange={e => setCountry(e.target.value)}>
                    <option value="">Selecciona tu país</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Fld>
                <div className="app-grid2">
                  <Fld label="Profesión *">
                    <input className="app-inp" style={INP_STYLE} type="text" placeholder="ej. Consultor financiero" value={profession} onChange={e => setProfession(e.target.value)} />
                  </Fld>
                  <Fld label="Especialidad *">
                    <input className="app-inp" style={INP_STYLE} type="text" placeholder="ej. Finanzas personales" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                  </Fld>
                </div>
                <div className="app-grid2">
                  <Fld label="Años de experiencia *">
                    <select className="app-inp" style={selStyle} value={yearsExp} onChange={e => setYearsExp(e.target.value)}>
                      <option value="">Selecciona</option>
                      {Object.keys(EXP_MAP).map(k => <option key={k} value={k}>{k} años</option>)}
                    </select>
                  </Fld>
                  <Fld label="Empresa actual (opcional)">
                    <input className="app-inp" style={INP_STYLE} type="text" placeholder="ej. Consultora XYZ" value={company} onChange={e => setCompany(e.target.value)} />
                  </Fld>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                  <button onClick={goNext} style={btnNext}>Siguiente →</button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.5rem' }}>Sobre ti</h2>
                <Fld label={`Biografía corta * (${bio.length}/300)`}>
                  <textarea className="app-inp" style={{ ...taStyle, minHeight: 120 }} placeholder="Cuéntanos sobre tu experiencia, logros y por qué serías un gran instructor..." maxLength={300} value={bio} onChange={e => setBio(e.target.value)} />
                </Fld>
                <Fld label="LinkedIn o portafolio (opcional)">
                  <input className="app-inp" style={INP_STYLE} type="url" placeholder="https://linkedin.com/in/tu-perfil" value={linkedin} onChange={e => setLinkedin(e.target.value)} />
                </Fld>
                <Fld label="Enlace a tu CV o documento de respaldo *">
                  <input className="app-inp" style={INP_STYLE} type="url" placeholder="https://drive.google.com/file/..." value={cvUrl} onChange={e => setCvUrl(e.target.value)} />
                  <p style={{ fontSize: '.75rem', color: '#B5B2AB', marginTop: '.4rem', lineHeight: 1.5 }}>
                    Sube tu CV, título o certificación a Google Drive o Dropbox y pega el enlace aquí.
                  </p>
                </Fld>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
                  <button onClick={goBack} style={btnBack}>← Atrás</button>
                  <button onClick={goNext} style={btnNext}>Siguiente →</button>
                </div>
              </>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmit}>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '1.5rem' }}>Propuesta de curso</h2>
                <Fld label="Título del primer curso *">
                  <input className="app-inp" style={INP_STYLE} type="text" placeholder="ej. Finanzas personales para profesionales" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} />
                </Fld>
                <div className="app-grid2">
                  <Fld label="Categoría">
                    <select className="app-inp" style={selStyle} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                      <option value="">Selecciona (opcional)</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </Fld>
                  <Fld label="Nivel *">
                    <select className="app-inp" style={selStyle} value={courseLevel} onChange={e => setCourseLevel(e.target.value)}>
                      <option value="">Selecciona</option>
                      {Object.keys(LEVEL_MAP).map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </Fld>
                </div>
                <Fld label="Descripción del curso *">
                  <textarea className="app-inp" style={{ ...taStyle, minHeight: 110 }} placeholder="Describe de qué trata el curso, a quién va dirigido y qué aprenderán los estudiantes..." value={courseDesc} onChange={e => setCourseDesc(e.target.value)} />
                </Fld>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '.5rem', marginBottom: '1.25rem' }}>
                  <label style={chkLabel}>
                    <input type="checkbox" className="app-chk" checked={chkDecl} onChange={e => setChkDecl(e.target.checked)} />
                    Declaro que la información proporcionada es verdadera.
                  </label>
                  <label style={chkLabel}>
                    <input type="checkbox" className="app-chk" checked={chkTerms} onChange={e => setChkTerms(e.target.checked)} />
                    Acepto los <a href="#" style={{ color: 'var(--jade)' }}>términos y condiciones</a> de Cubo Academy.
                  </label>
                  <label style={chkLabel}>
                    <input type="checkbox" className="app-chk" checked={chkReview} onChange={e => setChkReview(e.target.checked)} />
                    Acepto la revisión manual de mi perfil por el equipo de Cubo Academy.
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  <button type="submit" style={btnSubmit} disabled={loading}>
                    {loading ? 'Enviando…' : 'Enviar solicitud'}
                  </button>
                  <button type="button" onClick={goBack} style={{ ...btnBack, width: '100%', textAlign: 'center' }}>← Atrás</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
