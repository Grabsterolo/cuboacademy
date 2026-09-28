import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// Public screens (no auth)
const PUBLIC_SCREENS = new Set(['landing', 'login', 'register', 'courses', 'course-detail', 'events', 'event-detail', 'instructor-apply', 'forgot-password', 'reset-password',
  'terminos', 'privacidad', 'reembolsos'])

const NavigationContext = createContext(null)

const INICIAL = { screen: 'landing', section: 'panel', params: {} }

/**
 * La navegación vive en el estado de React, no en la URL. A cambio, cada
 * cambio de pantalla deja su entrada en el historial del navegador: sin eso,
 * la primera vez que alguien da «atrás» se sale del sitio —a la pestaña en
 * blanco de la que vino, si llegó escribiendo la dirección—, porque la app
 * nunca había creado ninguna entrada a la que volver.
 *
 * Lo que el historial guarda es la vista entera (pantalla, sección y
 * parámetros) en `history.state`, así que volver atrás repone también de qué
 * curso o evento se trataba. Lo que NO cambia es la dirección: sigue siendo
 * la raíz en todas las pantallas, de modo que recargar devuelve a la portada
 * y las fichas no se pueden compartir por enlace. Eso es harina de otro
 * costal —hacen falta rutas de verdad y que el servidor las sirva todas—.
 */
function destinoAVista(destination, params, seccionActual) {
  return PUBLIC_SCREENS.has(destination)
    ? { screen: destination, section: seccionActual, params }
    : { screen: 'portal', section: destination, params }
}

function mismaVista(a, b) {
  if (a.screen !== b.screen || a.section !== b.section) return false
  const clavesA = Object.keys(a.params || {})
  const clavesB = Object.keys(b.params || {})
  return clavesA.length === clavesB.length && clavesA.every(k => a.params[k] === b.params[k])
}

export function NavigationProvider({ children }) {
  const [vista, setVista] = useState(INICIAL)

  // La entrada con la que se abrió la página no lleva estado nuestro. Si no se
  // lo ponemos, al regresar a ella `event.state` llega vacío y no habría a
  // dónde volver.
  useEffect(() => {
    if (!window.history.state?.cuboVista) {
      window.history.replaceState({ cuboVista: INICIAL }, '')
    }
  }, [])

  useEffect(() => {
    function alVolver(e) {
      setVista(e.state?.cuboVista || INICIAL)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    window.addEventListener('popstate', alVolver)
    return () => window.removeEventListener('popstate', alVolver)
  }, [])

  const navigate = useCallback((destination, newParams = {}) => {
    const siguiente = destinoAVista(destination, newParams, vista.section)
    // Repetir destino —pulsar «Eventos» estando ya en eventos— reemplaza en
    // vez de apilar. Si no, se acumulan entradas idénticas y «atrás» parece
    // no hacer nada las primeras veces.
    if (mismaVista(siguiente, vista)) {
      window.history.replaceState({ cuboVista: siguiente }, '')
    } else {
      window.history.pushState({ cuboVista: siguiente }, '')
    }
    setVista(siguiente)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [vista])

  // Called by AuthContext when user logs in → jump into portal
  const enterPortal = useCallback((defaultSection = 'panel') => {
    const siguiente = { screen: 'portal', section: defaultSection, params: {} }
    window.history.pushState({ cuboVista: siguiente }, '')
    setVista(siguiente)
  }, [])

  // Called on logout → go back to landing.
  // Reemplaza en lugar de apilar: tras cerrar sesión, «atrás» no debe ofrecer
  // un camino de vuelta al panel.
  const exitPortal = useCallback(() => {
    window.history.replaceState({ cuboVista: INICIAL }, '')
    setVista(INICIAL)
  }, [])

  return (
    <NavigationContext.Provider value={{ ...vista, navigate, enterPortal, exitPortal }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be inside NavigationProvider')
  return ctx
}
