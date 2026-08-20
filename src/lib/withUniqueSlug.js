// Retries with a random suffix on a slug collision (courses.slug is unique in
// the DB) instead of surfacing a raw constraint-violation error to the user.
export async function withUniqueSlug(baseSlug, attemptFn) {
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
  throw new Error('No se pudo generar una URL única. Cambia el título e intenta de nuevo.')
}
