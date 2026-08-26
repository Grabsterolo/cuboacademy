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

/**
 * Zona horaria de un evento y de quien lo está mirando.
 *
 * Todos los eventos de esta plataforma ocurren en Costa Rica, así que se fija
 * esa zona por defecto en vez de dejar que cada navegador la deduzca de su
 * propio reloj — eso es justo lo que producía el fallo: "26 ago, 2:00 p. m."
 * significaba una hora distinta según dónde estuviera quien lo leía, sin que
 * la pantalla dijera de cuál hora hablaba.
 *
 * `event?.timezone` es un enganche para el día en que un evento necesite
 * declarar otra zona explícitamente; hoy ninguna fila de `courses` tiene esa
 * columna, así que en la práctica siempre cae al valor por defecto.
 */
export const EVENT_DEFAULT_TIMEZONE = 'America/Costa_Rica'

export function eventTimeZone(event) {
  return event?.timezone || EVENT_DEFAULT_TIMEZONE
}

export function visitorTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || EVENT_DEFAULT_TIMEZONE
  } catch {
    return EVENT_DEFAULT_TIMEZONE
  }
}

function dateFmt(timeZone) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, day: 'numeric', month: 'short', year: 'numeric' })
}

function timeFmt(timeZone) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone, hour: 'numeric', minute: '2-digit' })
}

/**
 * Desplazamiento explícito, tipo "GMT-6", en vez de una sigla como "CST".
 *
 * Una sigla es una trampa aquí: "CST" nombra tanto la hora central de EE. UU.
 * como, en algunos calendarios, otras zonas, así que a la persona que más
 * necesita esta etiqueta —quien está en un país distinto al del evento— es a
 * quien más la confundiría. El desplazamiento numérico no necesita glosario.
 */
