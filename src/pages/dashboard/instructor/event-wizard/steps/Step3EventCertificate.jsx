import { StepHeader } from '../../course-wizard/components/StepHeader'
import { Field, Toggle, INP, fi, fb } from '../../course-wizard/components/shared'

export function Step3EventCertificate({ cert, setCert }) {
  const set = (k, v) => setCert(c => ({ ...c, [k]: v }))
  return (
    <div>
      <StepHeader n={3} title="Certificación" sub="Define si los asistentes reciben un certificado de participación." />
      <div style={{ maxWidth: 600 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <Toggle checked={cert.hasCert} onChange={e => set('hasCert', e.target.checked)} label="Este evento genera certificado" />
        </div>
        {cert.hasCert && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Nombre en el certificado" hint="El nombre que aparecerá en el certificado junto al del estudiante" req id="wiz-cert-name">
              <input style={INP} value={cert.certName} placeholder="ej. Taller de Liderazgo Consciente"
                onChange={e => set('certName', e.target.value)} onFocus={fi} onBlur={fb} />
            </Field>
            <p style={{ fontSize: '.78rem', color: 'var(--text-2)', margin: 0 }}>
              El certificado se emite cuando marcas la asistencia del estudiante después del evento.
            </p>
            <div style={{ padding: '1rem 1.1rem', background: 'var(--jade-soft)', borderRadius: 9, border: '1px solid rgba(22,125,120,.2)' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--jade)', fontWeight: 600, margin: '0 0 .2rem' }}>Vista previa del certificado</p>
              <p style={{ fontSize: '.78rem', color: 'var(--jade)', margin: 0, opacity: .8 }}>
                "[Nombre del estudiante] participó en {cert.certName || 'el evento'}" — Cubo Campus
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
