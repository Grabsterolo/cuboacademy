import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { NotificationProvider } from './context/NotificationContext'

import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import Portal from './components/portal/Portal'

// Public screens — lazy-loaded so the main bundle isn't paying for the
// landing/catalog/auth code on every visit (mirrors the Portal.jsx pattern)
const HomePage = lazy(() => import('./pages/public/HomePage'))
const LoginScreen = lazy(() => import('./pages/public/LoginScreen'))
const RegisterScreen = lazy(() => import('./pages/public/RegisterScreen'))
const ForgotPasswordScreen = lazy(() => import('./pages/public/ForgotPasswordScreen'))
const ResetPasswordScreen = lazy(() => import('./pages/public/ResetPasswordScreen'))
const InstructorApplicationPage = lazy(() => import('./pages/public/InstructorApplicationPage'))
const CourseCatalogPage = lazy(() => import('./pages/public/CourseCatalogPage'))
const CourseDetailPage = lazy(() => import('./pages/public/CourseDetailPage'))
const EventCatalogPage = lazy(() => import('./pages/public/EventCatalogPage'))
const EventDetailPage = lazy(() => import('./pages/public/EventDetailPage'))

function LoadingSection() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-2)', fontFamily: 'var(--sans)', fontSize: '.9rem', gap: '.5rem' }}>
      <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      Cargando…
    </div>
  )
}

function AppShell() {
  const { user, loading, passwordRecovery } = useAuth()
  const { screen, navigate, exitPortal } = useNavigation()

  // Sign-out (from anywhere) always kicks back to the landing page. Signing
  // in does NOT auto-enter the portal here — a session restored from storage
  // on a fresh page load should land on the public site, not jump straight
  // into the dashboard. Explicit logins still enter the portal via their own
  // effect in LoginScreen.jsx (fires only while that screen is mounted).
  useEffect(() => {
    if (loading) return
    if (!user && screen === 'portal') {
      exitPortal()
    }
  }, [user, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Landing back from a "reset password" email link opens a temporary
  // recovery session — route straight to the set-new-password screen
  // instead of treating it like a normal login into the dashboard.
  useEffect(() => {
    if (passwordRecovery) navigate('reset-password')
  }, [passwordRecovery]) // eslint-disable-line react-hooks/exhaustive-deps

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
  if (screen === 'login')           return <Suspense fallback={<LoadingSection />}><LoginScreen /></Suspense>
  if (screen === 'register')        return <Suspense fallback={<LoadingSection />}><RegisterScreen /></Suspense>
  if (screen === 'forgot-password') return <Suspense fallback={<LoadingSection />}><ForgotPasswordScreen /></Suspense>
  if (screen === 'reset-password')  return <Suspense fallback={<LoadingSection />}><ResetPasswordScreen /></Suspense>

  // Portal (authenticated shell)
  if (screen === 'portal') return <Portal />

  // Public screens with navbar
  const publicContent = (() => {
    switch (screen) {
      case 'courses':          return <CourseCatalogPage />
      case 'course-detail':    return <CourseDetailPage />
      case 'events':           return <EventCatalogPage />
      case 'event-detail':     return <EventDetailPage />
      case 'instructor-apply': return <InstructorApplicationPage />
      default:                 return <HomePage />
    }
  })()

  const hasFooter = screen === 'landing' || screen === 'courses' || screen === 'events'

  return (
    <div style={{ paddingTop: 66 }}>
      <Navbar />
      <Suspense fallback={<LoadingSection />}>{publicContent}</Suspense>
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
