import { StepHeader } from '../components/StepHeader'
import { Field, PillSelector, Toggle, INP, fi, fb } from '../components/shared'
import { CertificatePreview } from '../../../../../components/certificates/CertificatePreview'

export function Step5Certificate({ cert, setCert, instructorName, hasFinalExam }) {
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
            {/* Con examen final no hay elección que ofrecer: el servidor se
                niega a completar la matrícula por lecciones cuando el curso
                tiene «Evaluación Final», así que «Completar 100 %» sería una
                promesa que no se cumple. Se enseña la condición real en vez de
                un selector cuya mitad no tiene efecto. */}
            {hasFinalExam ? (
              <Field label="Condición para obtenerlo"
                hint="Este curso tiene evaluación final, así que el certificado se emite al aprobarla. Quita la evaluación en el paso 4 si prefieres darlo por completar el 100 %.">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.6rem .85rem', background: 'var(--jade-soft)', border: '1px solid rgba(22,125,120,.25)', borderRadius: 8, fontSize: '.84rem', fontWeight: 600, color: 'var(--jade-ink, #0B3436)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
                  Aprobar evaluación
                </div>
              </Field>
            ) : (
              <Field label="Condición para obtenerlo">
                <PillSelector
                  options={[{ value: 'complete', label: 'Completar 100%' }, { value: 'pass', label: 'Aprobar evaluación' }]}
                  value={cert.certCondition} onChange={v => set('certCondition', v)} />
              </Field>
            )}
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
