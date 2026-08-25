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
