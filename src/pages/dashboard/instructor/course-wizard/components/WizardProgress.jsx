import { IC, STEP_DEFS } from './shared'

export function WizardProgress({ step, completed, isEdit, onStepClick, steps = STEP_DEFS }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '1.1rem 1.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
      <div className="wiz-steps" style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
        {steps.map((s, i) => {
          const done      = completed.has(s.n)
          const current   = step === s.n
          const clickable = isEdit || done
          return (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 52 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && (
                  <div style={{ flex: 1, height: 2, background: done ? 'var(--jade)' : 'var(--border)', transition: 'background .3s' }} />
                )}
                <div onClick={() => clickable && onStepClick(s.n)}
                  style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, transition: 'all .2s', cursor: clickable ? 'pointer' : 'default', background: done ? 'var(--jade)' : current ? 'white' : 'var(--cream)', border: done ? '2px solid var(--jade)' : current ? '2.5px solid var(--jade)' : '2px solid var(--border)', color: done ? 'white' : current ? 'var(--jade)' : 'var(--text-2)', fontSize: '.72rem', fontWeight: 700 }}>
                  {done ? IC.check : s.n}
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: done && !current ? 'var(--jade)' : 'var(--border)', transition: 'background .3s' }} />
                )}
              </div>
              <span className="wiz-step-label" style={{ fontSize: '.63rem', fontWeight: current ? 700 : 500, color: current ? 'var(--jade)' : done ? 'var(--carbon)' : 'var(--text-2)', marginTop: '.45rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