function offsetLabel(date, timeZone) {
  const part = new Intl.DateTimeFormat(LOCALE, { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find(p => p.type === 'timeZoneName')
  return part?.value || ''
}

/** ¿Caen dos instantes en el mismo día de calendario dentro de esa zona? */
function sameCalendarDay(a, b, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(a) === fmt.format(b)
}

/**
 * ¿Marcan lo mismo dos zonas para este instante exacto?
 *
 * Compara la hora resultante, no el nombre de la zona: America/Mexico_City y
 * America/Costa_Rica son identificadores distintos pero hoy comparten
 * desplazamiento (ninguno de los dos observa horario de verano), así que
 * mostrarle a alguien en Ciudad de México «tu hora equivalente» cuando el
 * reloj marca lo mismo sería ruido, no información.
 */
function sameInstant(date, tzA, tzB) {
  const opts = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  const a = new Intl.DateTimeFormat('en-CA', { ...opts, timeZone: tzA }).format(date)
  const b = new Intl.DateTimeFormat('en-CA', { ...opts, timeZone: tzB }).format(date)
  return a === b
}

/**
 * Puente entre <input type="datetime-local"> y la zona de un evento.
 *
 * El navegador interpreta ese input siempre en SU propia hora local — no hay
 * forma de decirle "esto es hora de Costa Rica" desde el HTML. Por eso el
 * asistente de eventos guardaba una hora distinta según en qué país estuviera
 * el instructor al llenar el formulario: escribir "9:00 a. m." en Madrid y en
 * San José producía instantes UTC distintos, aunque el evento ocurre siempre
 * en el mismo sitio. Estas dos funciones hacen la conversión a mano, tratando
 * el valor del input como hora de pared en `timeZone` (Costa Rica por
 * defecto) en vez de como hora de pared del navegador.
 */

function partsInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const get = t => Number(parts.find(p => p.type === t)?.value)
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute') }
}

/** UTC ISO -> "YYYY-MM-DDTHH:mm" tal como se ve el reloj en `timeZone`. */
export function isoToZonedInputValue(iso, timeZone = EVENT_DEFAULT_TIMEZONE) {
  if (!iso) return ''
  const { y, mo, d, h, mi } = partsInZone(new Date(iso), timeZone)
  const pad = n => String(n).padStart(2, '0')
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}`
}

/**
 * "YYYY-MM-DDTHH:mm" leído como hora de pared en `timeZone` -> UTC ISO.
 *
 * No hay fórmula cerrada para esto (el desplazamiento de una zona puede
 * cambiar por horario de verano), así que se resuelve por aproximación: se
 * asume el valor como si fuera UTC, se mira qué hora de pared produciría eso
 * en `timeZone`, y se corrige la diferencia. Costa Rica no tiene horario de
 * verano y converge en la primera vuelta; el bucle queda por si `timeZone`
 * algún día es otra que sí lo tenga.
 */
export function zonedInputValueToIso(value, timeZone = EVENT_DEFAULT_TIMEZONE) {
  if (!value) return null
  const [datePart, timePart] = value.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart || '00:00').split(':').map(Number)
  const wantUTC = Date.UTC(y, mo - 1, d, h, mi)

  let guess = wantUTC
  for (let i = 0; i < 2; i++) {
    const seen = partsInZone(new Date(guess), timeZone)
    const seenUTC = Date.UTC(seen.y, seen.mo - 1, seen.d, seen.h, seen.mi)
    const diff = wantUTC - seenUTC
    if (diff === 0) break
    guess += diff
  }
  return new Date(guess).toISOString()
}

/**
 * "27 ago 2026, 9:00 a. m. – 5:00 p. m. GMT-6" — fecha y hora completas de un
 * evento, en la zona del evento (no en la del navegador que lo renderiza).
 *
 * Incluye la hora de fin cuando se conoce, y repite la fecha si el evento
 * cruza la medianoche en esa zona. Devuelve null sin fecha de inicio: eso es
 * un evento mal cargado, no una fecha en blanco que valga la pena mostrar.
 */
export function formatEventDateTime(startIso, endIso, event) {
  if (!startIso) return null
  const tz = eventTimeZone(event)
  const start = new Date(startIso)
  const end = endIso ? new Date(endIso) : null

  const startDate = dateFmt(tz).format(start)
  const startTime = timeFmt(tz).format(start)
  const offset = offsetLabel(start, tz)

  if (!end) return `${startDate}, ${startTime} ${offset}`

  const endTime = timeFmt(tz).format(end)
  if (sameCalendarDay(start, end, tz)) {
    return `${startDate}, ${startTime} – ${endTime} ${offset}`
  }
  const endDate = dateFmt(tz).format(end)
  return `${startDate}, ${startTime} – ${endDate}, ${endTime} ${offset}`
}

/**
 * Igual que `formatEventDateTime`, pero además calcula la hora equivalente en
 * la zona de quien está mirando la pantalla — la pieza que falta cuando un
 * usuario en México y otro en Costa Rica ven el mismo evento.
 *
 * `secondary` viene en null cuando no hay nada que añadir: el navegador no
 * expone su zona, o esa zona marca la misma hora que la del evento en este
 * instante. Mostrar «hora equivalente» idéntica a la ya mostrada sería
 * redundante, no una aclaración.
 */
export function formatEventSchedule(startIso, endIso, event) {
  const primary = formatEventDateTime(startIso, endIso, event)
  if (!primary) return { primary: null, secondary: null, timeZone: eventTimeZone(event) }

  const tz = eventTimeZone(event)
  const visitorTz = visitorTimeZone()
  const start = new Date(startIso)

  let secondary = null
  if (visitorTz && visitorTz !== tz && !sameInstant(start, tz, visitorTz)) {
    const vDate = dateFmt(visitorTz).format(start)
    const vDateEvt = dateFmt(tz).format(start)
    const vTime = timeFmt(visitorTz).format(start)
    const vOffset = offsetLabel(start, visitorTz)
    // Solo se antepone la fecha si difiere de la que ya se ve en la línea
    // principal — por ejemplo, un evento que cruza medianoche para quien está
    // varias horas por detrás.
    secondary = `${vDate !== vDateEvt ? `${vDate}, ` : ''}${vTime} ${vOffset} en tu zona horaria`
  }

  return { primary, secondary, timeZone: tz }
}

