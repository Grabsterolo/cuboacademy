import { formatEventLocation } from './eventLocation'

function toGCalStamp(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

// Google Calendar "add event" deep link — no auth/API call, just a prefilled URL.
export function googleCalendarUrl(event) {
  const start = toGCalStamp(event.event_start_at)
  const end = event.event_end_at ? toGCalStamp(event.event_end_at) : toGCalStamp(new Date(new Date(event.event_start_at).getTime() + 60 * 60 * 1000).toISOString())
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.description ? event.description.replace(/<[^>]+>/g, ' ').trim().slice(0, 400) : '',
    location: formatEventLocation(event),
  })
  return `https://www.google.com/calendar/render?${params.toString()}`
}
