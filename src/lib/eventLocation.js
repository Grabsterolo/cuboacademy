// Combines an event's structured location fields (specific address, city,
// country) into one readable string. A virtual event only has `location`
// (the meeting link) — city/country are null in that case.
//
// Skips a segment the address already contains: some rows keep the whole venue
// as free text in `location` ("Torre 2020, San José, Costa Rica") while also
// carrying city and country, and naively joining all three produced
// "…, San José, Costa Rica, San José, Costa Rica".
export function formatEventLocation(event) {
  const address = (event.location || '').trim()
  const lower = address.toLowerCase()
  const parts = [address]
  for (const extra of [event.city, event.country]) {
    const value = (extra || '').trim()
    if (value && !lower.includes(value.toLowerCase())) parts.push(value)
  }
  return parts.filter(Boolean).join(', ')
}

/**
 * Versión compacta para tarjetas: ciudad y país cuando existen, o si no, el
 * nombre corto de la sede tal como está en `location` — nunca la dirección
 * completa que arma `formatEventLocation`, pensada para la ficha, no para una
 * tarjeta de catálogo.
 *
 * Un evento virtual no tiene sede que anunciar: se etiqueta «En línea» y
 * `location` no se muestra nunca en ese caso, porque ahí guarda el enlace de
 * acceso a la sesión, no un lugar.
 */
export function formatEventLocationShort(event) {
  if (event.modality === 'virtual') return 'En línea'
  const city = (event.city || '').trim()
  const country = (event.country || '').trim()
  if (city && country) return `${city}, ${country}`
  if (city) return city
  if (country) return country
  return (event.location || '').trim() || null
}
