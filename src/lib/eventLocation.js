// Combines an event's structured location fields (specific address, city,
// country) into one readable string. A virtual event only has `location`
// (the meeting link) — city/country are null in that case.
export function formatEventLocation(event) {
  return [event.location, event.city, event.country].filter(Boolean).join(', ')
}
