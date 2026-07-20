import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

function Star({ filled, size = 16, onClick, onMouseEnter }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? '#D97706' : 'none'} stroke={filled ? '#D97706' : 'var(--border)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      onClick={onClick} onMouseEnter={onMouseEnter} style={{ cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}

function StarRow({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => <Star key={n} filled={n <= Math.round(rating)} size={size} />)}
    </div>
  )
}

function RatingInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={24} filled={n <= (hover || value)}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)} />
      ))}
    </div>
  )
}

// Public course reviews: readable by anyone (following the same visibility
// rule as the courses table), writable only by students enrolled in the
// course (enforced server-side by RLS — `canReview` here is just UI gating).
export function CourseReviews({ courseId, currentUserId, canReview }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (courseId) load() }, [courseId])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('course_reviews')
      .select('id, rating, comment, created_at, student_id, profiles!student_id(full_name, avatar_url)')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
    const mine = (data || []).find(r => r.student_id === currentUserId)
    if (mine) { setRating(mine.rating); setComment(mine.comment || '') }
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!rating) { setError('Selecciona una calificación.'); return }
    setSaving(true)
    setError('')
    const { error: err } = await supabase.from('course_reviews')
      .upsert({ course_id: courseId, student_id: currentUserId, rating, comment: comment.trim() || null }, { onConflict: 'course_id,student_id' })
    setSaving(false)
    if (err) { setError('No se pudo guardar tu reseña. Intenta de nuevo.'); return }
    load()
  }

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0
  const myReview = reviews.find(r => r.student_id === currentUserId)
  const others = reviews.filter(r => r.student_id !== currentUserId)

  if (loading) return null

  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem 1.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>Reseñas de estudiantes</h2>
        {reviews.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
            <StarRow rating={avg} />
            <span style={{ fontSize: '.82rem', color: 'var(--text-2)' }}>{avg.toFixed(1)} · {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {canReview && (
        <form onSubmit={handleSubmit} style={{ background: 'var(--cream)', borderRadius: 10, padding: '1.1rem 1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--carbon)', marginBottom: '.6rem' }}>
            {myReview ? 'Actualiza tu reseña' : 'Deja tu reseña'}
          </p>
          <RatingInput value={rating} onChange={setRating} />
          <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="¿Qué te pareció el curso? (opcional)" maxLength={500}
            style={{ width: '100%', minHeight: 70, marginTop: '.75rem', padding: '.65rem .85rem', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.85rem', fontFamily: 'var(--sans)', color: 'var(--carbon)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          {error && <p style={{ fontSize: '.78rem', color: '#B91C1C', margin: '.5rem 0 0' }}>{error}</p>}
          <button type="submit" disabled={saving}
            style={{ marginTop: '.75rem', padding: '.6rem 1.25rem', background: 'var(--jade)', color: 'white', border: 'none', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', opacity: saving ? .7 : 1 }}>
            {saving ? 'Guardando…' : myReview ? 'Actualizar reseña' : 'Publicar reseña'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p style={{ fontSize: '.85rem', color: 'var(--text-2)', margin: 0 }}>Aún no hay reseñas para este curso.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {myReview && canReview && (
            <ReviewRow review={myReview} mine />
          )}
          {others.map(r => <ReviewRow key={r.id} review={r} />)}
        </div>
      )}
    </div>
  )
}

function ReviewRow({ review, mine }) {
  const name = review.profiles?.full_name || 'Estudiante'
  const date = new Date(review.created_at).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div style={{ display: 'flex', gap: '.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
      {review.profiles?.avatar_url
        ? <img loading="lazy" src={review.profiles.avatar_url} alt={name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.2rem' }}>
          <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--carbon)' }}>{name}{mine ? ' (tú)' : ''}</span>
          <StarRow rating={review.rating} size={12} />
          <span style={{ fontSize: '.72rem', color: '#B5B2AB' }}>{date}</span>
        </div>
        {review.comment && <p style={{ fontSize: '.84rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{review.comment}</p>}
      </div>
    </div>
  )
}

// Lightweight summary for course cards (catalog/listing) — one round trip
// fetch of just the aggregate, no review bodies.
export function useCourseRatingSummaries(courseIds) {
  const [summaries, setSummaries] = useState({})
  useEffect(() => {
    if (!courseIds || courseIds.length === 0) { setSummaries({}); return }
    supabase.from('course_reviews').select('course_id, rating').in('course_id', courseIds)
      .then(({ data }) => {
        const byCourse = {}
        for (const r of data || []) {
          if (!byCourse[r.course_id]) byCourse[r.course_id] = { sum: 0, count: 0 }
          byCourse[r.course_id].sum += r.rating
          byCourse[r.course_id].count += 1
        }
        const result = {}
        for (const [id, { sum, count }] of Object.entries(byCourse)) result[id] = { avg: sum / count, count }
        setSummaries(result)
      })
  }, [JSON.stringify(courseIds)])
  return summaries
}

export function RatingBadge({ avg, count, size = 12 }) {
  if (!count) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
      <Star filled size={size} />
      <span style={{ fontSize: '.74rem', fontWeight: 600, color: 'var(--carbon)' }}>{avg.toFixed(1)}</span>
      <span style={{ fontSize: '.7rem', color: 'var(--text-2)' }}>({count})</span>
    </div>
  )
}
