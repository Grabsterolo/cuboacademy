import { StepHeader } from '../components/StepHeader'
import { Field, PillSelector, Toggle, INP, fi, fb } from '../components/shared'

export function Step5Certificate({ cert, setCert }) {
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
            <Field label="Nombre en el certificado" hint="El nombre que aparecerá en el certificado junto al del estudiante" req>
              <input style={INP} value={cert.certName} placeholder="ej. Diseño UX desde cero"
                onChange={e => set('certName', e.target.value)} onFocus={fi} onBlur={fb} />
            </Field>
            <Field label="Condición para obtenerlo">
              <PillSelector
                options={[{ value: 'complete', label: 'Completar 100%' }, { value: 'pass', label: 'Aprobar evaluación' }]}
                value={cert.certCondition} onChange={v => set('certCondition', v)} />
            </Field>
            <div style={{ padding: '1rem 1.1rem', background: 'var(--jade-soft)', borderRadius: 9, border: '1px solid rgba(22,125,120,.2)' }}>
              <p style={{ fontSize: '.82rem', color: 'var(--jade)', fontWeight: 600, margin: '0 0 .2rem' }}>Vista previa del certificado</p>
              <p style={{ fontSize: '.78rem', color: 'var(--jade)', margin: 0, opacity: .8 }}>
                "[Nombre del estudiante] completó exitosamente {cert.certName || 'el curso'}" — Cubo Academy
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
