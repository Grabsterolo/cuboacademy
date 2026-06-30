import { useEffect, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

const LEVEL = { beginner: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado' }
const LESSON_TYPE_LABEL = { video: 'Video', text: 'Texto', quiz: 'Quiz', pdf: 'PDF', link: 'Enlace' }
const Q_TYPE_LABEL = { single: 'Opción única', multiple: 'Múltiple', true_false: 'Verdadero / Falso', open: 'Abierta' }

// ── icons ────────────────────────────────────────────────────────────────────
const IC = {
  back:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>,
  video:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  text:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>,
  quiz:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  chevD:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>,
  book:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  clock:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  check:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  user:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  tag:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  dollar:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  warn:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
}

function lesIcon(type) {
  if (type === 'video') return IC.video
  if (type === 'quiz')  return IC.quiz
  return IC.text
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', background: '#FAFAF9' }}>
        <span style={{ color: 'var(--jade)' }}>{icon}</span>
        <span style={{ fontFamily: 'var(--serif)', fontSize: '.93rem', fontWeight: 700, color: 'var(--carbon)' }}>{title}</span>
      </div>
      <div style={{ padding: '1.25rem 1.4rem' }}>{children}</div>
    </div>
  )
}

function Tag({ children, color = 'var(--jade)', bg = 'var(--jade-soft)', border = 'rgba(22,125,120,.2)' }) {
  return (
    <span style={{ fontSize: '.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export default function CourseReviewPage() {
  const { params, navigate } = useNavigation()
  const courseId = params?.courseId

  const [course,   setCourse]   = useState(null)
  const [modules,  setModules]  = useState([])
  const [evalModule, setEvalModule] = useState(null)
  const [evalInfo, setEvalInfo] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [saving,   setSaving]   = useState(false)
  const [confirm,  setConfirm]  = useState(null) // 'publish' | 'reject'
  const [rejectNote, setRejectNote] = useState('')
  const [actionErr, setActionErr]   = useState('')

  useEffect(() => {
    if (!courseId) return
    load()
  }, [courseId])

  async function load() {
    setLoading(true)

    const { data: c } = await supabase
      .from('courses')
      .select('*, categories(name), profiles:instructor_id(full_name, email)')
      .eq('id', courseId)
      .single()

    const { data: mods } = await supabase
      .from('modules')
      .select('*, lessons(id, title, type, description, video_url, duration_mins, order_index)')
      .eq('course_id', courseId)
      .order('order_index')

    const regularMods = (mods || []).filter(m => m.title !== 'Evaluación Final')
    const evalMod     = (mods || []).find(m => m.title === 'Evaluación Final')

    // sort lessons
    regularMods.forEach(m => { m.lessons = (m.lessons || []).sort((a, b) => a.order_index - b.order_index) })
    if (evalMod) evalMod.lessons = (evalMod.lessons || []).sort((a, b) => a.order_index - b.order_index)

    // load quiz if eval module exists
    if (evalMod?.lessons?.[0]?.id) {
      const lessonId = evalMod.lessons[0].id
      const { data: quiz } = await supabase
        .from('quizzes')
        .select('*, questions(id, type, text, answers(id, text, is_correct))')
        .eq('lesson_id', lessonId)
        .single()
      setEvalInfo(quiz || null)
    }

    setCourse(c)
    setModules(regularMods)
    setEvalModule(evalMod || null)
    setLoading(false)
  }

  function toggleMod(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAction(action) {
    setSaving(true); setActionErr('')
    const status = action === 'publish' ? 'published' : 'draft'
    const { error } = await supabase.from('courses').update({ status }).eq('id', courseId)
    setSaving(false)
    if (error) { setActionErr(error.message); return }
    setConfirm(null)
    navigate('cursos')
  }

  // ── loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '.6rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', fontSize: '.88rem' }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          Cargando curso…
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </DashboardLayout>
    )
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
          Curso no encontrado.
        </div>
      </DashboardLayout>
    )
  }

  const totalModulesCount = modules.length + (evalModule ? 1 : 0)
  const totalLessons = modules.reduce((s, m) => s + (m.lessons?.length || 0), 0) + (evalModule?.lessons?.length || 0)
  const totalMins    = modules.reduce((s, m) => s + (m.lessons || []).reduce((ls, l) => ls + (Number(l.duration_mins) || 0), 0), 0)
                      + (evalModule?.lessons || []).reduce((ls, l) => ls + (Number(l.duration_mins) || 0), 0)

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .crp-mod { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: .65rem; }
        .crp-mod-hdr { display: flex; align-items: center; gap: .6rem; padding: .75rem 1rem; background: #FAFAF9; cursor: pointer; user-select: none; }
        .crp-mod-hdr:hover { background: #F5F4F2; }
        .crp-les { display: flex; align-items: center; gap: .55rem; padding: .55rem 1rem .55rem 2.4rem; border-top: 1px solid var(--border); background: white; }
        .crp-ans { display: flex; align-items: center; gap: .5rem; padding: .4rem .6rem; border-radius: 7px; font-size: .8rem; font-family: var(--sans); }
        .crp-ans.correct { background: rgba(22,125,120,.07); color: var(--jade); }
        .crp-ans.wrong   { background: #F9F9F8; color: var(--text-2); }
        @media (max-width: 768px) { .crp-pad { padding: 1.25rem 1rem 2rem !important; } .crp-cols { grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="crp-pad" style={{ padding: '2rem 2.5rem 3rem', animation: 'fadeIn .25s ease' }}>

        {/* ── Back + header ── */}
        <div style={{ marginBottom: '1.75rem' }}>
          <button onClick={() => navigate('cursos')}
            style={{ display: 'flex', alignItems: 'center', gap: '.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', fontSize: '.8rem', fontFamily: 'var(--sans)', padding: 0, marginBottom: '1.1rem' }}>
            {IC.back} Volver a cursos
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
            {/* Cover */}
            <div style={{ width: 96, height: 72, borderRadius: 10, background: 'linear-gradient(140deg,#0d3840,#082830)', flexShrink: 0, overflow: 'hidden' }}>
              {course.cover_image_url && <img src={course.cover_image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: '#C2410C', background: 'rgba(234,88,12,.08)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(234,88,12,.25)' }}>
                  En revisión
                </span>
                {course.categories?.name && <Tag>{course.categories.name}</Tag>}
                {course.level && <Tag bg="#F0F9FF" color="#0369A1" border="rgba(3,105,161,.2)">{LEVEL[course.level] || course.level}</Tag>}
              </div>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.3rem,2.5vw,1.75rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: '0 0 .4rem' }}>{course.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: 'var(--text-2)' }}>
                {IC.user}
                <span>{course.profiles?.full_name || 'Sin instructor'}</span>
                {course.profiles?.email && <span style={{ color: 'var(--border)' }}>·</span>}
                {course.profiles?.email && <span>{course.profiles.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick stats ── */}
        <div className="crp-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Módulos',   value: totalModulesCount },
            { label: 'Lecciones', value: totalLessons },
            { label: 'Duración',  value: totalMins ? `${Math.round(totalMins / 60 * 10) / 10} h` : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '.85rem 1.1rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)' }}>{s.value}</div>
              <div style={{ fontSize: '.71rem', color: 'var(--text-2)', marginTop: '.2rem', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Description ── */}
        {course.description && (
          <Section title="Descripción" icon={IC.text}>
            <p style={{ fontSize: '.875rem', color: 'var(--carbon)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{course.description}</p>
          </Section>
        )}

        {/* ── Structure ── */}
        <Section title="Estructura del curso" icon={IC.book}>
          {modules.length === 0 ? (
            <p style={{ fontSize: '.83rem', color: 'var(--text-2)', margin: 0 }}>
              {evalModule ? 'Este curso solo tiene evaluación final, sin módulos de contenido.' : 'Sin módulos.'}
            </p>
          ) : modules.map((mod, mi) => {
            const open = expanded.has(mod.id)
            return (
              <div key={mod.id} className="crp-mod">
                <div className="crp-mod-hdr" onClick={() => toggleMod(mod.id)}>
                  <div style={{ transform: open ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s', color: 'var(--text-2)' }}>{IC.chevD}</div>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--text-2)', minWidth: 22 }}>M{mi + 1}</span>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: 'var(--carbon)', flex: 1 }}>{mod.title || 'Sin título'}</span>
                  <span style={{ fontSize: '.72rem', color: 'var(--text-2)' }}>{mod.lessons?.length || 0} lecciones</span>
                </div>
                {open && (mod.lessons || []).map((les, li) => {
                  let videoLinks = []
                  try { videoLinks = les.video_url ? JSON.parse(les.video_url) : [] } catch { videoLinks = [] }
                  return (
                    <div key={les.id} style={{ borderTop: '1px solid var(--border)', background: 'white' }}>
                      <div className="crp-les" style={{ borderTop: 'none' }}>
                        <span style={{ fontSize: '.72rem', color: 'var(--text-2)', minWidth: 28 }}>{li + 1}.</span>
                        <span style={{ color: 'var(--text-2)' }}>{lesIcon(les.type)}</span>
                        <span style={{ fontSize: '.84rem', color: 'var(--carbon)', flex: 1 }}>{les.title || 'Sin título'}</span>
                        <span style={{ fontSize: '.71rem', color: 'var(--text-2)', background: '#F5F4F2', padding: '2px 7px', borderRadius: 5 }}>
                          {LESSON_TYPE_LABEL[les.type] || les.type}
                        </span>
                        {les.duration_mins > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '.25rem', fontSize: '.71rem', color: 'var(--text-2)' }}>
                            {IC.clock} {les.duration_mins} min
                          </span>
                        )}
                      </div>
                      {(les.description || videoLinks.length > 0) && (
                        <div style={{ padding: '.4rem 1rem .75rem 2.4rem' }}>
                          {les.description && (
                            <p style={{ fontSize: '.8rem', color: 'var(--text-2)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: '0 0 .4rem' }}>{les.description}</p>
                          )}
                          {videoLinks.map((v, vi) => (
                            <a key={vi} href={v.url} target="_blank" rel="noopener noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '.3rem', fontSize: '.76rem', color: 'var(--jade)', textDecoration: 'none', marginRight: '.75rem' }}>
                              {IC.video} {v.label || v.url}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </Section>

        {/* ── Evaluation ── */}
        {evalInfo && (
          <Section title="Evaluación final" icon={IC.quiz}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div><span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Nota mínima</span><div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)' }}>{evalInfo.passing_score ?? 70}%</div></div>
              <div><span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Intentos máx.</span><div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)' }}>{evalInfo.max_attempts ?? '∞'}</div></div>
              <div><span style={{ fontSize: '.7rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Preguntas</span><div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)' }}>{evalInfo.questions?.length || 0}</div></div>
            </div>
            {(evalInfo.questions || []).map((q, qi) => (
              <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 9, padding: '.9rem 1rem', marginBottom: '.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.55rem' }}>
                  <span style={{ fontSize: '.69rem', fontWeight: 600, color: 'var(--text-2)', background: '#F5F4F2', padding: '2px 7px', borderRadius: 5 }}>{Q_TYPE_LABEL[q.type] || q.type}</span>
                  <span style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--carbon)' }}>P{qi + 1}. {q.text}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
                  {(q.answers || []).map(a => (
                    <div key={a.id} className={`crp-ans ${a.is_correct ? 'correct' : 'wrong'}`}>
                      {a.is_correct
                        ? <span style={{ color: 'var(--jade)' }}>{IC.check}</span>
                        : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid #D0CEC9', display: 'inline-block', flexShrink: 0 }} />}
                      {a.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* ── Pricing ── */}
        <Section title="Precio" icon={IC.dollar}>
          {course.price === 0 || course.price == null
            ? <Tag bg="var(--jade-soft)" color="var(--jade)" border="rgba(22,125,120,.2)">Gratuito</Tag>
            : <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--carbon)' }}>${Number(course.price).toFixed(2)} <span style={{ fontSize: '.85rem', fontWeight: 400, color: 'var(--text-2)' }}>USD</span></div>}
        </Section>

        {/* ── Action buttons ── */}
        {actionErr && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '.7rem 1rem', marginBottom: '1rem', fontSize: '.84rem', color: '#B91C1C' }}>
            {IC.warn} {actionErr}
          </div>
        )}

        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', paddingTop: '.5rem' }}>
          <button onClick={() => { setConfirm('reject'); setRejectNote('') }}
            style={{ padding: '.65rem 1.5rem', border: '1.5px solid #FECACA', background: '#FEF2F2', color: '#B91C1C', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            {IC.x} Rechazar
          </button>
          <button onClick={() => setConfirm('publish')}
            style={{ padding: '.65rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            {IC.check} Publicar curso
          </button>
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(23,26,28,.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(23,26,28,.18)', animation: 'fadeIn .2s ease' }}>

            {confirm === 'publish' ? (
              <>
                <div style={{ width: 52, height: 52, background: 'var(--jade-soft)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--jade)', margin: '0 auto 1.25rem' }}>{IC.check}</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', textAlign: 'center', marginBottom: '.5rem' }}>¿Publicar este curso?</h3>
                <p style={{ fontSize: '.84rem', color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  El curso quedará visible para todos los estudiantes de la plataforma.
                </p>
                <div style={{ display: 'flex', gap: '.65rem' }}>
                  <button onClick={() => setConfirm(null)} disabled={saving}
                    style={{ flex: 1, padding: '.65rem', border: '1.5px solid var(--border)', background: 'white', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', color: 'var(--carbon)' }}>
                    Cancelar
                  </button>
                  <button onClick={() => handleAction('publish')} disabled={saving}
                    style={{ flex: 1, padding: '.65rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .6 : 1 }}>
                    {saving ? 'Publicando…' : 'Sí, publicar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 52, height: 52, background: '#FEF2F2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C', margin: '0 auto 1.25rem' }}>{IC.x}</div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', textAlign: 'center', marginBottom: '.5rem' }}>¿Rechazar este curso?</h3>
                <p style={{ fontSize: '.84rem', color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.6, marginBottom: '1rem' }}>
                  El curso volverá a estado borrador y el instructor podrá editarlo de nuevo.
                </p>
                <textarea
                  value={rejectNote}
                  onChange={e => setRejectNote(e.target.value)}
                  placeholder="Motivo del rechazo (opcional)…"
                  rows={3}
                  style={{ width: '100%', padding: '.65rem .9rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.84rem', color: 'var(--carbon)', fontFamily: 'var(--sans)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '1.25rem' }}
                />
                <div style={{ display: 'flex', gap: '.65rem' }}>
                  <button onClick={() => setConfirm(null)} disabled={saving}
                    style={{ flex: 1, padding: '.65rem', border: '1.5px solid var(--border)', background: 'white', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', color: 'var(--carbon)' }}>
                    Cancelar
                  </button>
                  <button onClick={() => handleAction('reject')} disabled={saving}
                    style={{ flex: 1, padding: '.65rem', background: '#DC2626', color: 'white', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .6 : 1 }}>
                    {saving ? 'Rechazando…' : 'Sí, rechazar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
