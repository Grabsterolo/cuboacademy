import { useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { NotificationProvider } from './context/NotificationContext'

import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import Portal from './components/portal/Portal'

// Public screens
import HomePage from './pages/public/HomePage'
import LoginScreen from './pages/public/LoginScreen'
import RegisterScreen from './pages/public/RegisterScreen'
import InstructorApplicationPage from './pages/public/InstructorApplicationPage'
import CourseCatalogPage from './pages/public/CourseCatalogPage'
import CourseDetailPage from './pages/public/CourseDetailPage'

function AppShell() {
  const { user, loading } = useAuth()
  const { screen, enterPortal, exitPortal } = useNavigation()

  // Sync auth state → navigation
  useEffect(() => {
    if (loading) return
    if (user && screen !== 'portal') {
      enterPortal('panel')
    } else if (!user && screen === 'portal') {
      exitPortal()
    }
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--cream)', fontFamily: 'var(--sans)', color: 'var(--text-2)', fontSize: '.9rem', gap: '.5rem' }}>
        <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Cargando…
      </div>
    )
  }

  // Fullscreen auth screens (no navbar)
  if (screen === 'login')    return <LoginScreen />
  if (screen === 'register') return <RegisterScreen />

  // Portal (authenticated shell)
  if (screen === 'portal') return <Portal />

  // Public screens with navbar
  const publicContent = (() => {
    switch (screen) {
      case 'courses':          return <CourseCatalogPage />
      case 'course-detail':    return <CourseDetailPage />
      case 'instructor-apply': return <InstructorApplicationPage />
      default:                 return <HomePage />
    }
  })()

  const hasFooter = screen === 'landing' || screen === 'courses'

  return (
    <div style={{ paddingTop: 66 }}>
      <Navbar />
      {publicContent}
      {hasFooter && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <NavigationProvider>
      <SettingsProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppShell />
          </NotificationProvider>
        </AuthProvider>
      </SettingsProvider>
    </NavigationProvider>
  )
}
