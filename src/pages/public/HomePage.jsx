import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const TRACKS = [
  {
    name: 'Gestión de Procesos',
    desc: 'Modelado BPMN, mejora continua, automatización y rediseño de operaciones. Aprende a analizar, optimizar y documentar procesos desde una perspectiva consultiva.',
    count: '14 cursos disponibles',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"/>
        <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M2 12h2"/>
      </svg>
    ),
  },
  {
    name: 'Datos & Analytics',
    desc: 'Power BI, SQL, storytelling con datos y cultura analítica. De la captura al insight, formación práctica para tomar decisiones basadas en evidencia.',
    count: '18 cursos disponibles',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    name: 'Liderazgo Consultivo',
    desc: 'Gestión del cambio, comunicación ejecutiva y facilitación de alto impacto. El liderazgo que las organizaciones modernas realmente necesitan.',
    count: '12 cursos disponibles',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--jade)" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
      </svg>
    ),
  },
]

const DIFF_ITEMS = [
  {
    title: 'Diseñado por consultores activos',
    desc: 'No académicos — profesionales que hoy ejecutan proyectos reales en empresas. Lo que enseñan, lo practican.',
  },
  {
    title: 'Casos del mundo real',
    desc: 'Cada curso incluye casos anonimizados de proyectos reales, plantillas usadas en campo y ejercicios aplicables al día siguiente.',
  },
  {
    title: 'Tres roles, un ecosistema',
    desc: 'Estudiantes, instructores y administradores tienen experiencias distintas y profundas. No es una plataforma genérica reciclada.',
  },
  {
    title: 'Enfoque latinoamericano',
    desc: 'Los contextos culturales y organizacionales importan. Contenidos diseñados para la realidad empresarial de la región.',
  },
]

const COURSES = [
  {
    title: 'Power BI para Decisiones Ejecutivas',
    desc: 'Dashboards que cuentan historias y generan acción. Desde modelo de datos hasta storytelling visual.',
    track: 'Datos',
    hours: '16 horas',
    level: 'Intermedio',
    modules: '8 módulos',
    instructor: 'María Rojas',
    initials: 'MR',
    color: 'var(--jade)',
    featured: false,
    bg: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)',
  },
  {
    title: 'Modelado BPMN 2.0 Aplicado',
    desc: 'Documenta y optimiza procesos con el estándar internacional. Casos reales de banca, salud y manufactura.',
    track: 'Destacado',
    hours: '12 horas',
    level: 'Básico',
    modules: '6 módulos',
    instructor: 'Carlos Arias',
    initials: 'CA',
    color: '#C96E4B',
    featured: true,
    bg: 'linear-gradient(140deg,#0d3035 0%,#082028 100%)',
  },
  {
    title: 'Gestión del Cambio Organizacional',
    desc: 'Metodología ADKAR y enfoques prácticos para liderar transformaciones sin fracasar en el intento.',
    track: 'Liderazgo',
    hours: '20 horas',
    level: 'Avanzado',
    modules: '10 módulos',
    instructor: 'Sofía Mendoza',
    initials: 'LV',
    color: 'var(--jade-dark)',
    featured: false,
    bg: 'linear-gradient(140deg,#0d2a32 0%,#081a22 100%)',
  },
]

const HOW_STEPS = [
  { num: '1', title: 'Crea tu cuenta', desc: 'Regístrate como estudiante o instructor. En 2 minutos ya estás adentro.' },
  { num: '2', title: 'Explora el catálogo', desc: 'Filtra por área, nivel o duración. Cada curso incluye una muestra gratuita.' },
  { num: '3', title: 'Aprende a tu ritmo', desc: 'Video, recursos descargables y ejercicios prácticos. Sin fechas límite.' },
  { num: '4', title: 'Certifícate', desc: 'Certificado digital avalado por Grupo Cubo 130. Listo para tu perfil.' },
]

const INSTRUCTORS = [
  { name: 'María Rojas', role: 'Datos & Analytics', bio: '12 años implementando soluciones BI en banca y retail.', initials: 'MR', bg: 'var(--jade)' },
  { name: 'Carlos Arias', role: 'Gestión de Procesos', bio: 'Especialista en BPM con más de 80 proyectos de mejora.', initials: 'CA', bg: '#C96E4B' },
  { name: 'Sofía Mendoza', role: 'Liderazgo & Cambio', bio: 'Coach ejecutiva. Acompañó transformaciones en más de 30 empresas.', initials: 'LV', bg: 'var(--jade-dark)' },
  { name: 'Jorge Peñaranda', role: 'Estrategia de Datos', bio: 'Ex-director de inteligencia de negocios en Fortune 500.', initials: 'JP', bg: '#104447' },
]

