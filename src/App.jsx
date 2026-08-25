import { useEffect, lazy, Suspense } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { NavigationProvider, useNavigation } from './context/NavigationContext'
import { NotificationProvider } from './context/NotificationContext'

import Navbar from './components/shared/Navbar'
import Footer from './components/shared/Footer'
import { SkipLink } from './components/shared/SkipLink'
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
const LegalPage = lazy(() => import('./pages/public/LegalPage'))
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

/**
 * Envoltorio de las cuatro pantallas de acceso, que son de página completa y
 * no pasan por el layout público.
 *
 * Llevan el enlace de salto igual que el resto por coherencia: aquí no hay
 * barra de navegación que evitar, así que salta poco, pero quien navega con
 * teclado no tiene por qué descubrir en cada pantalla si el primer Tab le da
 * un salto o no.
 */
function AuthScreen({ children }) {
  return (
    <>
      <SkipLink />
      <main id="contenido" tabIndex={-1}>
        <Suspense fallback={<LoadingSection />}>{children}</Suspense>
      </main>
    </>
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
  if (screen === 'login')           return <AuthScreen><LoginScreen /></AuthScreen>
  if (screen === 'register')        return <AuthScreen><RegisterScreen /></AuthScreen>
  if (screen === 'forgot-password') return <AuthScreen><ForgotPasswordScreen /></AuthScreen>
  if (screen === 'reset-password')  return <AuthScreen><ResetPasswordScreen /></AuthScreen>

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
      case 'terminos':
      case 'privacidad':
      case 'reembolsos':       return <LegalPage />
      default:                 return <HomePage />
    }
  })()

  return (
    <div style={{ paddingTop: 66 }}>
      <SkipLink />
      {/* El <header> envuelve la barra, que ya trae su propio <nav> dentro. */}
      <header>
        <Navbar />
      </header>
      {/* tabIndex -1 para que el salto pueda posar el foco aquí; sin eso el
          navegador mueve el scroll pero deja el foco en el enlace, y el
          siguiente tabulador vuelve al principio de la barra. */}
      <main id="contenido" tabIndex={-1}>
        <Suspense fallback={<LoadingSection />}>{publicContent}</Suspense>
      </main>
      {/* El pie va en TODA pantalla pública. Antes solo aparecía en la portada
          y los dos catálogos, así que las fichas de curso y evento —donde se
          decide gastar el dinero— no tenían contacto, condiciones ni política
          de reembolso a la vista. */}
      <Footer />
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
