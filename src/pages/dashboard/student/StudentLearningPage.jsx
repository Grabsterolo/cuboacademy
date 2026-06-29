import { useEffect, useState } from 'react'
import { useNavigation } from '../../../context/NavigationContext'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../lib/supabase'
import DashboardLayout from '../../../components/dashboard/DashboardLayout'

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseLinks(raw) {
  if (!raw) return []
  try {
    const p = JSON.parse(raw)
    return Array.isArray(p) ? p : [{ url: raw, label: 'Video' }]
  } catch { return [{ url: raw, label: 'Video' }] }
}

function embedUrl(url) {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`
  return null
}

function lsKey(uid, cid) { return `lc_${uid}_${cid}` }
function loadCompleted(uid, cid) {
  try { const r = localStorage.getItem(lsKey(uid, cid)); return r ? new Set(JSON.parse(r)) : new Set() }
  catch { return new Set() }
}
function saveCompleted(uid, cid, set) {
  try { localStorage.setItem(lsKey(uid, cid), JSON.stringify([...set])) } catch {}
}

// ── Sub-components ────────────────────────────────────────────────────────────

const RES_ICONS = {
  pdf: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  template: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  link: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
}

function VideoPlayer({ links, activeIdx, onSelectIdx }) {
  const link = links[activeIdx]
  if (!link) return null
  const embed = embedUrl(link.url)

  return (
    <div>
      {links.length > 1 && (
        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '.75rem', flexWrap: 'wrap' }}>
          {links.map((l, i) => (
            <button key={i} onClick={() => onSelectIdx(i)}
              style={{ padding: '.3rem .85rem', borderRadius: 20, fontSize: '.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s', border: `1.5px solid ${activeIdx === i ? 'var(--jade)' : 'var(--border)'}`, background: activeIdx === i ? 'var(--jade-soft)' : 'white', color: activeIdx === i ? 'var(--jade)' : 'var(--text-2)' }}>
              {l.label || `Video ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#0a0a0a', borderRadius: 12, overflow: 'hidden' }}>
        {embed ? (
          <iframe
            src={embed}
            title={link.label || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <video
            src={link.url}
            controls
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          />
        )}
      </div>
    </div>
  )
}

