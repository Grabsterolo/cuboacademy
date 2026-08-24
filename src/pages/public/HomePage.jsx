import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useSettings } from '../../context/SettingsContext'
import { useNavigation } from '../../context/NavigationContext'
import { formatEventDateTime } from '../../lib/formatDate'

const TRACK_STYLES = [
  { bg: 'linear-gradient(150deg, #0B3436 0%, #167D78 130%)', icon: 'layers' },
  { bg: 'linear-gradient(150deg, #7A3520 0%, #C96E4B 130%)', icon: 'chart' },
  { bg: 'linear-gradient(150deg, #104447 0%, #5ABFBA 145%)', icon: 'users' },
  { bg: 'linear-gradient(150deg, #16201F 0%, #104447 145%)', icon: 'megaphone' },
  { bg: 'linear-gradient(150deg, #0B3436 0%, #C96E4B 160%)', icon: 'briefcase' },
  { bg: 'linear-gradient(150deg, #5C2814 0%, #D9855E 130%)', icon: 'cpu' },
]

function TrackIcon({ name }) {
  const common = { viewBox: '0 0 120 120', width: 132, height: 132, fill: 'none', stroke: 'currentColor', strokeWidth: 2.25, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'chart':
      return (
        <svg {...common}>
          <line x1="20" y1="102" x2="20" y2="72" /><line x1="46" y1="102" x2="46" y2="55" />
          <line x1="72" y1="102" x2="72" y2="35" /><line x1="98" y1="102" x2="98" y2="14" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="45" cy="42" r="18" /><path d="M15 102c0-20 13-33 30-33s30 13 30 33" />
          <circle cx="84" cy="50" r="13" /><path d="M71 102c1-15 10-25 22-25" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg {...common}>
          <path d="M15 55v10a8 8 0 0 0 8 8h6l10 24 10-3-8-21 59 20V30L41 50h-6a8 8 0 0 0-8 8z" />
          <path d="M97 45a15 15 0 0 1 0 20" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="15" y="42" width="90" height="55" rx="8" /><path d="M42 42V30a10 10 0 0 1 10-10h16a10 10 0 0 1 10 10v12" />
          <line x1="15" y1="68" x2="105" y2="68" />
        </svg>
      )
    case 'cpu':
      return (
        <svg {...common}>
          <rect x="35" y="35" width="50" height="50" rx="6" /><rect x="50" y="50" width="20" height="20" rx="3" />
          <line x1="60" y1="10" x2="60" y2="25" /><line x1="60" y1="95" x2="60" y2="110" />
          <line x1="10" y1="60" x2="25" y2="60" /><line x1="95" y1="60" x2="110" y2="60" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <rect x="20" y="55" width="55" height="45" rx="8" /><rect x="35" y="35" width="55" height="45" rx="8" /><rect x="50" y="18" width="55" height="45" rx="8" />
        </svg>
      )
  }
}

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
  { num: '2', title: 'Elige tu curso', desc: 'Filtra por área, nivel o duración, y revisa el temario de cada curso.' },
  { num: '3', title: 'Inscríbete', desc: 'Realiza el pago y tu inscripción se confirma manualmente en menos de 48 horas.' },
  { num: '4', title: 'Aprende y certifícate', desc: 'Video, recursos y ejercicios a tu ritmo. Certificado digital al terminar.' },
]

const INST_COLORS = ['var(--jade)', '#C96E4B', 'var(--jade-dark)', '#104447']

const LEVEL_LABELS = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const MODALITY_LABELS = { presencial: 'Presencial', virtual: 'Virtual', hibrido: 'Híbrido' }

