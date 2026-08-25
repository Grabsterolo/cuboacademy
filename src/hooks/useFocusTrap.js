import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Atrapa el foco dentro de un cajón mientras está abierto y lo devuelve al
 * cerrarse.
 *
 * Sin esto, tabular dentro del menú móvil se sale por detrás y sigue por los
 * enlaces de la página que hay debajo: el usuario de teclado acaba moviéndose
 * por contenido que no puede ver, tapado por el cajón. Y al cerrar, el foco se
 * pierde en el <body>, de donde el siguiente tabulador arranca desde el
 * principio de la página.
 *
 * Devuelve la ref que hay que poner en el contenedor del cajón.
 */
export function useFocusTrap(active, onEscape) {
  const ref = useRef(null)
  const previousFocus = useRef(null)

  useEffect(() => {
    if (!active) return

    // Se recuerda quién tenía el foco ANTES de abrir, para devolvérselo.
    previousFocus.current = document.activeElement

    const node = ref.current
    if (!node) return

    const items = () => [...node.querySelectorAll(FOCUSABLE)]
      .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement)

    // El primer elemento del cajón recibe el foco al abrir; si no, el usuario
    // abre el menú y su foco se queda fuera, sin nada que indique que pasó algo.
    const first = items()[0]
    if (first) first.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') { onEscape?.(); return }
      if (e.key !== 'Tab') return
      const list = items()
      if (!list.length) return
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault(); lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault(); firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      const back = previousFocus.current
      // Solo se devuelve si el elemento sigue en el documento; si el cajón se
      // cerró navegando a otra pantalla, ya no existe y forzarlo daría error.
      if (back && document.contains(back)) back.focus()
    }
  }, [active, onEscape])

  return ref
}
