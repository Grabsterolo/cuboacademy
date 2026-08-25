/**
 * Enlace «Saltar al contenido»: primer elemento enfocable de la página.
 *
 * Sin esto, quien navega con teclado tiene que atravesar la barra entera —y en
 * el portal, la lista completa de secciones— en cada pantalla antes de llegar
 * a lo que venía a leer.
 *
 * Va oculto fuera del viewport, no con display:none ni hidden: eso lo sacaría
 * del orden de tabulación y no lo alcanzaría nadie. Aparece al recibir el foco.
 *
 * El href no basta por sí solo. Un enlace a #id mueve el scroll pero deja el
 * foco donde estaba en la mayoría de navegadores, así que el destino lleva
 * tabIndex={-1} y aquí se le pasa el foco a mano.
 */
export function SkipLink({ target = 'contenido' }) {
  function handleClick(e) {
    e.preventDefault()
    const el = document.getElementById(target)
    if (!el) return
    el.focus({ preventScroll: true })
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <a href={`#${target}`} className="skip-link" onClick={handleClick}>
      Saltar al contenido
    </a>
  )
}