// deps lets callers re-scan once async sections (courses/events/instructors) finish
// loading — otherwise cards rendered after the initial mount never get observed and
// just snap in without the fade-in the rest of the page gets.
function useReveal(deps = []) {
  const obsRef = useRef(null)
  useEffect(() => {
    if (!obsRef.current) {
      obsRef.current = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible')
            obsRef.current.unobserve(e.target)
          }
        })
      }, { threshold: 0.08 })
    }
    const vp = window.innerHeight
    document.querySelectorAll('.reveal:not(.will-animate)').forEach(el => {
      if (el.getBoundingClientRect().top > vp * 0.95) {
        el.classList.add('will-animate')
        obsRef.current.observe(el)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => () => obsRef.current?.disconnect(), [])
}

const ROTATING_WORDS = ['organizaciones', 'equipos', 'líderes', 'empresas']

function formatCount(n) {
  if (n == null) return '—'
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`
  return `${n}`
}

export default function HomePage() {
  const { navigate } = useNavigation()
  const { settings } = useSettings()
  const [scrolled, setScrolled] = useState(false)
  const [wordIndex, setWordIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(true)
  const [tracks, setTracks] = useState(null)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [instructors, setInstructors] = useState(null)
  const [saveData, setSaveData] = useState(false)
  const [stats, setStats] = useState({ courses: null, students: null, instructors: null })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-data: reduce)')
    setSaveData(mq.matches || navigator.connection?.saveData || false)
  }, [])
  const tracksScrollRef = useRef(null)
  useReveal([coursesLoading, eventsLoading, tracks, instructors])

  function scrollTracks(dir) {
    const el = tracksScrollRef.current
    if (!el) return
    const card = el.querySelector('.track-card')
    const amount = (card ? card.offsetWidth : 300) + 24
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setTracks(data || [])
    })
  }, [])

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, slug, cover_image_url, price, level, duration_hours, categories(name), profiles!instructor_id(full_name, avatar_url)')
      .eq('type', 'course')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setCourses(data || [])
        setCoursesLoading(false)
      })
  }, [])

  useEffect(() => {
    supabase
      .from('courses')
      .select('id, title, slug, cover_image_url, price, modality, event_start_at, categories(name), profiles!instructor_id(full_name, avatar_url)')
      .eq('type', 'event')
      .eq('status', 'published')
      .gte('event_start_at', new Date().toISOString())
      .order('event_start_at', { ascending: true })
      .limit(6)
      .then(({ data }) => {
        setEvents(data || [])
        setEventsLoading(false)
      })
  }, [])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, profession, specialty')
      .eq('role', 'instructor')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setInstructors(data || []))
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('courses').select('id', { count: 'exact', head: true }).eq('type', 'course').eq('status', 'published'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor').eq('is_active', true),
    ]).then(([coursesRes, studentsRes, instructorsRes]) => {
      setStats({ courses: coursesRes.count ?? 0, students: studentsRes.count ?? 0, instructors: instructorsRes.count ?? 0 })
    })
  }, [])

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
        .reveal.will-animate { opacity: 0; transform: translateY(28px) scale(.97); transition: opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1); }
        .reveal.visible { opacity: 1; transform: translateY(0) scale(1); }
        @media (prefers-reduced-motion: reduce) {
          .reveal.will-animate { transition: none; opacity: 1; transform: none; }
        }
        .progress-fill { transition: width .8s ease; }
        .tracks-scroll { display: flex; gap: 1.5rem; overflow-x: auto; scroll-snap-type: x mandatory; padding: .5rem 5% 1.25rem; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        .tracks-scroll::-webkit-scrollbar { display: none; }
        .track-card {
          position: relative; overflow: hidden; flex: 0 0 320px; min-height: 440px;
          border-radius: 20px; scroll-snap-align: start; color: white;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 2.2rem 2rem; cursor: default;
          transition: transform .4s cubic-bezier(.16,1,.3,1), box-shadow .4s;
        }
        .track-card:hover { transform: translateY(-8px); box-shadow: 0 22px 50px rgba(11,52,54,.28); }
        .track-card-icon { position: absolute; top: 1.2rem; right: -1.2rem; opacity: .16; color: white; pointer-events: none; transition: transform .5s cubic-bezier(.16,1,.3,1), opacity .4s; }
        .track-card:hover .track-card-icon { transform: scale(1.08) rotate(-4deg); opacity: .22; }
        .track-card-num { position: absolute; top: 1.75rem; left: 2rem; font-family: var(--serif); font-size: .75rem; font-weight: 700; letter-spacing: .12em; color: rgba(255,255,255,.5); }
        .track-card-body { position: relative; z-index: 1; }
        .track-card-title { font-family: var(--serif); font-size: 1.4rem; font-weight: 700; line-height: 1.18; margin-bottom: .65rem; }
        .track-card-desc { font-size: .85rem; color: rgba(255,255,255,.72); line-height: 1.65; font-weight: 300; margin-bottom: 1.5rem; }
        .track-card-btn { display: inline-flex; align-items: center; gap: .4rem; background: white; color: var(--carbon); border: none; border-radius: 24px; padding: .65rem 1.15rem; font-family: var(--serif); font-size: .82rem; font-weight: 600; cursor: pointer; transition: gap .2s, background .2s; }
        .track-card-btn:hover { gap: .65rem; background: var(--cream); }
        .track-card-btn svg { transition: transform .2s; }
        .track-card-btn:hover svg { transform: translateX(2px); }
        .tracks-arrow-btn { width: 44px; height: 44px; border-radius: 50%; border: 1px solid var(--border); background: white; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--carbon); transition: background .2s, border-color .2s, color .2s, transform .15s; }
        .tracks-arrow-btn:hover { background: var(--jade); border-color: var(--jade); color: white; }
        .tracks-arrow-btn:active { transform: scale(.92); }
        .course-card { transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s, border-color .28s; cursor: pointer; }
        .course-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(23,26,28,.12); }
        .inst-card { transition: border-color .25s, box-shadow .25s, transform .25s; }
        .inst-card:hover { border-color: rgba(22,125,120,.25); box-shadow: 0 10px 28px rgba(23,26,28,.08); transform: translateY(-3px); }
        .btn-course { transition: background .2s, color .2s, border-color .2s; }
        .btn-course:hover { background: var(--jade); color: white; border-color: var(--jade); }
        .btn-outline { transition: background .2s, color .2s, border-color .2s; }
        .btn-outline:hover { background: var(--jade); color: white; border-color: var(--jade); }
        .metric-card { transition: background .3s, transform .3s; }
        .metric-card:hover { background: rgba(255,255,255,.1) !important; transform: translateY(-2px); }
        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .courses-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 900px) {
          .courses-grid { grid-template-columns: repeat(2,1fr) !important; }
          .inst-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (max-width: 768px) {
          .hero-section { padding: 6rem 5% 3.5rem !important; min-height: unset !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .hero-metrics { flex-direction: row !important; gap: .75rem !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .hero-metrics .metric-card { padding: 1rem 1.2rem !important; flex: 0 0 auto; min-width: 160px; }
          .section-pad { padding: 4.5rem 5% !important; }
          .tracks-section { padding: 4.5rem 0 !important; }
          .tracks-header { flex-direction: column !important; align-items: flex-start !important; gap: 1.25rem !important; }
          .track-card { flex-basis: 260px !important; min-height: 380px !important; }
          .diff-grid { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
          .courses-grid { grid-template-columns: 1fr !important; }
          .courses-header-bar { flex-direction: column !important; align-items: flex-start !important; gap: 1rem !important; }
          .how-grid { grid-template-columns: repeat(2,1fr) !important; gap: 2rem 1rem !important; }
          .how-connector { display: none !important; }
          .inst-grid { grid-template-columns: repeat(2,1fr) !important; }
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
        {settings.hero_video_url && !saveData ? (
          <>
            <video src={settings.hero_video_url} autoPlay muted loop playsInline preload="metadata"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(140deg, rgba(8,26,30,.82), rgba(13,56,52,.75))' }} />
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)', backgroundSize: '48px 48px', zIndex: 0 }} />
            <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 700, height: 700, borderRadius: '50%', background: 'rgba(22,125,120,.18)', filter: 'blur(90px)', top: '-10%', left: '-5%', animation: 'orb1 14s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,125,120,.13)', filter: 'blur(70px)', top: '30%', right: '5%', animation: 'orb2 18s ease-in-out infinite', animationDelay: '-6s' }} />
              <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(90,191,186,.08)', filter: 'blur(60px)', bottom: '0%', left: '40%', animation: 'orb3 22s ease-in-out infinite', animationDelay: '-11s' }} />
            </div>
          </>
        )}
        <div className="hero-grid" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '4rem', alignItems: 'center', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(90,191,186,.75)', marginBottom: '1.4rem' }}>
              <span style={{ width: 16, height: 1, background: 'rgba(232,243,242,.4)', display: 'inline-block' }} />
              Formación diseñada por consultores
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.6rem,4.2vw,4rem)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-.025em', color: 'white', marginBottom: '1.4rem' }}>
              {settings.hero_title ? settings.hero_title : <>El conocimiento que<br />transforma</>}{' '}
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
              {settings.hero_subtitle || 'Cubo Campus convierte experiencia consultiva real en cursos de alto impacto. Procesos, datos y liderazgo — metodología que ya funciona en empresas reales.'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('courses')} style={{ padding: '.9rem 2rem', background: 'var(--jade)', color: 'white', borderRadius: 8, fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(22,125,120,.4)' }}>
                Explorar cursos
              </button>
            </div>
          </div>
          <div className="hero-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { val: formatCount(stats.courses), accent: true, label: 'Cursos activos', desc: 'En tres áreas de especialización' },
              { val: formatCount(stats.students), accent: false, label: 'Estudiantes', desc: 'Profesionales activos en la región' },
              { val: formatCount(stats.instructors), accent: true, label: 'Instructores', desc: 'Consultores activos en el campo' },
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

      {/* ── TRACKS ── */}
      <section id="areas-formacion" className="tracks-section" style={{ padding: '8rem 0 7.5rem', position: 'relative', overflow: 'hidden', scrollMarginTop: 66 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 460, height: 460, borderRadius: '50%', background: 'rgba(22,125,120,.05)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-15%', left: '-6%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(201,110,75,.04)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          <div className="reveal tracks-header" style={{ marginBottom: '3.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '2rem' }}>
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Áreas de formación</div>
              <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)', marginBottom: '.85rem' }}>Explora por área de conocimiento</h2>
              <p style={{ fontSize: '.95rem', color: 'var(--text-2)', lineHeight: 1.75, fontWeight: 300, maxWidth: 500 }}>Encuentra formación especializada en las áreas que más impactan tu carrera y tu organización.</p>
            </div>
            {tracks && tracks.length > 0 && (
              <div className="tracks-arrows" style={{ display: 'flex', gap: '.6rem', flexShrink: 0 }}>
                <button className="tracks-arrow-btn" onClick={() => scrollTracks(-1)} aria-label="Área anterior">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <button className="tracks-arrow-btn" onClick={() => scrollTracks(1)} aria-label="Siguiente área">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {tracks === null ? (
          <div style={{ display: 'flex', gap: '1.5rem', padding: '0 5%', overflow: 'hidden' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ flex: '0 0 300px', height: 420, background: 'var(--border)', borderRadius: 20 }} />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)', background: 'white', border: '1px solid var(--border)', borderRadius: 14 }}>
              Las áreas de formación estarán disponibles pronto.
            </div>
          </div>
        ) : (
          <div ref={tracksScrollRef} className="tracks-scroll">
            {tracks.map((t, i) => {
              const style = TRACK_STYLES[i % TRACK_STYLES.length]
              return (
                <div key={t.id} className="reveal track-card" style={{ transitionDelay: `${(i % 3) * 90}ms`, background: style.bg }}>
                  <div className="track-card-icon">
                    <TrackIcon name={style.icon} />
                  </div>
                  <span className="track-card-num">{String(i + 1).padStart(2, '0')}</span>
                  <div className="track-card-body">
                    <h3 className="track-card-title">{t.name}</h3>
                    {t.description && <p className="track-card-desc">{t.description}</p>}
                    <button className="track-card-btn" onClick={() => navigate('courses', { categoryId: t.id })}>
                      Ver cursos
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── DIFERENCIADOR ── */}
      <section className="section-pad" style={{ padding: '7.5rem 5%', background: 'white' }}>
        <div className="diff-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5.5rem', alignItems: 'center' }}>
          <div className="reveal">
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>¿Por qué Cubo Campus?</div>
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
          <div className="reveal" style={{ transitionDelay: '140ms', background: 'var(--jade-dark)', borderRadius: 16, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(22,125,120,.18)' }} />
            <div style={{ fontSize: '.66rem', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(248,246,241,.4)' }}>Ejemplo ilustrativo</div>
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
      <section className="section-pad" style={{ padding: '7.5rem 5%' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal courses-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.25rem' }}>
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Catálogo</div>
              <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Cursos destacados</h2>
            </div>
            <button onClick={() => navigate('courses')} className="btn-outline" style={{ padding: '.55rem 1.2rem', border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', borderRadius: 8, fontSize: '.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ver catálogo completo →
            </button>
          </div>
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
            {coursesLoading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1 / 1', background: 'var(--border)' }} />
                  <div style={{ padding: '1.35rem 1.4rem 1.4rem' }}>
                    <div style={{ height: 18, background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem', width: '80%' }} />
                    <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, marginBottom: '1rem', width: '55%' }} />
                    <div style={{ height: 1, background: 'var(--border)', marginBottom: '.9rem' }} />
                    <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, width: '45%' }} />
                  </div>
                </div>
              ))
            ) : courses.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '3.5rem 2rem', textAlign: 'center', background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem' }}>Próximamente nuevos cursos</p>
                <p style={{ fontSize: '.85rem', color: 'var(--text-2)', fontWeight: 300 }}>Estamos preparando contenido de alto impacto. Vuelve pronto.</p>
              </div>
            ) : (
              courses.map((c, i) => {
                const initials = (c.profiles?.full_name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={c.id} className="reveal course-card" style={{ transitionDelay: `${(i % 3) * 90}ms`, background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1 / 1', position: 'relative', background: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', overflow: 'hidden' }}>
                      {c.cover_image_url
                        ? (
                          <>
                            <div style={{ position: 'absolute', inset: -12, backgroundImage: `url(${c.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px) brightness(.6)' }} />
                            <img loading="lazy" src={c.cover_image_url} alt={c.title} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }} />
                          </>
                        )
                        : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                            </svg>
                          </div>
                        )
                      }
                      {c.categories?.name && (
                        <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '.62rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 4, background: 'rgba(22,125,120,.18)', color: 'var(--jade)' }}>
                          {c.categories.name}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '1.35rem 1.4rem 1.4rem' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '.65rem', lineHeight: 1.3, color: 'var(--carbon)' }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {c.duration_hours != null && (
                          <span style={{ fontSize: '.72rem', color: '#9B9894' }}>{c.duration_hours}h</span>
                        )}
                        {c.level && (
                          <span style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', padding: '2px 7px', borderRadius: 10 }}>
                            {LEVEL_LABELS[c.level] || c.level}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.9rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'var(--text-2)', minWidth: 0 }}>
                          {c.profiles?.avatar_url ? (
                            <img loading="lazy" src={c.profiles.avatar_url} alt={c.profiles.full_name || ''} style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 700, color: 'white' }}>{initials}</div>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.profiles?.full_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                          {c.price != null && <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--carbon)' }}>${c.price}</span>}
                          <button onClick={() => navigate('course-detail', { slug: c.slug })} className="btn-course" style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--jade)', border: '1px solid rgba(22,125,120,.3)', background: 'transparent', padding: '5px 13px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                            Ver curso
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* ── EVENTOS ── */}
      <section className="section-pad" style={{ padding: '7.5rem 5%', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal courses-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3.25rem' }}>
            <div>
              <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>Agenda</div>
              <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Eventos destacados</h2>
            </div>
            <button onClick={() => navigate('events')} className="btn-outline" style={{ padding: '.55rem 1.2rem', border: '1px solid var(--border)', background: 'white', color: 'var(--carbon)', borderRadius: 8, fontSize: '.85rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Ver todos los eventos →
            </button>
          </div>
          <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.5rem' }}>
            {eventsLoading ? (
              [0, 1, 2].map(i => (
                <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ aspectRatio: '1 / 1', background: 'var(--border)' }} />
                  <div style={{ padding: '1.35rem 1.4rem 1.4rem' }}>
                    <div style={{ height: 18, background: 'var(--border)', borderRadius: 4, marginBottom: '.5rem', width: '80%' }} />
                    <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, marginBottom: '1rem', width: '55%' }} />
                    <div style={{ height: 1, background: 'var(--border)', marginBottom: '.9rem' }} />
                    <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, width: '45%' }} />
                  </div>
                </div>
              ))
            ) : events.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: '3.5rem 2rem', textAlign: 'center', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12 }}>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.35rem' }}>Próximamente nuevos eventos</p>
                <p style={{ fontSize: '.85rem', color: 'var(--text-2)', fontWeight: 300 }}>Estamos preparando talleres y charlas en vivo. Vuelve pronto.</p>
              </div>
            ) : (
              events.map((e, i) => {
                const initials = (e.profiles?.full_name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={e.id} className="reveal course-card" style={{ transitionDelay: `${(i % 3) * 90}ms`, background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '1 / 1', position: 'relative', background: 'linear-gradient(140deg,#0d3840 0%,#082830 100%)', overflow: 'hidden' }}>
                      {e.cover_image_url
                        ? (
                          <>
                            <div style={{ position: 'absolute', inset: -12, backgroundImage: `url(${e.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(18px) brightness(.6)' }} />
                            <img loading="lazy" src={e.cover_image_url} alt={e.title} style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }} />
                          </>
                        )
                        : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                          </div>
                        )
                      }
                      {e.categories?.name && (
                        <span style={{ position: 'absolute', top: 10, left: 10, fontSize: '.62rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', padding: '4px 9px', borderRadius: 4, background: 'rgba(22,125,120,.18)', color: 'var(--jade)' }}>
                          {e.categories.name}
                        </span>
                      )}
                    </div>
                    <div style={{ padding: '1.35rem 1.4rem 1.4rem' }}>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, marginBottom: '.65rem', lineHeight: 1.3, color: 'var(--carbon)' }}>{e.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        {e.event_start_at && (
                          <span style={{ fontSize: '.72rem', color: '#9B9894' }}>{formatEventDateTime(e.event_start_at)}</span>
                        )}
                        {e.modality && (
                          <span style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', padding: '2px 7px', borderRadius: 10 }}>
                            {MODALITY_LABELS[e.modality] || e.modality}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '.9rem', borderTop: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'var(--text-2)', minWidth: 0 }}>
                          {e.profiles?.avatar_url ? (
                            <img loading="lazy" src={e.profiles.avatar_url} alt={e.profiles.full_name || ''} style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 22, height: 22, minWidth: 22, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.58rem', fontWeight: 700, color: 'white' }}>{initials}</div>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.profiles?.full_name || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                          {e.price != null && <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--carbon)' }}>{Number(e.price) === 0 ? 'Gratis' : `$${e.price}`}</span>}
                          <button onClick={() => navigate('event-detail', { slug: e.slug })} className="btn-course" style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--jade)', border: '1px solid rgba(22,125,120,.3)', background: 'transparent', padding: '5px 13px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                            Ver evento
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section className="section-pad" style={{ padding: '7.5rem 5%', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '4rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>El proceso</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Simple de empezar, poderoso en el fondo</h2>
          </div>
          <div className="how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, position: 'relative' }}>
            <div className="how-connector" style={{ position: 'absolute', top: 25, left: '12.5%', right: '12.5%', height: 1, background: 'linear-gradient(90deg,transparent,var(--border) 20%,var(--border) 80%,transparent)' }} />
            {HOW_STEPS.map((s, i) => (
              <div key={s.num} className="reveal" style={{ transitionDelay: `${i * 100}ms`, textAlign: 'center', padding: '0 1.25rem' }}>
                <div style={{ width: 50, height: 50, border: '1.5px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: 'var(--jade)', margin: '0 auto 1.2rem', background: 'white', position: 'relative', zIndex: 1 }}>{s.num}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.35rem' }}>{s.title}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTRUCTORES ── */}
      <section id="equipo" className="section-pad" style={{ padding: '7.5rem 5%', scrollMarginTop: 66 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="reveal" style={{ marginBottom: '4rem' }}>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.6rem' }}>El equipo docente</div>
            <h2 style={{ fontSize: 'clamp(1.85rem,3vw,2.7rem)', fontWeight: 700, lineHeight: 1.1, color: 'var(--carbon)' }}>Consultores que también enseñan</h2>
          </div>
          {instructors === null ? (
            <div className="inst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.4rem' }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem 1.4rem', textAlign: 'center' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto .9rem', background: 'var(--border)' }} />
                  <div style={{ height: 14, background: 'var(--border)', borderRadius: 4, margin: '0 auto .5rem', width: '60%' }} />
                  <div style={{ height: 12, background: 'var(--border)', borderRadius: 4, width: '80%', margin: '0 auto' }} />
                </div>
              ))}
            </div>
          ) : instructors.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-2)', fontSize: '.9rem', fontFamily: 'var(--sans)', background: 'white', border: '1px solid var(--border)', borderRadius: 14 }}>
              Pronto presentaremos a nuestro equipo de instructores.
            </div>
          ) : (
            <div className="inst-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.4rem' }}>
              {instructors.map((inst, i) => {
                const initials = (inst.full_name || '??').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                const role = inst.specialty || inst.profession || 'Instructor'
                return (
                  <div key={inst.id} className="reveal inst-card" style={{ transitionDelay: `${(i % 4) * 80}ms`, background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '1.75rem 1.4rem', textAlign: 'center' }}>
                    {inst.avatar_url ? (
                      <img loading="lazy" src={inst.avatar_url} alt={inst.full_name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', margin: '0 auto .9rem', display: 'block' }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto .9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'white', background: INST_COLORS[i % INST_COLORS.length] }}>{initials}</div>
                    )}
                    <div style={{ fontFamily: 'var(--serif)', fontSize: '.9rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.2rem' }}>{inst.full_name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 500, marginBottom: '.5rem', letterSpacing: '.02em' }}>{role}</div>
                    {inst.bio && <div style={{ fontSize: '.78rem', color: 'var(--text-2)', fontWeight: 300, lineHeight: 1.6 }}>{inst.bio}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--jade-dark)', padding: '7rem 5%', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(22,125,120,.2)', filter: 'blur(10px)', animation: 'orb2 20s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(201,110,75,.1)', filter: 'blur(10px)', animation: 'orb3 24s ease-in-out infinite', pointerEvents: 'none' }} />
        <div className="reveal cta-grid" style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: '3rem', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '.68rem', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(232,243,242,.5)', marginBottom: '.7rem' }}>Empieza hoy</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-.02em', color: 'white', marginBottom: '.85rem' }}>
              ¿Listo para aprender<br />desde <em style={{ fontStyle: 'normal', color: 'var(--jade-light)' }}>adentro</em>?
            </h2>
            <p style={{ fontSize: '.95rem', color: 'rgba(248,246,241,.6)', maxWidth: 460, fontWeight: 300, lineHeight: 1.7 }}>
              Únete a los profesionales que transforman sus organizaciones con conocimiento consultivo real.
            </p>
          </div>
          <div className="cta-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.9rem', flexShrink: 0 }}>
            <button onClick={() => navigate('register')} style={{ padding: '1rem 2.2rem', background: 'var(--terra)', color: 'var(--carbon)', borderRadius: 9, fontFamily: 'var(--serif)', fontSize: '.97rem', fontWeight: 700, whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(201,110,75,.35)' }}>
              Crear cuenta gratis
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.72rem', color: 'rgba(248,246,241,.55)', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 20, padding: '.4rem .85rem', backdropFilter: 'blur(6px)' }}>
              Sin tarjeta de crédito · Regístrate en un minuto
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