function NoVideoPlaceholder() {
  return (
    <div style={{ width: '100%', paddingBottom: '42.25%', position: 'relative', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.75rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="var(--border)" stroke="none"/>
          </svg>
        </div>
        <p style={{ fontSize: '.85rem', color: 'var(--text-2)', fontFamily: 'var(--sans)', margin: 0 }}>Esta lección no tiene video</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function StudentLearningPage() {
  const { params, navigate } = useNavigation()
  const { user } = useAuth()
  const courseId = params?.courseId

  const [course, setCourse] = useState(null)
  const [modules, setModules] = useState([])
  const [enrollment, setEnrollment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notEnrolled, setNotEnrolled] = useState(false)

  const [activeLesson, setActiveLesson] = useState(null)
  const [activeVideoIdx, setActiveVideoIdx] = useState(0)
  const [completedIds, setCompletedIds] = useState(new Set())
  const [expandedMods, setExpandedMods] = useState(new Set())
  const [marking, setMarking] = useState(false)

  // Redirect if no courseId
  useEffect(() => {
    if (!courseId) navigate('cursos')
  }, [courseId])

  useEffect(() => {
    if (!courseId || !user) return
    loadAll()
  }, [courseId, user])

  async function loadAll() {
    setLoading(true)
    const [{ data: courseData }, { data: modulesData }, { data: enrollData }] = await Promise.all([
      supabase.from('courses')
        .select('id, title, cover_image_url, profiles!instructor_id(full_name)')
        .eq('id', courseId).single(),
      supabase.from('modules')
        .select('id, title, description, order_index, lessons(id, title, description, video_url, duration_mins, is_free_preview, order_index, resources(id, title, file_url, file_type))')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .order('order_index', { ascending: true, foreignTable: 'lessons' }),
      supabase.from('enrollments')
        .select('id, progress_pct, status, completed_at')
        .eq('student_id', user.id).eq('course_id', courseId).maybeSingle(),
    ])

    if (!enrollData) { setNotEnrolled(true); setLoading(false); return }

    setCourse(courseData)
    const mods = (modulesData || []).map(m => ({ ...m, lessons: m.lessons || [] }))
    setModules(mods)
    setEnrollment(enrollData)

    const completed = loadCompleted(user.id, courseId)
    setCompletedIds(completed)

    // Pick first lesson
    const allLessons = mods.flatMap(m => m.lessons)
    if (allLessons.length > 0) {
      const nextUncompleted = allLessons.find(l => !completed.has(l.id))
      setActiveLesson(nextUncompleted || allLessons[0])
      setExpandedMods(new Set(mods.map(m => m.id)))
    }
    setLoading(false)
  }

  function selectLesson(lesson) {
    setActiveLesson(lesson)
    setActiveVideoIdx(0)
    // Scroll to top of player on mobile
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function toggleMod(modId) {
    setExpandedMods(prev => {
      const next = new Set(prev)
      if (next.has(modId)) next.delete(modId); else next.add(modId)
      return next
    })
  }

  async function markComplete() {
    if (!activeLesson || marking) return
    const alreadyDone = completedIds.has(activeLesson.id)
    if (alreadyDone) {
      // Toggle off
      const next = new Set(completedIds)
      next.delete(activeLesson.id)
      setCompletedIds(next)
      saveCompleted(user.id, courseId, next)
      await updateProgress(next)
      return
    }

    setMarking(true)
    const next = new Set(completedIds)
    next.add(activeLesson.id)
    setCompletedIds(next)
    saveCompleted(user.id, courseId, next)
    await updateProgress(next)
    setMarking(false)

    // Auto-advance to next lesson
    goNext(next)
  }

  async function updateProgress(completed) {
    const allLessons = modules.flatMap(m => m.lessons)
    const total = allLessons.length
    if (!total || !enrollment) return
    const pct = Math.round((completed.size / total) * 100)
    const patch = { progress_pct: pct }
    if (pct >= 100) patch.status = 'completed', patch.completed_at = new Date().toISOString()
    await supabase.from('enrollments').update(patch).eq('id', enrollment.id)
    setEnrollment(e => ({ ...e, progress_pct: pct, ...(pct >= 100 ? { status: 'completed' } : {}) }))
  }

  function goNext(doneIds) {
    const allLessons = modules.flatMap(m => m.lessons)
    const idx = allLessons.findIndex(l => l.id === activeLesson.id)
    const next = allLessons.find((l, i) => i > idx && !(doneIds || completedIds).has(l.id))
    if (next) { setActiveLesson(next); setActiveVideoIdx(0) }
  }

  function goPrev() {
    const allLessons = modules.flatMap(m => m.lessons)
    const idx = allLessons.findIndex(l => l.id === activeLesson?.id)
    if (idx > 0) { setActiveLesson(allLessons[idx - 1]); setActiveVideoIdx(0) }
  }

  // Derived
  const allLessons = modules.flatMap(m => m.lessons)
  const totalLessons = allLessons.length
  const completedCount = completedIds.size
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
  const activeLinks = activeLesson ? parseLinks(activeLesson.video_url) : []
  const isCompleted = activeLesson ? completedIds.has(activeLesson.id) : false
  const activeIdx = allLessons.findIndex(l => l.id === activeLesson?.id)
  const hasPrev = activeIdx > 0
  const hasNext = activeIdx < allLessons.length - 1

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!courseId) return null

  return (
    <DashboardLayout>
      <style>{`
        .slp-pad { padding: 2rem 2.5rem 3rem; }
        .slp-sidebar { position: sticky; top: 1.5rem; max-height: calc(100vh - 3rem); overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        .slp-sidebar::-webkit-scrollbar { width: 5px; }
        .slp-sidebar::-webkit-scrollbar-track { background: transparent; }
        .slp-sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        .slp-les-row { display: flex; align-items: center; gap: .6rem; padding: .6rem .85rem; border-radius: 7px; cursor: pointer; transition: background .15s; user-select: none; -webkit-user-select: none; }
        .slp-les-row:hover { background: var(--cream); }
        .slp-les-row.active { background: var(--jade-soft) !important; }
        .slp-mark-btn { transition: all .2s; }
        .slp-mark-btn:hover { filter: brightness(.93); }
        @media (max-width: 900px) {
          .slp-grid { grid-template-columns: 1fr !important; }
          .slp-pad { padding: 1.25rem 1rem 2.5rem !important; }
          .slp-sidebar { position: static !important; max-height: none !important; }
        }
      `}</style>

      <div className="slp-pad">
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <button onClick={() => navigate('cursos')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem', color: 'var(--text-2)', marginBottom: '.85rem', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--sans)', padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--jade)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-2)'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Mis cursos
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--jade)', marginBottom: '.35rem' }}>Estudiante</p>
              <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: 0 }}>
                {loading ? '…' : course?.title || 'Cargando curso…'}
              </h1>
              {course?.profiles?.full_name && (
                <p style={{ fontSize: '.8rem', color: 'var(--text-2)', marginTop: '.3rem', fontFamily: 'var(--sans)' }}>por {course.profiles.full_name}</p>
              )}
            </div>
            {!loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>{completedCount}/{totalLessons} lecciones</div>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: progressPct >= 100 ? '#16A34A' : 'var(--carbon)' }}>{progressPct}%</div>
                </div>
                <div style={{ width: 48, height: 48, position: 'relative', flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ width: 48, height: 48, transform: 'rotate(-90deg)' }}>
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={progressPct >= 100 ? '#22C55E' : 'var(--jade)'} strokeWidth="3"
                      strokeDasharray={`${progressPct} ${100 - progressPct}`} strokeDashoffset="0" strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray .4s ease' }} />
                  </svg>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.6rem', fontWeight: 700, color: progressPct >= 100 ? '#16A34A' : 'var(--carbon)', fontFamily: 'var(--sans)' }}>
                    {progressPct}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="slp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
            <div>
              <div style={{ width: '100%', paddingBottom: '56.25%', background: 'var(--border)', borderRadius: 12, opacity: .5 }} />
              <div style={{ marginTop: '1.25rem', height: 24, background: 'var(--border)', borderRadius: 6, width: '60%', opacity: .4 }} />
              <div style={{ marginTop: '.75rem', height: 16, background: 'var(--border)', borderRadius: 6, width: '40%', opacity: .3 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
              {[1,2,3].map(i => <div key={i} style={{ height: 72, background: 'white', border: '1px solid var(--border)', borderRadius: 10, opacity: 1 - i * 0.25 }} />)}
            </div>
          </div>
        ) : notEnrolled ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--jade-soft)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>No estás matriculado en este curso</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)', marginBottom: '1.5rem' }}>Inscríbete primero para acceder al contenido.</p>
            <button onClick={() => navigate('tienda')}
              style={{ padding: '.7rem 1.5rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 9, fontSize: '.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
              Explorar cursos
            </button>
          </div>
        ) : totalLessons === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 14, padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--cream)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.1rem', border: '1px solid var(--border)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            </div>
            <p style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', marginBottom: '.4rem' }}>El curso no tiene lecciones todavía</p>
            <p style={{ fontSize: '.85rem', color: 'var(--text-2)' }}>El instructor está preparando el contenido.</p>
          </div>
        ) : (
          <div className="slp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>

            {/* ── Main content ── */}
            <div>
              {/* Video */}
              {activeLinks.length > 0
                ? <VideoPlayer links={activeLinks} activeIdx={activeVideoIdx} onSelectIdx={setActiveVideoIdx} />
                : <NoVideoPlaceholder />
              }

              {/* Lesson header */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', marginBottom: '.4rem' }}>
                      {/* Module name breadcrumb */}
                      {(() => {
                        const mod = modules.find(m => m.lessons.some(l => l.id === activeLesson?.id))
                        return mod ? <span style={{ fontSize: '.72rem', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)' }}>{mod.title}</span> : null
                      })()}
                      {activeLesson?.is_free_preview && (
                        <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light)', padding: '2px 7px', borderRadius: 10 }}>Preview gratuito</span>
                      )}
                    </div>
                    <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.1rem,2.5vw,1.45rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.25, margin: 0 }}>
                      {activeLesson?.title}
                    </h2>
                    {activeLesson?.duration_mins != null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', marginTop: '.5rem', fontSize: '.8rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        {activeLesson.duration_mins} min
                      </div>
                    )}
                  </div>

                  {/* Mark complete button */}
                  <button className="slp-mark-btn" onClick={markComplete} disabled={marking}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem', padding: '.6rem 1.1rem', borderRadius: 9, fontSize: '.85rem', fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', flexShrink: 0, border: 'none', transition: 'all .2s', opacity: marking ? .7 : 1, background: isCompleted ? '#DCFCE7' : 'var(--jade)', color: isCompleted ? '#16A34A' : 'white' }}>
                    {isCompleted ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Completada
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {marking ? 'Guardando…' : 'Marcar completada'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Description */}
              {activeLesson?.description && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '.88rem', color: 'var(--carbon)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', fontWeight: 300 }}>
                    {activeLesson.description}
                  </p>
                </div>
              )}

              {/* Resources */}
              {activeLesson?.resources?.length > 0 && (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: '.85rem' }}>Recursos de esta lección</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {activeLesson.resources.map(r => (
                      <a key={r.id} href={r.file_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '.65rem', padding: '.6rem .85rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', transition: 'border-color .15s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--jade)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                        <span style={{ color: 'var(--jade)', flexShrink: 0 }}>{RES_ICONS[r.file_type] || RES_ICONS.link}</span>
                        <span style={{ flex: 1, fontSize: '.84rem', fontWeight: 500, color: 'var(--carbon)', fontFamily: 'var(--sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                        <span style={{ fontSize: '.72rem', color: 'var(--jade)', fontWeight: 600, flexShrink: 0 }}>Descargar ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Prev / Next navigation */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginTop: '1.25rem' }}>
                <button onClick={goPrev} disabled={!hasPrev}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.6rem 1rem', background: 'white', border: '1px solid var(--border)', borderRadius: 9, fontSize: '.84rem', fontWeight: 500, color: hasPrev ? 'var(--carbon)' : 'var(--text-2)', cursor: hasPrev ? 'pointer' : 'not-allowed', opacity: hasPrev ? 1 : .45, fontFamily: 'var(--sans)', transition: 'border-color .15s' }}
                  onMouseEnter={e => hasPrev && (e.currentTarget.style.borderColor = 'var(--jade)')}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                  Anterior
                </button>
                <button onClick={() => { if (!isCompleted) markComplete(); else goNext(completedIds) }} disabled={!hasNext}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.6rem 1.1rem', background: hasNext ? 'var(--jade)' : 'var(--border)', border: 'none', borderRadius: 9, fontSize: '.84rem', fontWeight: 600, color: hasNext ? 'white' : 'var(--text-2)', cursor: hasNext ? 'pointer' : 'not-allowed', opacity: hasNext ? 1 : .5, fontFamily: 'var(--sans)', transition: 'background .2s' }}
                  onMouseEnter={e => hasNext && (e.currentTarget.style.background = 'var(--jade-dark,#0d4a46)')}
                  onMouseLeave={e => hasNext && (e.currentTarget.style.background = 'var(--jade)')}>
                  Siguiente
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>

              {/* Course completed banner */}
              {progressPct >= 100 && (
                <div style={{ marginTop: '1.5rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'var(--serif)', fontSize: '.95rem', fontWeight: 700, color: '#14532D', margin: '0 0 .2rem' }}>¡Curso completado!</p>
                    <p style={{ fontSize: '.82rem', color: '#166534', margin: 0 }}>Felicidades, has completado todas las lecciones de este curso.</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Sidebar ── */}
            <div className="slp-sidebar">
              {/* Progress card */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.65rem' }}>
                  <span style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-2)' }}>Progreso</span>
                  <span style={{ fontSize: '.78rem', fontWeight: 700, color: progressPct >= 100 ? '#16A34A' : 'var(--jade)' }}>{progressPct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--cream)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct >= 100 ? '#22C55E' : 'var(--jade)', borderRadius: 3, transition: 'width .4s ease' }} />
                </div>
                <div style={{ fontSize: '.73rem', color: 'var(--text-2)', marginTop: '.45rem' }}>
                  {completedCount} de {totalLessons} lecciones completadas
                </div>
              </div>

              {/* Module accordion */}
              {modules.map((mod, mi) => {
                const isOpen = expandedMods.has(mod.id)
                const modCompleted = mod.lessons.filter(l => completedIds.has(l.id)).length
                return (
                  <div key={mod.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, marginBottom: '.65rem', overflow: 'hidden' }}>
                    {/* Module header */}
                    <div onClick={() => toggleMod(mod.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.85rem 1rem', cursor: 'pointer', userSelect: 'none', WebkitUserSelect: 'none', transition: 'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                      <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--jade-soft)', border: '1px solid var(--jade-light,rgba(22,125,120,.18))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--jade)' }}>{mi + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--carbon)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                        <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginTop: '.1rem' }}>{modCompleted}/{mod.lessons.length} completadas</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2" strokeLinecap="round"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>

                    {/* Lesson list */}
                    {isOpen && mod.lessons.map((les, li) => {
                      const isActive = les.id === activeLesson?.id
                      const done = completedIds.has(les.id)
                      return (
                        <div key={les.id} className={`slp-les-row${isActive ? ' active' : ''}`}
                          onClick={() => selectLesson(les)}
                          style={{ borderTop: '1px solid var(--border)' }}>
                          {/* Status icon */}
                          <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? '#22C55E' : isActive ? 'var(--jade)' : 'var(--cream)', border: `1.5px solid ${done ? '#16A34A' : isActive ? 'var(--jade)' : 'var(--border)'}`, transition: 'all .2s' }}>
                            {done ? (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : isActive ? (
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none"><circle cx="12" cy="12" r="6"/></svg>
                            ) : (
                              <span style={{ fontSize: '.55rem', fontWeight: 700, color: 'var(--text-2)' }}>{li + 1}</span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '.8rem', fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--jade)' : done ? 'var(--text-2)' : 'var(--carbon)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                              {les.title}
                            </div>
                            {les.duration_mins != null && (
                              <div style={{ fontSize: '.68rem', color: 'var(--text-2)', marginTop: '.1rem' }}>{les.duration_mins} min</div>
                            )}
                          </div>

                          {les.is_free_preview && !done && (
                            <span style={{ fontSize: '.6rem', fontWeight: 700, color: 'var(--jade)', background: 'var(--jade-soft)', border: '1px solid var(--jade-light,rgba(22,125,120,.18))', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>Free</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
