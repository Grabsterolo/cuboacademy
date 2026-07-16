import { StepHeader } from '../components/StepHeader'
import { Field, Toggle, INP, fi, fb } from '../components/shared'

export function Step6Pricing({ pricing, setPricing }) {
  const set = (k, v) => setPricing(p => ({ ...p, [k]: v }))
  return (
    <div>
      <StepHeader n={6} title="Precio" sub="Define si tu curso es gratuito o de pago y cómo se monetizará." />
      <div style={{ maxWidth: 520 }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.25rem' }}>
          <Toggle checked={pricing.isFree} onChange={e => set('isFree', e.target.checked)} label="Curso gratuito" />
        </div>
        {!pricing.isFree && (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field label="Precio (USD)" req>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-2)', fontSize: '.95rem', pointerEvents: 'none' }}>$</span>
                <input type="number" min="0" step="0.01" value={pricing.price}
                  onChange={e => set('price', e.target.value)} onFocus={fi} onBlur={fb}
                  style={{ ...INP, paddingLeft: '1.8rem' }} placeholder="0.00" />
              </div>
            </Field>
            <Field label="Descuento (opcional)" hint="Deja vacío si no aplica descuento">
              <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input type="number" min="0" max="100" value={pricing.discount}
                    onChange={e => set('discount', e.target.value)} onFocus={fi} onBlur={fb}
                    style={{ ...INP }} placeholder="0" />
                </div>
                <span style={{ fontSize: '.9rem', color: 'var(--text-2)', flexShrink: 0 }}>% de descuento</span>
              </div>
            </Field>
            {pricing.price && pricing.discount ? (
              <div style={{ padding: '.85rem 1.1rem', background: 'var(--jade-soft)', borderRadius: 9, border: '1px solid rgba(22,125,120,.2)' }}>
                <p style={{ fontSize: '.82rem', color: 'var(--jade)', margin: 0 }}>
                  Precio final: <strong>${(parseFloat(pricing.price) * (1 - parseFloat(pricing.discount) / 100)).toFixed(2)}</strong>
                  {' '}<span style={{ textDecoration: 'line-through', opacity: .7 }}>${parseFloat(pricing.price).toFixed(2)}</span>
                </p>
              </div>
            ) : null}
            <Field label="Método de cobro" hint="Un administrador confirma manualmente cada pago recibido antes de dar acceso al curso.">
              <div style={{ padding: '.85rem 1.1rem', background: 'var(--cream)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.7rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                <span style={{ fontSize: '.85rem', color: 'var(--carbon)' }}>Confirmación manual de pago</span>
              </div>
            </Field>
          </div>
        )}
      </div>
    </div>
  )
}
