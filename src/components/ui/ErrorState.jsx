/**
 * Pantalla de fallo de carga.
 *
 * Deliberadamente distinta del estado vacío: éste va en rojo, con borde y fondo
 * cálidos y un icono de aviso, mientras que el vacío usa el jade de la marca y
 * un icono del dominio. Antes un fallo se dibujaba igual que «no hay nada
 * todavía», así que nadie sabía si el curso estaba vacío o si la consulta se
 * había roto — que es justo lo que dejó dos pantallas muertas durante meses.
 *
 * El código de error va en pequeño al pie: al usuario no le dice nada, pero es
 * lo primero que se pide en un reporte de soporte y evita el «no me carga» sin
 * más datos.
 */
export function ErrorState({
  title = 'No pudimos cargar esta información',
  description = 'Algo falló al pedir los datos. No es culpa tuya y no se perdió nada — vuelve a intentarlo en un momento.',
  error,
  onRetry,
  compact = false,
}) {
  const code = error?.code
  return (
    <div role="alert" style={{
      background: '#FEF6F5',
      border: '1px solid #F5C6BB',
      borderRadius: 14,
      padding: compact ? '1.5rem 1.25rem' : '3rem 2rem',
      textAlign: 'center',
    }}>
      <div style={{ width: compact ? 40 : 52, height: compact ? 40 : 52, background: '#FBE3DE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: `0 auto ${compact ? '.8rem' : '1.1rem'}` }}>
        <svg width={compact ? 18 : 24} height={compact ? 18 : 24} viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <p style={{ fontFamily: 'var(--serif)', fontSize: compact ? '.92rem' : '1rem', fontWeight: 700, color: '#8C2F22', margin: '0 0 .35rem' }}>
        {title}
      </p>
      <p style={{ fontSize: compact ? '.79rem' : '.82rem', color: '#A65A4C', margin: 0, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
        {description}
      </p>

      {onRetry && (
        <button onClick={onRetry}
          style={{ marginTop: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '.4rem', padding: '.55rem 1.2rem', background: 'white', color: '#8C2F22', border: '1px solid #F5C6BB', borderRadius: 8, fontSize: '.84rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      )}

      {code && (
        <p style={{ fontSize: '.68rem', color: '#C09186', margin: '.9rem 0 0', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          Código {code}
        </p>
      )}
    </div>
  )
}
