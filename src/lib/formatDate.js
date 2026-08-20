const LOCALE = 'es-CR'

// "05 jul 2026" — the app's default short date, used almost everywhere a
// created/updated timestamp is shown in a list or card.
export function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: 'short', year: 'numeric' })
}

// "5 de julio de 2026" — spelled-out month, used where a date is the main
// piece of content rather than metadata (e.g. a certificate issue date).
export function formatDateLong(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
}

// "martes, 21 de julio de 2026" — full date with weekday, for a single
// prominent timestamp (e.g. an opened announcement).
export function formatDateFull(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

// "21 jul" — no year, for tight spaces like a sidebar notification row.
export function formatDateCompact(iso) {
  return new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })
}

// "5 jul, 10:00 a. m." — date + time, for event schedules.
export function formatEventDateTime(iso) {
  return new Date(iso).toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}
