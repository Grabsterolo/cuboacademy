import { useEffect, useRef, useState } from 'react'
import { useNavigation } from '../../../../context/NavigationContext'
import { useAuth } from '../../../../context/AuthContext'
import { supabase } from '../../../../lib/supabase'
import { slugify } from '../../../../lib/slugify'
import { validateImageFile, resizeImage } from '../../../../lib/imageProcessing'
import { withUniqueSlug } from '../../../../lib/withUniqueSlug'
import { stripHtml } from '../course-wizard/components/shared'

const TOTAL_STEPS = 6

// A stored timestamp is UTC ISO; a <input type="datetime-local"> needs
// "YYYY-MM-DDTHH:mm" in the browser's local time, or editing an existing
// event silently shifts its hour by the timezone offset.
function toDatetimeLocal(iso) {
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function useEventWizard() {
  const { params, navigate } = useNavigation()
  const { profile }          = useAuth()

  const isEdit = Boolean(params?.eventId)

  const [step, setStep]             = useState(1)
  const [completed, setCompleted]   = useState(new Set())
  const [eventId, setEventId]       = useState(params?.eventId || null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(isEdit)
  const [error, setError]           = useState('')
  const [loadFailed, setLoadFailed] = useState(false)
  const [categories, setCategories]   = useState([])
  const [instructors, setInstructors] = useState([])
  const [enrolledCount, setEnrolledCount] = useState(0)
  const isAdmin = profile?.role === 'admin'

  // Step 1 state
  const [info, setInfo]            = useState({ title: '', categoryId: '', description: '', coverUrl: '', instructorId: '' })
  const [imgUploading, setImgUploading] = useState(false)
  const [imgErr, setImgErr]        = useState('')

  // Step 2 state
  const [eventDetails, setEventDetails] = useState({ startAt: '', endAt: '', modality: 'presencial', location: '', capacity: '' })

  // Step 3 state
  const [cert, setCert]            = useState({ hasCert: false, certName: '' })

  // Step 4 state
  const [pricing, setPricing]      = useState({ isFree: true, price: '', discount: '' })

  // Step 6
  const [pubStatus, setPubStatus]  = useState('draft')
  const [pubError, setPubError]    = useState('')

  const loadedRef = useRef(false)
  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => setCategories(data || []))
    if (profile?.role === 'admin') {
      supabase.from('users_view').select('id, full_name').in('role', ['instructor', 'admin']).order('full_name').then(({ data }) => setInstructors(data || []))
    }
    if (isEdit && !loadedRef.current) {
      loadedRef.current = true
      loadExisting(params.eventId)
    }
  }, [profile?.role])

  // ── load existing event ───────────────────────────────────────────────────
  async function loadExisting(eId) {
    setLoading(true)
    try {
      const [{ data: event, error: eventErr }, { count: enrollCount }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', eId).eq('type', 'event').single(),
        supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('course_id', eId),
      ])
      setEnrolledCount(enrollCount || 0)

      if (eventErr) {
        setError('No se pudo cargar el evento. Recarga la página antes de continuar — guardar ahora podría sobrescribirlo con datos en blanco.')
        setLoadFailed(true)
        return
      }

      if (event) {
        setInfo({ title: event.title || '', categoryId: event.category_id || '', description: event.description || '', coverUrl: event.cover_image_url || '', instructorId: event.instructor_id || '' })
        setEventDetails({
          startAt: event.event_start_at ? toDatetimeLocal(event.event_start_at) : '',
          endAt: event.event_end_at ? toDatetimeLocal(event.event_end_at) : '',
          modality: event.modality || 'presencial',
          location: event.location || '',
          capacity: event.capacity != null ? String(event.capacity) : '',
        })
        setPricing({ isFree: !event.price || event.price === 0, price: event.price ? String(event.price) : '', discount: '' })
        setPubStatus(event.status || 'draft')
        setCert({ hasCert: event.has_certificate || false, certName: event.certificate_name || '' })
      }

      setCompleted(new Set([1, 2, 3, 4, 5, 6]))
    } finally {
      setLoading(false)
    }
  }

  // ── image upload ──────────────────────────────────────────────────────────
  async function handleImgUpload(file) {
    if (!file) return
    const validationErr = validateImageFile(file)
    if (validationErr) { setImgErr(validationErr); return }
    setImgErr(''); setImgUploading(true)
    const prevUrl = info.coverUrl
    const name = `${Date.now()}-cover.jpg`
    let resized
    try {
      resized = await resizeImage(file, { maxDimension: 1280, quality: 0.82 })
    } catch {
      setImgErr('No se pudo procesar la imagen.'); setImgUploading(false); return
    }
    const { error: upErr } = await supabase.storage.from('course-images').upload(name, resized, { contentType: 'image/jpeg' })
    if (upErr) { setImgErr(upErr.message); setImgUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('course-images').getPublicUrl(name)
    setInfo(i => ({ ...i, coverUrl: publicUrl }))
    setImgUploading(false)
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
        if (!info.title.trim())                  return 'El título del evento es obligatorio.'
        if (isAdmin && !info.instructorId)        return 'Selecciona un instructor.'
        if (!info.categoryId)                     return 'Selecciona una categoría.'
        if (!stripHtml(info.description))         return 'La descripción es obligatoria.'
        if (stripHtml(info.description).length > 400) return 'La descripción no puede superar los 400 caracteres.'
        if (!info.coverUrl)                       return 'Sube una imagen de portada.'
        return null
      case 2:
        if (!eventDetails.startAt)                return 'La fecha y hora de inicio son obligatorias.'
        if (eventDetails.endAt && eventDetails.endAt < eventDetails.startAt) return 'La hora de fin no puede ser antes de la hora de inicio.'
        if (!eventDetails.modality)                return 'Selecciona una modalidad.'
        if (!eventDetails.location.trim())         return eventDetails.modality === 'virtual' ? 'Ingresa el enlace de acceso al evento.' : 'Ingresa la ubicación del evento.'
        if (eventDetails.capacity && !(parseInt(eventDetails.capacity) > 0)) return 'El cupo debe ser un número mayor a 0.'
        return null
      case 3:
        if (cert.hasCert && !cert.certName.trim()) return 'El nombre del certificado es obligatorio.'
        return null
      case 4:
        if (!pricing.isFree && !(parseFloat(pricing.price) > 0)) return 'Ingresa un precio mayor a 0.'
        return null
      default:
        return null
    }
  }

  // ── save step 1 ───────────────────────────────────────────────────────────
  async function saveStep1() {
    const baseSlug = slugify(info.title.trim())
    const payload = {
      title: info.title.trim(),
      description: info.description.trim(),
      instructor_id: (isAdmin && info.instructorId) ? info.instructorId : profile.id,
      category_id: info.categoryId || null,
      cover_image_url: info.coverUrl || null,
    }
    if (eventId) {
      await withUniqueSlug(baseSlug, async candidate => {
        const { error } = await supabase.from('courses').update({ ...payload, slug: candidate }).eq('id', eventId)
        if (error) throw error
      })
      return eventId
    } else {
      const newId = await withUniqueSlug(baseSlug, async candidate => {
        const { data, error } = await supabase.from('courses').insert({ ...payload, slug: candidate, type: 'event', status: 'draft', price: 0 }).select('id').single()
        if (error) throw error
        return data.id
      })
      setEventId(newId)
      return newId
    }
  }

  // ── save step 2 (event details) ───────────────────────────────────────────
  async function saveStep2(eId) {
    const { error } = await supabase.from('courses').update({
      event_start_at: eventDetails.startAt ? new Date(eventDetails.startAt).toISOString() : null,
      event_end_at: eventDetails.endAt ? new Date(eventDetails.endAt).toISOString() : null,
      modality: eventDetails.modality,
      location: eventDetails.location.trim() || null,
      capacity: eventDetails.capacity ? parseInt(eventDetails.capacity) : null,
    }).eq('id', eId)
    if (error) throw error
  }

  // ── save step 3 (certificate) ─────────────────────────────────────────────
  async function saveStep3(eId) {
    const { error } = await supabase.from('courses').update({
      has_certificate: cert.hasCert,
      certificate_name: cert.hasCert ? (cert.certName.trim() || null) : null,
      certificate_condition: 'complete',
    }).eq('id', eId)
    if (error) throw error
  }

  // ── save step 4 (price) ───────────────────────────────────────────────────
  async function saveStep4(eId) {
    const finalPrice = pricing.isFree ? 0 : (parseFloat(pricing.price) || 0)
    const { error } = await supabase.from('courses').update({ price: finalPrice }).eq('id', eId)
    if (error) throw error
  }

  async function persistStep(n, eId) {
    if (n === 1) await saveStep1()
    if (n === 2) await saveStep2(eId)
    if (n === 3) await saveStep3(eId)
    if (n === 4) await saveStep4(eId)
  }

  // ── next handler (create mode) ────────────────────────────────────────────
  async function handleNext() {
    if (loadFailed) { setError('No se pudo cargar el evento. Recarga la página para continuar.'); return }
    const validErr = validateStep(step)
    if (validErr) { setError(validErr); return }
    setError(''); setSaving(true)
    try {
      let eId = eventId
      if (step === 1) { eId = await saveStep1() }
      else { await persistStep(step, eId) }
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
    if (loadFailed) { setError('No se pudo cargar el evento. Recarga la página para continuar.'); return }
    const validErr = validateStep(step)
    if (validErr) { setError(validErr); return }
    setError(''); setSaving(true)
    try {
      await persistStep(step, eventId)
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
    if (!eventId) return
    setSaving(true); setPubError('')
    const { error } = await supabase.from('courses').update({ status: 'draft' }).eq('id', eventId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('eventos')
  }

  async function handleReview() {
    if (!eventId) return
    if (!eventDetails.startAt) {
      setPubError('Tu evento necesita fecha y hora de inicio antes de enviarlo a revisión o publicarlo.')
      return
    }
    setSaving(true); setPubError('')
    const dbStatus = pubStatus === 'review' ? 'pending' : pubStatus
    const { error } = await supabase.from('courses').update({ status: dbStatus }).eq('id', eventId)
    setSaving(false)
    if (error) { setPubError(error.message); return }
    navigate('eventos')
  }

  return {
    step, setStep, completed, isEdit, loading, saving, error, setError, eventId,
    info, setInfo, imgUploading, imgErr, handleImgUpload,
    categories, instructors, isAdmin, enrolledCount,
    eventDetails, setEventDetails,
    cert, setCert, pricing, setPricing,
    pubStatus, setPubStatus, pubError,
    navigate, totalSteps: TOTAL_STEPS,
    handleNext, handleBack, handleSaveStep, handleDraft, handleReview,
    validateStep,
  }
}
