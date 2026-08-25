/**
 * Marca de visibilidad para los listados de gestión.
 *
 * Solo aparece cuando el curso o evento NO es público. La gracia es detectar de
 * un vistazo lo que está fuera del catálogo abierto; poner una etiqueta también
 * en los públicos —que son la mayoría— la convertiría en ruido y volvería a
 * esconder justo lo que hay que ver.
 *
 * Un evento cerrado de cliente estuvo publicado en el catálogo abierto sin que
 * nada en el panel lo delatara: la lista mostraba «Publicado» igual que en los
 * demás.
 */

const STYLES = {
  unlisted: {
    label: 'No listado',
    title: 'Publicado, pero fuera del catálogo: solo se llega con el enlace directo.',
    color: '#7A5AB8',
    bg: '#F1ECFB',
    border: '#DDD1F5',
    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  },
  private: {
    label: 'Privado',
    title: 'Cerrado: solo lo ven un administrador, el instructor asignado y las personas matriculadas.',
    color: '#9C480C',
    bg: '#FDECD8',
    border: '#F5D3A8',
    icon: <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  },
}

export function VisibilityBadge({ visibility }) {
  const s = STYLES[visibility]
  if (!s) return null
  return (
    <span title={s.title}
      style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '.65rem', fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>
      {s.icon}
      {s.label}
    </span>
  )
}
