/**
 * Contraste WCAG 2.1 para el color de acento configurable.
 *
 * El panel guardó una vez #369aa1, que sobrescribe --jade en tiempo de
 * ejecución: se quedaba en 3.34:1 sobre blanco y 3.09:1 sobre crema, por
 * debajo del mínimo AA de 4.5:1. Como --jade se usa para texto (enlaces,
 * precios, etiquetas) y no solo para rellenos, un valor así vuelve ilegible
 * medio sitio de golpe, y desde el selector no había manera de notarlo: el
 * cuadrito de color se ve bonito en cualquier tono.
 *
 * Los dos fondos son los reales de la app: --white y --cream.
 */

export const AA_MIN = 4.5

/** Fondos sobre los que se pinta texto en --jade. */
export const SURFACES = [
  { label: 'blanco', hex: '#FFFFFF' },
  { label: 'crema', hex: '#F8F6F1' },
]

export function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Luminancia relativa (WCAG 2.1, 1.4.3). */
export function luminance([r, g, b]) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/** Ratio entre dos colores hex, o null si alguno no es un hex válido. */
export function contrastRatio(a, b) {
  const ra = hexToRgb(a)
  const rb = hexToRgb(b)
  if (!ra || !rb) return null
  const la = luminance(ra)
  const lb = luminance(rb)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Evalúa un color de acento contra los fondos de la app.
 *
 * Devuelve `{ valid, results, passes, worst }`. `valid: false` significa que
 * el texto todavía no es un hex completo — mientras se teclea "#16" no hay
 * nada que juzgar, así que no se avisa de nada.
 */
export function evaluateAccent(hex) {
  const results = SURFACES.map(s => ({ ...s, ratio: contrastRatio(hex, s.hex) }))
  if (results.some(r => r.ratio === null)) {
    return { valid: false, results: [], passes: false, worst: null }
  }
  const worst = results.reduce((a, b) => (a.ratio <= b.ratio ? a : b))
  return { valid: true, results, passes: worst.ratio >= AA_MIN, worst }
}

export function formatRatio(ratio) {
  return `${ratio.toFixed(2)}:1`
}
