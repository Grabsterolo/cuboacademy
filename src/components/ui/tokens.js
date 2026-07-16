export const INP = { width: '100%', padding: '.7rem .95rem', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--carbon)', fontSize: '15px', outline: 'none', fontFamily: 'var(--sans)', transition: 'border-color .2s, background .2s', boxSizing: 'border-box' }
export const SEL = { ...INP, cursor: 'pointer' }

export function fi(e) { e.target.style.borderColor = 'var(--jade)'; e.target.style.background = 'white' }
export function fb(e) { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--cream)' }
