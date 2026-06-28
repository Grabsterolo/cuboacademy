import { createContext, useContext, useState, useCallback } from 'react'

// Public screens (no auth)
const PUBLIC_SCREENS = new Set(['landing', 'login', 'register', 'courses', 'course-detail', 'instructor-apply'])

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const [screen, setScreen] = useState('landing')   // public screen
  const [section, setSection] = useState('panel')   // portal section
  const [params, setParams] = useState({})

  const navigate = useCallback((destination, newParams = {}) => {
    setParams(newParams)
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (PUBLIC_SCREENS.has(destination)) {
      setScreen(destination)
    } else {
      // portal section — switch to portal screen and set section
      setScreen('portal')
      setSection(destination)
    }
  }, [])

  // Called by AuthContext when user logs in → jump into portal
  const enterPortal = useCallback((defaultSection = 'panel') => {
    setSection(defaultSection)
    setScreen('portal')
    setParams({})
  }, [])

  // Called on logout → go back to landing
  const exitPortal = useCallback(() => {
    setScreen('landing')
    setSection('panel')
    setParams({})
  }, [])

  return (
    <NavigationContext.Provider value={{ screen, section, params, navigate, enterPortal, exitPortal }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) throw new Error('useNavigation must be inside NavigationProvider')
  return ctx
}