const TESTIMONIALS = [
  { text: '"Tomé el curso de BPMN y al mes siguiente lo estaba aplicando en un rediseño real. No hay otro lugar donde aprendas esto tan aplicado."', name: 'Andrea Gutiérrez', role: 'Analista de Procesos, ICE', initials: 'AG' },
  { text: '"Por fin formación que no está desconectada de la realidad. Los casos de estudio son exactamente los problemas que enfrentamos a diario."', name: 'Rodrigo Mora', role: 'Gerente TI, Grupo Bimbo CR', initials: 'RM' },
  { text: '"La plataforma es intuitiva y el contenido es denso en el buen sentido. Cada hora aprendes algo accionable."', name: 'Sofía Chavarría', role: 'Directora RH, BAC Credomatic', initials: 'SC' },
]

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const vp = window.innerHeight
    els.forEach(el => {
      if (el.getBoundingClientRect().top > vp * 0.95) {
        el.classList.add('will-animate')
      }
    })
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible')
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('.reveal.will-animate').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

const ROTATING_WORDS = ['organizaciones', 'equipos', 'líderes', 'empresas']

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  useReveal()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false)
      setTimeout(() => {
        setWordIndex(i => (i + 1) % ROTATING_WORDS.length)
        setWordVisible(true)
      }, 520)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setTimeout(() => {
      document.querySelectorAll('.progress-fill').forEach(bar => {
        const w = bar.style.width
        bar.style.width = '0'
        setTimeout(() => { bar.style.width = w }, 100)
      })
    }, 600)
  }, [])

  return (
    <>
      <style>{`
        .reveal { opacity: 1; transform: none; }
        .reveal.will-animate { opacity: 0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .progress-fill { transition: width .8s ease; }
        .track-card { position: relative; overflow: hidden; transition: background .25s; }
        .track-card::before { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: var(--jade); transform: scaleX(0); transform-origin: left; transition: transform .35s ease; }
        .track-card:hover { background: var(--jade-soft) !important; }
        .track-card:hover::before { transform: scaleX(1); }
        .course-card { transition: transform .22s, box-shadow .22s, border-color .22s; cursor: pointer; }
        .course-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(23,26,28,.1); }
        .inst-card { transition: border-color .25s, box-shadow .25s; }
        .inst-card:hover { border-color: rgba(22,125,120,.25); box-shadow: 0 6px 24px rgba(23,26,28,.07); }
        .btn-course { transition: background .2s, color .2s, border-color .2s; }
        .btn-course:hover { background: var(--jade); color: white; border-color: var(--jade); }
        .metric-card { transition: background .25s; }
        .metric-card:hover { background: rgba(255,255,255,.09) !important; }
        /* ── Responsive ── */
        @media (max-width: 900px) {
          .courses-grid { grid-template-columns: repeat(2,1fr) !important; }
          .inst-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 6rem 5% 3.5rem !important; min-height: unset !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hero-metrics { flex-direction: row !important; gap: .75rem !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .hero-metrics .metric-card { padding: 1rem 1.2rem !important; flex: 0 0 auto; min-width: 160px; }
          .section-pad { padding: 3.5rem 5% !important; }
          .tracks-grid { grid-template-columns: 1fr !important; }
          .diff-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .courses-grid { grid-template-columns: 1fr !important; }
          .courses-header-bar { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .how-grid { grid-template-columns: repeat(2,1fr) !important; gap: 2rem 1rem !important; }
          .how-connector { display: none !important; }
          .inst-grid { grid-template-columns: repeat(2,1fr) !important; }
          .test-grid { grid-template-columns: 1fr !important; }
          .cta-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .cta-right { align-items: flex-start !important; }
        }
        @media (max-width: 480px) {
          .how-grid { grid-template-columns: 1fr !important; }
          .hero-metrics { flex-direction: column !important; }
          .hero-metrics .metric-card { min-width: unset; }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(60px,-40px) scale(1.08); }
          66% { transform: translate(-30px,50px) scale(.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40% { transform: translate(-70px,30px) scale(1.12); }
          70% { transform: translate(40px,-60px) scale(.92); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(50px,60px) scale(1.06); }
        }
        .rotating-word {
          display: inline-block;
          position: relative;
          overflow: hidden;
          vertical-align: bottom;
        }
        .rotating-word-ghost {
          visibility: hidden;
          display: inline-block;
        }
        .rotating-word-visible {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          display: inline-block;
          transition: opacity .5s ease, transform .5s ease;
        }
        .rotating-word-visible.out {
          opacity: 0;
          transform: translateY(-100%);
        }
        .rotating-word-visible.in {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-section" style={{ minHeight: '100vh', background: 'var(--jade-dark)', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '8rem 5% 5rem' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'rgba(22,125,120,.18)', filter: 'blur(90px)', top: '-10%', left: '-5%', animation: 'orb1 14s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,125,120,.13)', filter: 'blur(70px)', top: '30%', right: '5%', animation: 'orb2 18s ease-in-out infinite', animationDelay: '-6s' }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(90,191,186,.08)', filter: 'blur(60px)', bottom: '0%', left: '40%', animation: 'orb3 22s ease-in-out infinite', animationDelay: '-11s' }} />
        </div>
        <div className="hero-grid" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '4rem', alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(90,191,186,.75)', marginBottom: '1.4rem' }}>
              <span style={{ width: 16, height: 1, background: 'rgba(232,243,242,.4)', display: 'inline-block' }} />
              Formación diseñada por consultores
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.6rem,4.2vw,4rem)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-.025em', color: 'white', marginBottom: '1.4rem' }}>
              El conocimiento que<br />transforma{' '}
              <em style={{ fontStyle: 'normal', color: 'var(--jade-light)' }}>
                <span className="rotating-word">
                  <span className="rotating-word-ghost">organizaciones</span>
                  <span className={`rotating-word-visible ${wordVisible ? 'in' : 'out'}`}>
                    {ROTATING_WORDS[wordIndex]}
                  </span>
                </span>
              </em>
            </h1>
            <p style={{ fontSize: '1rem', color: 'rgba(248,246,241,.65)', lineHeight: 1.75, maxWidth: 480, marginBottom: '2.5rem', fontWeight: 300 }}>
              Cubo Academy convierte experiencia consultiva real en cursos de alto impacto. Procesos, datos y liderazgo — metodología que ya funciona en empresas reales.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', flexWrap: 'wrap' }}>
              <Link to="/cursos" style={{ padding: '.9rem 2rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(22,125,120,.4)' }}>
                Explorar cursos
              </Link>
              <Link to="/cursos" style={{ padding: '.9rem 1.75rem', background: 'transparent', color: 'rgba(248,246,241,.75)', border: '1px solid rgba(248,246,241,.18)', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 500 }}>
                Cómo es diferente
              </Link>
            </div>
          </div>
          <div className="hero-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { val: '40+', accent: true, label: 'Cursos activos', desc: 'En tres áreas de especialización' },
              { val: '2K+', accent: false, label: 'Estudiantes', desc: 'Profesionales activos en la región' },
              { val: '18+', accent: true, label: 'Instructores', desc: 'Consultores activos en el campo' },
            ].map((m) => (
              <div key={m.label} className="metric-card" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backdropFilter: 'blur(6px)' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, color: m.accent ? 'var(--terra)' : 'white', minWidth: 70 }}>{m.val}</div>
                <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,.12)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '.72rem', color: 'rgba(248,246,241,.45)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '.2rem' }}>{m.label}</div>
                  <div style={{ fontSize: '.85rem', color: 'rgba(248,246,241,.75)', lineHeight: 1.4 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BAND ── */}
      <div style={{ padding: '1.75rem 5%', background: 'white', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: '.65rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: '#B5B2AB', marginBottom: '1rem', textAlign: 'center' }}>
            Respaldado por experiencia en empresas como
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2.75rem', flexWrap: 'wrap' }}>
            {['Grupo Cubo 130', 'BAC Credomatic', 'Holcim', 'CCSS', 'ICE'].map((name, i, arr) => (
              <span key={name} style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 600, color: '#B5B2AB', letterSpacing: '.03em' }}>
                {name}{i < arr.length - 1 && <span style={{ color: '#D8D5CE', fontSize: '.6rem', margin: '0 1rem' }}>·</span>}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── TRACKS ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Áreas de formación</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)', marginBottom: '.85rem' }}>Tres pilares, un propósito</h2>
            <p style={{ fontSize: '.95rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, maxWidth: 500 }}>Cada área fue elegida porque es donde las organizaciones más necesitan profesionales capaces de generar cambios reales.</p>
          </div>
          <div className="reveal tracks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            {TRACKS.map((t) => (
              <div key={t.name} className="track-card" style={{ background: 'white', padding: '2.4rem 2rem' }}>
                <div style={{ width: 44, height: 44, background: 'var(--jade-soft)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.3rem' }}>
                  {t.icon}
                </div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.18rem', fontWeight: 700, marginBottom: '.6rem', color: 'var(--carbon)' }}>{t.name}</div>
                <div style={{ fontSize: '.845rem', color: 'var(--text-2)', lineHeight: 1.7, fontWeight: 300 }}>{t.desc}</div>
                <div style={{ marginTop: '1.4rem', fontSize: '.72rem', color: 'var(--jade)', fontWeight: 600, letterSpacing: '.05em' }}>{t.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DIFERENCIADOR ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%', background: 'white' }}>
        <div className="diff-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
          <div className="reveal">
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>¿Por qué Cubo Academy?</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)', marginBottom: '2rem' }}>Formación desde<br />la trinchera real</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
              {DIFF_ITEMS.map((item) => (
                <div key={item.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 30, height: 30, minWidth: 30, borderRadius: 8, background: 'var(--jade-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '.1rem' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <strong style={{ fontFamily: 'var(--serif)', fontSize: '.97rem', fontWeight: 600, color: 'var(--carbon)', display: 'block', marginBottom: '.25rem' }}>{item.title}</strong>
                    <p style={{ fontSize: '.85rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.65 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal" style={{ background: 'var(--jade-dark)', borderRadius: 16, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(22,125,120,.18)' }} />
            <div style={{ display: 'flex', gap: '1rem' }}>
              {[{ val: '94%', label: 'Tasa de compleción', accent: false }, { val: '4.8', label: 'Calificación promedio', accent: true }].map((s) => (
                <div key={s.label} style={{ flex: 1, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '1.1rem 1.2rem' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.9rem', fontWeight: 700, color: s.accent ? 'var(--terra)' : 'white', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: '.7rem', color: 'rgba(248,246,241,.5)', letterSpacing: '.05em', textTransform: 'uppercase', marginTop: '.25rem' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {[
              { label: 'Progreso promedio de estudiantes activos', pct: '72%', meta: ['Módulo 5 de 7', '72% completado'] },
              { label: 'Satisfacción con aplicabilidad práctica', pct: '89%', meta: ['Encuesta post-curso', '89% satisfecho'] },
            ].map((p) => (
              <div key={p.label} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '1.1rem 1.2rem' }}>
                <div style={{ fontSize: '.78rem', color: 'rgba(248,246,241,.7)', marginBottom: '.65rem', fontWeight: 500 }}>{p.label}</div>
                <div style={{ height: 6, background: 'rgba(255,255,255,.1)', borderRadius: 3, overflow: 'hidden', marginBottom: '.5rem' }}>
                  <div className="progress-fill" style={{ height: '100%', borderRadius: 3, background: 'var(--jade)', width: p.pct }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.7rem', color: 'rgba(248,246,241,.4)' }}>
                  <span>{p.meta[0]}</span><span>{p.meta[1]}</span>
                </div>
              </div>
            ))}
            <div style={{ background: 'rgba(201,110,75,.12)', border: '1px solid rgba(201,110,75,.28)', borderRadius: 10, padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '.85rem' }}>
              <div style={{ width: 36, height: 36, minWidth: 36, background: 'rgba(201,110,75,.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--terra)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--terra)', display: 'block', marginBottom: '.1rem' }}>Certificado digital avalado</strong>
                <span style={{ fontSize: '.75rem', color: 'rgba(248,246,241,.5)' }}>Grupo Cubo 130 · Válido para perfil profesional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CURSOS ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal courses-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Catálogo</div>
              <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Cursos destacados</h2>
            </div>
            <Link to="/cursos" style={{ padding: '.45rem 1.1rem', border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', borderRadius: 7, fontSize: '.85rem', fontWeight: 500 }}>
              Ver catálogo completo →
            </Link>
          </div>
          <div className="reveal courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.25rem' }}>
            {COURSES.map((c) => (
              <div key={c.title} className="course-card" style={{ background: c.featured ? 'var(--jade-soft)' : 'white', border: `1px solid ${c.featured ? 'rgba(22,125,120,.2)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ height: 144, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: c.bg }}>
                  <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '.62rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 4, background: c.featured ? 'rgba(201,110,75,.18)' : 'rgba(22,125,120,.18)', color: c.featured ? '#B85C36' : 'var(--jade)' }}>
                    {c.track}
                  </span>
                </div>
                <div style={{ padding: '1.35rem 1.4rem 1.4rem' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '.4rem', lineHeight: 1.3, color: 'var(--carbon)' }}>{c.title}</div>
                  <div style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.65, marginBottom: '1rem' }}>{c.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem', marginBottom: '1rem' }}>
                    {[c.hours, c.level, c.modules].map((d) => (
                      <span key={d} style={{ fontSize: '.72rem', color: '#9B9894' }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.9rem', borderTop: `1px solid ${c.featured ? 'rgba(22,125,120,.15)' : 'var(--border)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'var(--text-2)' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 700, color: 'white' }}>{c.initials}</div>
                      {c.instructor}
                    </div>
                    <Link to="/cursos" className="btn-course" style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--jade)', border: '1px solid rgba(22,125,120,.3)', background: 'transparent', padding: '5px 13px', borderRadius: 6 }}>
                      Ver curso
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>El proceso</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Simple de empezar, poderoso en el fondo</h2>
          </div>
          <div className="reveal how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
            <div className="how-connector" style={{ position: 'absolute', top: 25, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg,transparent,var(--border) 20%,var(--border) 80%,transparent)' }} />
            {HOW_STEPS.map((s) => (
              <div key={s.num} style={{ textAlign: 'center', padding: '0 1.25rem' }}>
                <div style={{ width: 50, height: 50, border: '1.5px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--jade)', margin: '0 auto 1.2rem', background: 'white', position: 'relative', zIndex: 1 }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>{s.title}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTRUCTORES ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>El equipo docente</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Consultores que también enseñan</h2>
          </div>
          <div className="reveal inst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.15rem' }}>
            {INSTRUCTORS.map((inst) => (
              <div key={inst.name} className="inst-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.75rem 1.4rem', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto .9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'white', background: inst.bg }}>{inst.initials}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.2rem' }}>{inst.name}</div>
                <div style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 500, marginBottom: '.5rem', letterSpacing: '.02em' }}>{inst.role}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>{inst.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="section-pad" style={{ padding: '5.5rem 5%', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Lo que dicen</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Resultados que hablan solos</h2>
          </div>
          <div className="reveal test-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.15rem' }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.75rem' }}>
                <div style={{ color: 'var(--terra)', fontSize: '.8rem', letterSpacing: '.1em', marginBottom: '.85rem' }}>★★★★★</div>
                <div style={{ fontSize: '.875rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.75, marginBottom: '1.3rem', fontStyle: 'italic' }}>{t.text}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--jade-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--jade)', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.84rem', fontWeight: 600, color: 'var(--carbon)' }}>{t.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--jade-dark)', padding: '5.5rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(22,125,120,.2)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(22,125,120,.12)', pointerEvents: 'none' }} />
        <div className="reveal cta-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '3rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(232,243,242,.5)', marginBottom: '.7rem' }}>Empieza hoy</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.02em', color: 'white', marginBottom: '.85rem' }}>
              ¿Listo para aprender<br />desde <em style={{ fontStyle: 'normal', color: 'var(--jade-light)' }}>adentro</em>?
            </h2>
            <p style={{ fontSize: '.95rem', color: 'rgba(248,246,241,.6)', maxWidth: 460, fontWeight: 300, lineHeight: 1.7 }}>
              Únete a miles de profesionales que transforman sus organizaciones con conocimiento consultivo real.
            </p>
          </div>
          <div className="cta-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.9rem', flexShrink: 0 }}>
            <Link to="/registro" style={{ padding: '1rem 2.2rem', background: 'var(--terra)', color: 'var(--carbon)', borderRadius: 9, fontFamily: 'var(--serif)', fontSize: '.97rem', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(201,110,75,.35)' }}>
              Crear cuenta gratis
            </Link>
            <Link to="/cursos" style={{ padding: '.75rem 1.75rem', background: 'transparent', color: 'rgba(248,246,241,.7)', border: '1px solid rgba(248,246,241,.18)', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 500, whiteSpace: 'nowrap', textAlign: 'center' }}>
              Ver planes y precios
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.72rem', color: 'rgba(248,246,241,.35)' }}>
              Sin tarjeta de crédito · Cancela cuando quieras
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
