export const INP = { width: '100%', padding: '.7rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)', fontSize: '15px', fontFamily: 'var(--sans)', transition: 'border-color .2s, background .2s', boxSizing: 'border-box' }
export const SEL = { ...INP, cursor: 'pointer' }

export function fi(e) { e.target.style.borderColor = 'var(--jade)'; e.target.style.background = 'white' }
export function fb(e) { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)' }

// Shared bg/color/border per semantic tone, so the same underlying meaning
// (approved, pending review, rejected...) always renders in the same shade
// everywhere, even though each page keeps its own label text and key names.
export const STATUS_TONE = {
  success: { bg: 'var(--jade-soft)', color: 'var(--jade-dark)', border: '1px solid var(--jade-light)' },
  warning: { bg: '#FFFBEB', color: '#A16207', border: '1px solid #FDE68A' },
  danger:  { bg: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
  neutral: { bg: '#F5F5F0', color: 'var(--text-3)', border: '1px solid var(--border)' },
}
