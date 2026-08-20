import { IC } from '../components/shared'
import { StepHeader } from '../components/StepHeader'

export function Step8Publish({ status, setStatus, saving, error, onDraft, onReview, isAdmin, noun = 'curso' }) {
  const options = isAdmin
    ? [
        { value: 'draft',     label: 'Guardar como borrador',    sub: `El ${noun} queda privado. Puedes seguir editándolo.`,      icon: '📝' },
        { value: 'review',    label: 'Enviar a revisión',         sub: 'Queda pendiente de revisión antes de publicarse.',       icon: '📤' },
        { value: 'published', label: 'Publicar directamente',     sub: `El ${noun} queda visible para todos los estudiantes.`,     icon: '🚀' },
      ]
    : [
        { value: 'draft',    label: 'Guardar como borrador', sub: `El ${noun} queda privado. Puedes seguir editándolo.`,                       icon: '📝' },
        { value: 'review',   label: 'Enviar a revisión',      sub: `Un administrador revisará el ${noun} y decidirá si lo publica.`, icon: '📤' },
        { value: 'archived', label: `Archivar ${noun}`,         sub: 'Deja de verse en el catálogo. Conservas todo el contenido.',   icon: '📦' },
      ]

  const canSubmit = status === 'review' || status === 'archived' || (isAdmin && status === 'published')

  return (
    <div>
      <StepHeader n={8} title="Publicación" sub={`Tu ${noun} está listo. Elige cómo quieres lanzarlo.`} />
      <div style={{ maxWidth: 580 }}>
        {error && (
          <div style={{ background: '#fef2f0', border: '1px solid #f5c6bb', color: '#c0392b', borderRadius: 8, padding: '.75rem 1rem', fontSize: '.84rem', marginBottom: '1.25rem' }}>{error}</div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem', marginBottom: '2rem' }}>
          {options.map(opt => (
            <div key={opt.value} onClick={() => setStatus(opt.value)}
              style={{ padding: '1.1rem 1.25rem', border: `2px solid ${status === opt.value ? 'var(--jade)' : 'var(--border)'}`, borderRadius: 11, cursor: 'pointer', background: status === opt.value ? 'var(--jade-soft)' : 'white', transition: 'all .15s', display: 'flex', alignItems: 'flex-start', gap: '.9rem' }}>
              <span style={{ fontSize: '1.35rem', lineHeight: 1, flexShrink: 0 }}>{opt.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--carbon)', margin: '0 0 .2rem' }}>{opt.label}</p>
                <p style={{ fontSize: '.8rem', color: 'var(--text-2)', margin: 0 }}>{opt.sub}</p>
              </div>
              {status === opt.value && (
                <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--jade)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: 'white' }}>{IC.check}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onDraft} disabled={saving}
            style={{ padding: '.7rem 1.4rem', border: '1px solid var(--border)', borderRadius: 8, fontSize: '.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', background: 'white', color: 'var(--carbon)', opacity: saving ? .55 : 1 }}>
            Guardar borrador
          </button>
          <button type="button" onClick={onReview} disabled={saving || !canSubmit}
            style={{ padding: '.7rem 1.6rem', border: 'none', borderRadius: 8, fontSize: '.875rem', fontWeight: 700, cursor: (saving || !canSubmit) ? 'not-allowed' : 'pointer', fontFamily: 'var(--sans)', background: 'var(--jade)', color: 'white', opacity: (saving || !canSubmit) ? .55 : 1, display: 'flex', alignItems: 'center', gap: '.45rem' }}>
            {saving ? (
              <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'wiz-spin .7s linear infinite' }} /> Enviando…</>
            ) : status === 'published' ? (
              <>{IC.send} Publicar {noun}</>
            ) : status === 'archived' ? (
              <>{IC.send} Archivar {noun}</>
            ) : (
              <>{IC.send} Enviar a revisión</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
