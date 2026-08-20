import { useEffect, useRef, useState } from 'react'
import { StepHeader } from '../../course-wizard/components/StepHeader'
import { Field, PillSelector, INP, SEL, fi, fb } from '../../course-wizard/components/shared'
import { COUNTRIES } from '../../../../../lib/countries'
import { CITIES_BY_COUNTRY } from '../../../../../lib/citiesByCountry'

const MODALITY_OPTS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrido', label: 'Híbrido' },
]

// Text input with a filtered suggestion list — the real per-country city
// datasets run into the thousands (e.g. México, España), too many for a
// plain <select>, so this filters as you type instead. Free text is still
// accepted for the rare town missing from the list.
function CityCombobox({ country, value, onChange, id }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const cities = country ? (CITIES_BY_COUNTRY[country] || []) : []

  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const q = (value || '').trim().toLowerCase()
  const matches = (q ? cities.filter(c => c.toLowerCase().includes(q)) : cities).slice(0, 8)

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input id={id} style={INP} value={value} disabled={!country}
        placeholder={country ? 'Escribe para buscar…' : 'Selecciona un país primero'}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { fi(e); setOpen(true) }} onBlur={fb} />
      {open && country && matches.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 20, background: 'white', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(23,26,28,.12)', maxHeight: 220, overflowY: 'auto' }}>
          {matches.map(c => (
            <div key={c} onMouseDown={() => { onChange(c); setOpen(false) }}
              style={{ padding: '.55rem .85rem', fontSize: '.85rem', color: 'var(--carbon)', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--cream)'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}>
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Step2EventDetails({ eventDetails, setEventDetails }) {
  const set = (k, v) => setEventDetails(d => ({ ...d, [k]: v }))
  const isVirtual = eventDetails.modality === 'virtual'
  const locationLabel = isVirtual ? 'Enlace de acceso' : 'Dirección específica'
  const locationPlaceholder = isVirtual ? 'ej. https://meet.google.com/...' : 'ej. Cubo Campus HQ, Edificio 3'

  function setCountry(country) {
    setEventDetails(d => ({ ...d, country, city: '' }))
  }

  return (
    <div>
      <StepHeader n={2} title="Detalles del evento" sub="Fecha, hora y modalidad en la que ocurrirá el evento." />
      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="wiz-grid">
          <Field label="Inicio" req id="wiz-event-start">
            <input id="wiz-event-start" type="datetime-local" style={INP} value={eventDetails.startAt}
              onChange={e => set('startAt', e.target.value)} onFocus={fi} onBlur={fb} />
          </Field>
          <Field label="Fin (opcional)" id="wiz-event-end">
            <input id="wiz-event-end" type="datetime-local" style={INP} value={eventDetails.endAt}
              onChange={e => set('endAt', e.target.value)} onFocus={fi} onBlur={fb} />
          </Field>
        </div>

        <Field label="Modalidad" req>
          <PillSelector options={MODALITY_OPTS} value={eventDetails.modality} onChange={v => set('modality', v)} />
        </Field>

        {!isVirtual && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }} className="wiz-grid">
            <Field label="País" req id="wiz-event-country">
              <select id="wiz-event-country" style={SEL} value={eventDetails.country} onChange={e => setCountry(e.target.value)} onFocus={fi} onBlur={fb}>
                <option value="">— Selecciona un país —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Ciudad" req id="wiz-event-city">
              <CityCombobox id="wiz-event-city" country={eventDetails.country} value={eventDetails.city} onChange={v => set('city', v)} />
            </Field>
          </div>
        )}

        <Field label={locationLabel} req id="wiz-event-location">
          <input id="wiz-event-location" style={INP} value={eventDetails.location} placeholder={locationPlaceholder}
            onChange={e => set('location', e.target.value)} onFocus={fi} onBlur={fb} />
        </Field>

        <Field label="Cupo (opcional)" hint="Deja vacío si no hay límite de personas" id="wiz-event-capacity">
          <input id="wiz-event-capacity" type="number" min="1" style={INP} value={eventDetails.capacity} placeholder="ej. 30"
            onChange={e => set('capacity', e.target.value)} onFocus={fi} onBlur={fb} />
        </Field>
      </div>
    </div>
  )
}
