import { StepHeader } from '../components/StepHeader'
import { Field, PillSelector, Toggle, INP, fi, fb } from '../components/shared'
import { CertificatePreview } from '../../../../../components/certificates/CertificatePreview'

export function Step5Certificate({ cert, setCert, instructorName }) {
  const set = (k, v) => setCert(c => ({ ...c, [k]: v }))
  return (
    <div>
      <StepHeader n={5} title="Certificación" sub="Define si los estudiantes reciben un certificado al completar el curso." />
      <div style={{ maxWidth: 600 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <Toggle checked={cert.hasCert} onChange={e => set('hasCert', e.target.checked)} label="Este curso genera certificado" />
        </div>
        {cert.hasCert && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <Field label="Nombre en el certificado" hint="El nombre que aparecerá en el certificado junto al del estudiante" req id="wiz-cert-name">
              <input style={INP} value={cert.certName} placeholder="ej. Diseño UX desde cero"
                onChange={e => set('certName', e.target.value)} onFocus={fi} onBlur={fb} />
            </Field>
            <Field label="Condición para obtenerlo">
              <PillSelector
                options={[{ value: 'complete', label: 'Completar 100%' }, { value: 'pass', label: 'Aprobar evaluación' }]}
                value={cert.certCondition} onChange={v => set('certCondition', v)} />
            </Field>
            <div>
              <p style={{ fontSize: '.82rem', color: 'var(--carbon)', fontWeight: 600, margin: '0 0 .6rem' }}>Vista previa del certificado</p>
              <CertificatePreview certName={cert.certName} instructorName={instructorName} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
