import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../../../../context/NavigationContext'
import { useAuth } from '../../../../context/AuthContext'
import { supabase } from '../../../../lib/supabase'
import { slugify } from '../../../../lib/slugify'
import { uid, stripHtml, isLessonContentComplete, isQuestionComplete } from './components/shared'

// content-only snapshot of modules/lessons (excludes UI state like `expanded`
// and client-local ids), used to detect no-op saves of step 2/3
function snapshotModules(mods) {
  return JSON.stringify(mods.map(m => ({
    dbId: m.dbId, title: m.title.trim(),
    lessons: m.lessons.map(l => ({
      dbId: l.dbId, title: l.title.trim(), type: l.type, duration_mins: l.duration_mins,
      video_url: l.video_url, content_text: l.content_text, links: l.links,
    })),
  })))
}

export function useCourseWizard() {
  const { params, navigate } = useNavigation()
  const { profile }          = useAuth()

  const isEdit = Boolean(params?.courseId)

  const [step, setStep]             = useState(1)
  const [completed, setCompleted]   = useState(new Set())
  const [courseId, setCourseId]     = useState(params?.courseId || null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(isEdit)
  const [error, setError]           = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [categories, setCategories]   = useState([])
  const [instructors, setInstructors] = useState([])
  const isAdmin = profile?.role === 'admin'

  // Step 1 state
  const [info, setInfo]            = useState({ title: '', categoryId: '', level: 'beginner', description: '', coverUrl: '', instructorId: '' })
  const [imgUploading, setImgUploading] = useState(false)
  const [imgErr, setImgErr]        = useState('')

  // Step 2–3 state
  const [modules, setModules]      = useState([])

  // Step 4 state
  const [evalData, setEvalData]    = useState({ hasEval: false, minScore: 70, maxAttempts: 1, questions: [] })

  // Step 5 state
  const [cert, setCert]            = useState({ hasCert: false, certName: '', certCondition: 'complete' })

  // Step 6 state
  const [pricing, setPricing]      = useState({ isFree: true, price: '', discount: '' })

  // Step 8
  const [pubStatus, setPubStatus]  = useState('draft')
  const [pubError, setPubError]    = useState('')

  // profile?.role resolves asynchronously (undefined -> the real role), which
  // re-fires this effect a second time — loadedRef keeps loadExisting from
  // running twice and overwriting whatever the instructor has already typed.
  const loadedRef = useRef(false)
  // snapshot of the last-saved step 2/3 structure (content fields only, no UI
  // state like `expanded`) — lets saveStep2 skip the whole round-trip when
  // the instructor re-saves without touching structure/content
  const lastSavedModulesRef = useRef(null)
  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
    if (profile?.role === 'admin') {
      supabase.from('users_view').select('id, full_name').in('role', ['instructor', 'admin']).order('full_name').then(({ data }) => setInstructors(data || []))
    }
    if (isEdit && !loadedRef.current) {
      loadedRef.current = true
      loadExisting(params.courseId)
    }
  }, [profile?.role])

  // ── load existing course ──────────────────────────────────────────────────
  async function loadExisting(cId) {
    setLoading(true)
    try {
      const [
        { data: course, error: courseErr },
        { data: mods, error: modsErr },
        { data: evalMod, error: evalErr },
      ] = await Promise.all([
        supabase.from('courses').select('*').eq('id', cId).single(),
        supabase.from('modules').select('*, lessons(*, resources(*))').eq('course_id', cId).neq('title', 'Evaluación Final').order('order_index').order('order_index', { foreignTable: 'lessons' }),
        supabase.from('modules').select('*, lessons(*, quizzes(*, questions(*, answers(id, text, order_index))))').eq('course_id', cId).eq('title', 'Evaluación Final').maybeSingle(),
      ])

      if (courseErr || modsErr || evalErr) {
        setError('No se pudo cargar el curso. Recarga la página antes de continuar — guardar ahora podría sobrescribirlo con datos en blanco.')
        setLoadFailed(true)
        return
      }

      if (course) {
        setInfo({ title: course.title || '', categoryId: course.category_id || '', level: course.level || 'beginner', description: course.description || '', coverUrl: course.cover_image_url || '', instructorId: course.instructor_id || '' })
        setPricing({ isFree: !course.price || course.price === 0, price: course.price ? String(course.price) : '', discount: '' })
        setPubStatus(course.status || 'draft')
        setCert({ hasCert: course.has_certificate || false, certName: course.certificate_name || '', certCondition: course.certificate_condition || 'complete' })
      }

      if (mods) {
        const loadedModules = mods.map(m => ({
          id: uid(), dbId: m.id, title: m.title, expanded: true,
          lessons: (m.lessons || []).map(l => {
            let video_url = ''
            if (l.video_url) {
              try { const p = JSON.parse(l.video_url); video_url = Array.isArray(p) ? (p[0]?.url || '') : l.video_url } catch { video_url = l.video_url }
            }
            const links = (l.resources || []).filter(r => r.file_type === 'link').map(r => ({ id: uid(), url: r.file_url, label: r.title || '' }))
            return { id: uid(), dbId: l.id, title: l.title, type: l.type || 'video', duration_mins: l.duration_mins != null ? String(l.duration_mins) : '', video_url, content_text: l.description || '', links }
          }),
        }))
        setModules(loadedModules)
        lastSavedModulesRef.current = snapshotModules(loadedModules)
      }

      if (evalMod) {
        const quiz = evalMod.lessons?.[0]?.quizzes?.[0]
        if (quiz) {
          const { data: answerKey, error: keyErr } = await supabase.rpc('get_answer_key', { p_quiz_ids: [quiz.id] })
          if (keyErr) {
            setError('No se pudo cargar la clave de respuestas del examen. Recarga la página antes de continuar.')
            setLoadFailed(true)
            return
          }
          const correctById = new Map((answerKey || []).map(k => [k.answer_id, k.is_correct]))
          setEvalData({
            hasEval: true,
            minScore: quiz.passing_score || 70, maxAttempts: quiz.max_attempts == null ? 0 : quiz.max_attempts,
            questions: (quiz.questions || []).map(q => ({
              id: uid(), dbId: q.id, type: q.type, text: q.text, score: q.points || 1, expanded: false,
              answers: (q.answers || []).map(a => ({ id: uid(), dbId: a.id, text: a.text, correct: correctById.get(a.id) || false })),
            })),
          })
        }
      }

      setCompleted(new Set([1, 2, 3, 4, 5, 6, 7, 8]))
    } finally {
      setLoading(false)
    }
  }

  // ── image upload ──────────────────────────────────────────────────────────
  async function handleImgUpload(file) {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setImgErr('Solo JPG, PNG o WebP.'); return }
    if (file.size > 5 * 1024 * 1024) { setImgErr('Máximo 5 MB.'); return }
    setImgErr(''); setImgUploading(true)
    const prevUrl = info.coverUrl
    const name = `${Date.now()}-${file.name}`
    const { error: upErr } = await supabase.storage.from('course-images').upload(name, file)
    if (upErr) { setImgErr(upErr.message); setImgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(name)
    setInfo(i => ({ ...i, coverUrl: publicUrl }))
    setImgUploading(false)
    // best-effort: remove the replaced cover so re-uploads don't accumulate orphans
    if (prevUrl && prevUrl.includes('/course-images/')) {
      const prevName = decodeURIComponent(prevUrl.split('/course-images/')[1].split('?')[0])
      if (prevName && !prevName.startsWith('avatars/')) {
        await supabase.storage.from('course-images').remove([prevName])
      }
    }
  }

  // ── step validations ──────────────────────────────────────────────────────
  function validateStep(n) {
    switch (n) {
      case 1:
        if (!info.title.trim())                  return 'El título del curso es obligatorio.'
        if (isAdmin && !info.instructorId)        return 'Selecciona un instructor.'
        if (!info.categoryId)                     return 'Selecciona una categoría.'
        if (!stripHtml(info.description))         return 'La descripción es obligatoria.'
        if (stripHtml(info.description).length > 400) return 'La descripción no puede superar los 400 caracteres.'
        if (!info.coverUrl)                       return 'Sube una imagen de portada.'
        return null
      case 2:
        if (modules.length === 0)                            return 'Agrega al menos un módulo.'
        if (modules.every(m => m.lessons.length === 0))     return 'Agrega al menos una lección.'
        if (modules.some(m => !m.title.trim()))             return 'Todos los módulos necesitan un título.'
        if (modules.some(m => m.title.trim().toLowerCase() === 'evaluación final')) return '"Evaluación Final" es un nombre reservado para el examen del curso. Renombra ese módulo.'
        if (modules.some(m => m.lessons.some(l => !l.title.trim()))) return 'Todas las lecciones necesitan un título.'
        if (modules.some(m => m.lessons.some(l => !l.type)))        return 'Elige un modo (video, texto o documento) para cada lección.'
        return null
      case 3:
        if (modules.some(m => m.lessons.some(l => !isLessonContentComplete(l)))) {
          return 'Cada lección necesita su contenido: URL de video/documento, o texto explicativo para lecciones de texto.'
        }
        return null
      case 4:
        if (evalData.hasEval && evalData.questions.length === 0) return 'Agrega al menos una pregunta.'
        if (evalData.hasEval) {
          if (evalData.questions.some(q => !q.text.trim())) return 'Todas las preguntas necesitan un texto.'
          if (evalData.questions.some(q => !isQuestionComplete(q))) {
            return 'Cada pregunta de opción o verdadero/falso necesita al menos una respuesta marcada como correcta.'
          }
        }
        return null
      case 5:
        if (cert.hasCert && !cert.certName.trim()) return 'El nombre del certificado es obligatorio.'
        return null
      case 6:
        if (!pricing.isFree && !(parseFloat(pricing.price) > 0)) return 'Ingresa un precio mayor a 0.'
        return null
      default:
        return null
    }
  }

  // ── save step 1 ───────────────────────────────────────────────────────────
  // Retries with a random suffix on a slug collision (courses.slug is unique in
  // the DB) instead of surfacing a raw constraint-violation error to the instructor.
  async function withUniqueSlug(baseSlug, attemptFn) {
    let candidate = baseSlug
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await attemptFn(candidate)
      } catch (e) {
        const isSlugClash = e.code === '23505' && /slug/.test(e.message || '')
        if (!isSlugClash) throw e
        candidate = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
      }
    }
    throw new Error('No se pudo generar una URL única para este curso. Cambia el título e intenta de nuevo.')
  }

  async function saveStep1() {
    const baseSlug = slugify(info.title.trim())
    const payload = {
      title: info.title.trim(),
      description: info.description.trim(),
      instructor_id: (isAdmin && info.instructorId) ? info.instructorId : profile.id,
      category_id: info.categoryId || null,
      cover_image_url: info.coverUrl || null,
      level: info.level,
    }
    if (courseId) {
      await withUniqueSlug(baseSlug, async candidate => {
        const { error } = await supabase.from('courses').update({ ...payload, slug: candidate }).eq('id', courseId)
        if (error) throw error
      })
      return courseId
    } else {
      const newId = await withUniqueSlug(baseSlug, async candidate => {
        const { data, error } = await supabase.from('courses').insert({ ...payload, slug: candidate, status: 'draft', price: 0 }).select('id').single()
        if (error) throw error
        return data.id
      })
      setCourseId(newId)
      return newId
    }
  }

  // ── save step 2 (diff by id: update kept rows in place, only touch what
  // changed — keeps lesson ids stable so lesson_progress/resources tied to
  // untouched lessons survive a structure re-save; excludes eval module) ────
  async function saveStep2(cId) {
    if (!cId) return
    const snapshot = snapshotModules(modules)
    if (snapshot === lastSavedModulesRef.current) return // nothing changed since the last save

    const { data: existingMods, error: modsReadErr } = await supabase.from('modules')
      .select('id, lessons(id)').eq('course_id', cId).neq('title', 'Evaluación Final')
    if (modsReadErr) throw modsReadErr

    const existingModIds = new Set((existingMods || []).map(m => m.id))
    const existingLessonIdsByMod = new Map((existingMods || []).map(m => [m.id, new Set((m.lessons || []).map(l => l.id))]))
    const clientModDbIds = new Set(modules.map(m => m.dbId).filter(Boolean))

    // modules the instructor removed — cascades their own lessons/resources/quizzes/lesson_progress
    const modsToDelete = [...existingModIds].filter(id => !clientModDbIds.has(id))
    if (modsToDelete.length > 0) {
      await supabase.from('modules').delete().in('id', modsToDelete).throwOnError()
    }

    const modIdMap = {} // client module id -> db module id
    const keptModuleIds = new Set(modules.filter(m => m.dbId && existingModIds.has(m.dbId)).map(m => m.id))

    // update modules kept in place — id (and every descendant lesson id) never changes
    for (const [i, mod] of modules.entries()) {
      if (!keptModuleIds.has(mod.id)) continue
      const { error } = await supabase.from('modules')
        .update({ title: mod.title.trim(), order_index: i + 1 }).eq('id', mod.dbId)
      if (error) throw error
      modIdMap[mod.id] = mod.dbId
    }

    // batch insert brand-new modules in one round-trip
    const newModules = modules.filter(m => !keptModuleIds.has(m.id))
    if (newModules.length > 0) {
      const { data: modRows, error: modErr } = await supabase.from('modules')
        .insert(newModules.map(mod => ({ course_id: cId, title: mod.title.trim(), order_index: modules.findIndex(m => m.id === mod.id) + 1 })))
        .select('id')
      if (modErr) throw modErr
      newModules.forEach((mod, i) => { modIdMap[mod.id] = modRows[i].id })
    }

    const lessonIdMap = {} // client lesson id -> db lesson id, across all modules

    for (const mod of modules) {
      const dbModId = modIdMap[mod.id]
      const existingLessonIds = existingLessonIdsByMod.get(dbModId) || new Set()
      const clientLessonDbIds = new Set(mod.lessons.map(l => l.dbId).filter(Boolean))

      // lessons the instructor removed — cascades their own resources/quizzes/lesson_progress
      const lessonsToDelete = [...existingLessonIds].filter(id => !clientLessonDbIds.has(id))
      if (lessonsToDelete.length > 0) {
        await supabase.from('resources').delete().in('lesson_id', lessonsToDelete).throwOnError()
        await supabase.from('lessons').delete().in('id', lessonsToDelete).throwOnError()
      }

      const keptLessonIds = new Set(mod.lessons.filter(l => l.dbId && existingLessonIds.has(l.dbId)).map(l => l.id))

      // update lessons kept in place — id untouched, so lesson_progress survives
      for (const [j, les] of mod.lessons.entries()) {
        if (!keptLessonIds.has(les.id)) continue
        const { error } = await supabase.from('lessons').update({
          title: les.title.trim(),
          description: les.content_text || null,
          video_url: les.video_url ? JSON.stringify([{ url: les.video_url, label: les.type === 'document' ? 'Documento' : 'Video' }]) : null,
          duration_mins: les.duration_mins !== '' ? parseInt(les.duration_mins) || null : null,
          type: les.type || 'video',
          order_index: j + 1,
        }).eq('id', les.dbId)
        if (error) throw error
        lessonIdMap[les.id] = les.dbId
      }

      // batch insert brand-new lessons of this module in one round-trip
      const newLessons = mod.lessons.filter(l => !keptLessonIds.has(l.id))
      if (newLessons.length > 0) {
        const { data: lesRows, error: lesErr } = await supabase.from('lessons').insert(newLessons.map(les => ({
          module_id: dbModId,
          title: les.title.trim(),
          description: les.content_text || null,
          video_url: les.video_url ? JSON.stringify([{ url: les.video_url, label: les.type === 'document' ? 'Documento' : 'Video' }]) : null,
          duration_mins: les.duration_mins !== '' ? parseInt(les.duration_mins) || null : null,
          is_free_preview: false,
          type: les.type || 'video',
          order_index: mod.lessons.findIndex(l => l.id === les.id) + 1,
        }))).select('id')
        if (lesErr) throw lesErr
        newLessons.forEach((les, i) => { lessonIdMap[les.id] = lesRows[i].id })
      }
    }

    // external links: nothing references a resource's own id, so nuke-and-reinsert
    // stays safe — batched across every lesson in one delete + one insert instead
    // of a delete/insert pair per lesson (was the biggest source of round-trips
    // on courses with many lessons)
    const allLessonDbIds = modules.flatMap(mod => mod.lessons.map(les => lessonIdMap[les.id]))
    if (allLessonDbIds.length > 0) {
      await supabase.from('resources').delete().in('lesson_id', allLessonDbIds).eq('file_type', 'link').throwOnError()
    }
    const linkRows = modules.flatMap(mod => mod.lessons.flatMap(les => {
      const dbLesId = lessonIdMap[les.id]
      return (les.links || [])
        .filter(lk => lk.url && lk.url.trim())
        .map(lk => ({ lesson_id: dbLesId, title: lk.label?.trim() || lk.url.trim(), file_url: lk.url.trim(), file_type: 'link' }))
    }))
    if (linkRows.length > 0) {
      const { error: resErr } = await supabase.from('resources').insert(linkRows)
      if (resErr) throw resErr
    }

    const updatedModules = modules.map(m => ({
      ...m,
      dbId: modIdMap[m.id] ?? m.dbId,
      lessons: m.lessons.map(l => ({ ...l, dbId: lessonIdMap[l.id] ?? l.dbId })),
    }))
    setModules(updatedModules)
    lastSavedModulesRef.current = snapshotModules(updatedModules)
  }

  // ── save step 4 (evaluation quiz) ─────────────────────────────────────────
  // Diffs by id like saveStep2: quizzes.id -> quiz_attempts and questions.id ->
  // quiz_responses both cascade on delete, so recreating the quiz/questions on
  // every save (as before) silently wiped a student's exam attempt history.
  async function saveStep4(cId) {
    const { data: existingEvalMod, error: evalModReadErr } = await supabase.from('modules')
      .select('id, lessons(id, quizzes(id))').eq('course_id', cId).eq('title', 'Evaluación Final').maybeSingle()
    if (evalModReadErr) throw evalModReadErr

    const existingModId  = existingEvalMod?.id || null
    const existingLesId   = existingEvalMod?.lessons?.[0]?.id || null
    const existingQuizId  = existingEvalMod?.lessons?.[0]?.quizzes?.[0]?.id || null

    if (!evalData.hasEval || evalData.questions.length === 0) {
      // evaluation removed/disabled — clean up any existing eval structure entirely
      if (existingQuizId) {
        const { data: existingQs, error: existingQsErr } = await supabase.from('questions').select('id').eq('quiz_id', existingQuizId)
        if (existingQsErr) throw existingQsErr
        if (existingQs?.length > 0) {
          await supabase.from('answers').delete().in('question_id', existingQs.map(q => q.id)).throwOnError()
        }
        await supabase.from('questions').delete().eq('quiz_id', existingQuizId).throwOnError()
      }
      if (existingLesId) await supabase.from('quizzes').delete().eq('lesson_id', existingLesId).throwOnError()
      if (existingModId) {
        await supabase.from('lessons').delete().eq('module_id', existingModId).throwOnError()
        await supabase.from('modules').delete().eq('id', existingModId).throwOnError()
      }
      return
    }

    // ensure module/lesson/quiz exist — these have no user-editable fields of
    // their own beyond what's set once at creation, so just reuse the id if present
    let modId = existingModId, lesId = existingLesId, quizId = existingQuizId

    if (!modId) {
      const { data: newMod, error } = await supabase.from('modules')
        .insert({ course_id: cId, title: 'Evaluación Final', order_index: 9999 }).select('id').single()
      if (error) throw error
      modId = newMod.id
    }

    if (!lesId) {
      const { data: newLes, error } = await supabase.from('lessons')
        .insert({ module_id: modId, title: 'Examen Final', order_index: 1, is_free_preview: false }).select('id').single()
      if (error) throw error
      lesId = newLes.id
    }

    if (quizId) {
      const { error } = await supabase.from('quizzes')
        .update({ passing_score: evalData.minScore, max_attempts: evalData.maxAttempts === 0 ? null : evalData.maxAttempts }).eq('id', quizId)
      if (error) throw error
    } else {
      const { data: newQuiz, error } = await supabase.from('quizzes')
        .insert({ lesson_id: lesId, title: 'Evaluación del curso', passing_score: evalData.minScore, max_attempts: evalData.maxAttempts === 0 ? null : evalData.maxAttempts }).select('id').single()
      if (error) throw error
      quizId = newQuiz.id
    }

    // diff questions by id
    const { data: existingQs, error: qReadErr } = await supabase.from('questions').select('id').eq('quiz_id', quizId)
    if (qReadErr) throw qReadErr
    const existingQIds = new Set((existingQs || []).map(q => q.id))
    const clientQDbIds = new Set(evalData.questions.map(q => q.dbId).filter(Boolean))

    const qsToDelete = [...existingQIds].filter(id => !clientQDbIds.has(id))
    if (qsToDelete.length > 0) {
      await supabase.from('answers').delete().in('question_id', qsToDelete).throwOnError()
      await supabase.from('questions').delete().in('id', qsToDelete).throwOnError()
    }

    const keptQIds = new Set(evalData.questions.filter(q => q.dbId && existingQIds.has(q.dbId)).map(q => q.id))
    const questionIdMap = {}

    for (const [i, q] of evalData.questions.entries()) {
      if (!keptQIds.has(q.id)) continue
      const { error } = await supabase.from('questions')
        .update({ type: q.type, text: q.text.trim(), points: q.score || 1, order_index: i + 1 }).eq('id', q.dbId)
      if (error) throw error
      questionIdMap[q.id] = q.dbId
    }

    const newQuestions = evalData.questions.filter(q => !keptQIds.has(q.id))
    if (newQuestions.length > 0) {
      const { data: qRows, error: qErr } = await supabase.from('questions')
        .insert(newQuestions.map(q => ({
          quiz_id: quizId, type: q.type, text: q.text.trim(), points: q.score || 1,
          order_index: evalData.questions.findIndex(qq => qq.id === q.id) + 1,
        })))
        .select('id')
      if (qErr) throw qErr
      newQuestions.forEach((q, i) => { questionIdMap[q.id] = qRows[i].id })
    }

    // diff answers per question
    const answerIdMap = {}
    for (const q of evalData.questions) {
      const dbQId = questionIdMap[q.id]

      if (q.type === 'true_false' && q.answers.length === 0) {
        // pre-existing edge case: an unanswered true/false question saves both options as false
        const { error } = await supabase.from('answers').insert([
          { question_id: dbQId, text: 'Verdadero', is_correct: false },
          { question_id: dbQId, text: 'Falso', is_correct: false },
        ])
        if (error) throw error
        continue
      }

      const { data: existingAs, error: aReadErr } = await supabase.from('answers').select('id').eq('question_id', dbQId)
      if (aReadErr) throw aReadErr
      const existingAIds = new Set((existingAs || []).map(a => a.id))
      const clientADbIds = new Set(q.answers.map(a => a.dbId).filter(Boolean))

      const asToDelete = [...existingAIds].filter(id => !clientADbIds.has(id))
      if (asToDelete.length > 0) {
        await supabase.from('answers').delete().in('id', asToDelete).throwOnError()
      }

      const keptAIds = new Set(q.answers.filter(a => a.dbId && existingAIds.has(a.dbId)).map(a => a.id))
      for (const a of q.answers) {
        if (!keptAIds.has(a.id)) continue
        const { error } = await supabase.from('answers').update({ text: a.text.trim(), is_correct: a.correct }).eq('id', a.dbId)
        if (error) throw error
        answerIdMap[a.id] = a.dbId
      }

      const newAnswers = q.answers.filter(a => !keptAIds.has(a.id))
      if (newAnswers.length > 0) {
        const { data: aRows, error: aErr } = await supabase.from('answers')
          .insert(newAnswers.map(a => ({ question_id: dbQId, text: a.text.trim(), is_correct: a.correct })))
          .select('id')
        if (aErr) throw aErr
        newAnswers.forEach((a, i) => { answerIdMap[a.id] = aRows[i].id })
      }
    }

    setEvalData(e => ({
      ...e,
      questions: e.questions.map(q => ({
        ...q,
        dbId: questionIdMap[q.id] ?? q.dbId,
        answers: q.answers.map(a => ({ ...a, dbId: answerIdMap[a.id] ?? a.dbId })),
      })),
    }))
  }

  // ── save step 5 (certificate) ─────────────────────────────────────────────
  async function saveStep5(cId) {
    const { error } = await supabase.from('courses').update({
      has_certificate: cert.hasCert,
      certificate_name: cert.hasCert ? (cert.certName.trim() || null) : null,
      certificate_condition: cert.certCondition,
    }).eq('id', cId)
    if (error) throw error
  }

  // ── save step 6 (price) ───────────────────────────────────────────────────
  async function saveStep6(cId) {
    const finalPrice = pricing.isFree ? 0 : (parseFloat(pricing.price) || 0)
    const { error } = await supabase.from('courses').update({ price: finalPrice }).eq('id', cId)
    if (error) throw error
  }

  // ── save current step to DB ───────────────────────────────────────────────
  async function persistStep(n, cId) {
    if (n === 1) await saveStep1()
    if (n === 2) await saveStep2(cId)
    if (n === 3) await saveStep2(cId) // step 3 edits lesson content held in the same modules state
    if (n === 4) await saveStep4(cId)
    if (n === 5) await saveStep5(cId)
    if (n === 6) await saveStep6(cId)
  }

  // ── next handler (create mode) ────────────────────────────────────────────
  async function handleNext() {
    if (loadFailed) { setError('No se pudo cargar el curso. Recarga la página para continuar.'); return }
    const validErr = validateStep(step)
    if (validErr) { setError(validErr); return }
    setError(''); setSaving(true)
    try {
      let cId = courseId
      if (step === 1) { cId = await saveStep1() }
      else { await persistStep(step, cId) }
      setCompleted(s => new Set([...s, step]))
      setStep(n => n + 1)
    } catch (e) {
      setError(e.message || 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  // ── save step handler (edit mode) ─────────────────────────────────────────
  async function handleSaveStep() {
    if (loadFailed) { setError('No se pudo cargar el curso. Recarga la página para continuar.'); return }
    const validErr = validateStep(step)
    if (validErr) { setError(validErr); return }
    setError(''); setSaving(true)
    try {
      await persistStep(step, courseId)
      setCompleted(s => new Set([...s, step]))
    } catch (e) {
      setError(e.message || 'Error al guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function handleBack() { setError(''); setStep(n => n - 1) }

  // ── publish / status handlers ─────────────────────────────────────────────
  async function handleDraft() {
    if (!courseId) return
    setSaving(true); setPubError('')
    const { error } = await supabase.from('courses').update({ status: 'draft' }).eq('id', courseId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('cursos')
  }

  async function handleReview() {
    if (!courseId) return
    const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0)
    if (modules.length === 0 || totalLessons === 0) {
      setPubError('Tu curso necesita al menos un módulo con una lección antes de enviarlo a revisión o publicarlo.')
      return
    }
    setSaving(true); setPubError('')
    // 'review' is a UI-only state; map to valid DB enum values
    const dbStatus = pubStatus === 'review' ? 'pending' : pubStatus
    const { error } = await supabase.from('courses').update({ status: dbStatus }).eq('id', courseId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('cursos')
  }

  return {
    step, setStep, completed, isEdit, loading, saving, error, setError, courseId,
    info, setInfo, imgUploading, imgErr, handleImgUpload,
    categories, instructors, isAdmin,
    modules, setModules,
    evalData, setEvalData,
    cert, setCert, pricing, setPricing,
    pubStatus, setPubStatus, pubError,
    navigate,
    handleNext, handleBack, handleSaveStep, handleDraft, handleReview,
    validateStep,
  }
}
