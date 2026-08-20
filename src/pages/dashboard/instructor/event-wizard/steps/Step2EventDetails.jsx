import { StepHeader } from '../../course-wizard/components/StepHeader'
import { Field, PillSelector, INP, fi, fb } from '../../course-wizard/components/shared'

const MODALITY_OPTS = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hibrido', label: 'Híbrido' },
]

export function Step2EventDetails({ eventDetails, setEventDetails }) {
  const set = (k, v) => setEventDetails(d => ({ ...d, [k]: v }))
  const locationLabel = eventDetails.modality === 'virtual' ? 'Enlace de acceso' : 'Ubicación'
  const locationPlaceholder = eventDetails.modality === 'virtual' ? 'ej. https://meet.google.com/...' : 'ej. Cubo Campus HQ, San José'

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
