export function StepHeader({ n, title, sub }) {
  return (
    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.15rem,2vw,1.45rem)', fontWeight: 700, color: 'var(--carbon)', lineHeight: 1.2, margin: '0 0 .3rem' }}>{title}</h2>
      {sub && <p style={{ fontSize: '.84rem', color: 'var(--text-2)', margin: 0 }}>{sub}</p>}
    </div>
  )
}
