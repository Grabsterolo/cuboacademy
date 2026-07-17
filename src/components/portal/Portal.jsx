import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import Sidebar from './Sidebar'

// Lazy-loaded per role so a student's bundle never has to fetch the
// instructor course wizard, admin pages, etc. (and vice versa).

// Admin
const GeneralPage = lazy(() => import('../../pages/dashboard/admin/GeneralPage'))
const UsersPage = lazy(() => import('../../pages/dashboard/admin/UsersPage'))
const CategoriesPage = lazy(() => import('../../pages/dashboard/admin/CategoriesPage'))
const CoursesPage = lazy(() => import('../../pages/dashboard/admin/CoursesPage'))
const CourseReviewPage = lazy(() => import('../../pages/dashboard/admin/CourseReviewPage'))
const OrdersPage = lazy(() => import('../../pages/dashboard/admin/OrdersPage'))
const CertificatesPage = lazy(() => import('../../pages/dashboard/admin/CertificatesPage'))
const ReportsPage = lazy(() => import('../../pages/dashboard/admin/ReportsPage'))
const SettingsPage = lazy(() => import('../../pages/dashboard/admin/SettingsPage'))
const RequestsPage = lazy(() => import('../../pages/dashboard/admin/RequestsPage'))
const AnnouncementsPage = lazy(() => import('../../pages/dashboard/admin/AnnouncementsPage'))

// Instructor
const CourseWizardPage = lazy(() => import('../../pages/dashboard/instructor/CourseWizardPage'))
const QuizGradingPage = lazy(() => import('../../pages/dashboard/instructor/QuizGradingPage'))
const InstructorDashboard = lazy(() => import('../../pages/dashboard/InstructorDashboard'))
const InstructorProfilePage = lazy(() => import('../../pages/dashboard/instructor/InstructorProfilePage'))
const InstructorCoursesPage = lazy(() => import('../../pages/dashboard/instructor/InstructorCoursesPage'))
const InstructorStudentsPage = lazy(() => import('../../pages/dashboard/instructor/InstructorStudentsPage'))
const InstructorEvaluationsPage = lazy(() => import('../../pages/dashboard/instructor/InstructorEvaluationsPage'))
const InstructorReportsPage = lazy(() => import('../../pages/dashboard/instructor/InstructorReportsPage'))
const InstructorSettingsPage = lazy(() => import('../../pages/dashboard/instructor/InstructorSettingsPage'))
const InstructorAnnouncementsPage = lazy(() => import('../../pages/dashboard/instructor/InstructorAnnouncementsPage'))

// Student
const StudentDashboard = lazy(() => import('../../pages/dashboard/StudentDashboard'))
const StudentProfilePage = lazy(() => import('../../pages/dashboard/student/StudentProfilePage'))
const StudentCoursesPage = lazy(() => import('../../pages/dashboard/student/StudentCoursesPage'))
const StudentInstructorsPage = lazy(() => import('../../pages/dashboard/student/StudentInstructorsPage'))
const StudentAchievementsPage = lazy(() => import('../../pages/dashboard/student/StudentAchievementsPage'))
const StudentCertificatesPage = lazy(() => import('../../pages/dashboard/student/StudentCertificatesPage'))
const StudentStorePage = lazy(() => import('../../pages/dashboard/student/StudentStorePage'))
const StudentSettingsPage = lazy(() => import('../../pages/dashboard/student/StudentSettingsPage'))
const StudentAnnouncementsPage = lazy(() => import('../../pages/dashboard/student/StudentAnnouncementsPage'))
const StudentLearningPage = lazy(() => import('../../pages/dashboard/student/StudentLearningPage'))
const CourseDetailPage = lazy(() => import('../../pages/dashboard/student/CourseDetailPage'))


function LoadingSection() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-2)', fontFamily: 'var(--sans)', fontSize: '.9rem', gap: '.5rem' }}>
      <div style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--jade)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      Cargando…
    </div>
  )
}

function Placeholder({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', gap: '1rem', color: 'var(--text-2)', fontFamily: 'var(--sans)' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--jade)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      <p style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--carbon)', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '.85rem', margin: 0 }}>Próximamente disponible</p>
    </div>
  )
}

function renderSection(section, role, params) {
  if (role === 'admin') {
    switch (section) {
      case 'panel':         return <GeneralPage />
      case 'solicitudes':   return <RequestsPage />
      case 'usuarios':      return <UsersPage />
      case 'cursos':        return <CoursesPage />
      case 'curso-wizard':    return <CourseWizardPage />
      case 'curso-revision':    return <CourseReviewPage />
      case 'quiz-calificacion': return <QuizGradingPage />
      case 'categorias':    return <CategoriesPage />
      case 'comunicados':   return <AnnouncementsPage />
      case 'pagos':         return <OrdersPage />
      case 'certificados':  return <CertificatesPage />
      case 'reportes':      return <ReportsPage />
      case 'configuracion': return <SettingsPage />
      default:              return <Placeholder label={section} />
    }
  }
  if (role === 'instructor') {
    switch (section) {
      case 'panel':         return <InstructorDashboard />
      case 'perfil':        return <InstructorProfilePage />
      case 'cursos':        return <InstructorCoursesPage />
      case 'curso-wizard':  return <CourseWizardPage />
      case 'estudiantes':   return <InstructorStudentsPage />
      case 'evaluaciones':      return <InstructorEvaluationsPage />
      case 'quiz-calificacion': return <QuizGradingPage />
      case 'comunicados':   return <InstructorAnnouncementsPage />
      case 'reportes':      return <InstructorReportsPage />
      case 'configuracion': return <InstructorSettingsPage />
      default:              return <Placeholder label={section} />
    }
  }
  // student
  switch (section) {
    case 'panel':         return <StudentDashboard />
    case 'perfil':        return <StudentProfilePage />
    case 'cursos':        return <StudentCoursesPage />
    case 'instructores':  return <StudentInstructorsPage />
    case 'comunicados':   return <StudentAnnouncementsPage />
    case 'logros':        return <StudentAchievementsPage />
    case 'certificados':  return <StudentCertificatesPage />
    case 'tienda':        return <StudentStorePage />
    case 'configuracion': return <StudentSettingsPage />
    case 'aprender':      return <StudentLearningPage />
    case 'curso-detalle': return <CourseDetailPage />
    default:              return <Placeholder label={section} />
  }
}

export default function Portal() {
  const { profile, loading } = useAuth()
  const { section, params } = useNavigation()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [displaySection, setDisplaySection] = useState(section)
  const [displayParams, setDisplayParams] = useState(params)
  const [overlay, setOverlay] = useState({ show: false, fading: false })
  const prevSection = useRef(section)

  // Section transition: instant overlay → swap content (loads behind it) → fade overlay out
  useEffect(() => {
    if (section === prevSection.current) return
    prevSection.current = section
    setDisplaySection(section)
    setDisplayParams(params)
    setOverlay({ show: true, fading: false })
    const t1 = setTimeout(() => setOverlay({ show: true, fading: true }), 280)
    const t2 = setTimeout(() => setOverlay({ show: false, fading: false }), 430)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [section, params])

  // Close drawer when switching to desktop
  useEffect(() => { if (!isMobile) setDrawerOpen(false) }, [isMobile])

  if (loading) return <LoadingSection />

  const role = profile?.role || 'student'

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
        <Sidebar drawerOpen={drawerOpen} onCloseDrawer={() => setDrawerOpen(false)} />

        {/* Main content */}
        <div style={{ flex: 1, marginLeft: isMobile ? 0 : 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile top bar */}
          {isMobile && (
            <div style={{ position: 'sticky', top: 0, zIndex: 100, height: 56, background: 'white', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
              <button onClick={() => setDrawerOpen(true)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 9px', cursor: 'pointer', color: 'var(--carbon)', display: 'flex', alignItems: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '.88rem', fontWeight: 700, color: 'var(--carbon)' }}>
                Cubo <span style={{ color: 'var(--jade)' }}>Campus</span>
              </div>
              <div style={{ width: 34 }} />
            </div>
          )}

          {/* Section content */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Suspense fallback={<LoadingSection />}>
              {renderSection(displaySection, role, displayParams)}
            </Suspense>
            {overlay.show && (
              <div style={{
                position: 'absolute', inset: 0, background: 'var(--cream)',
                opacity: overlay.fading ? 0 : 1,
                transition: overlay.fading ? 'opacity 150ms ease' : 'none',
                pointerEvents: 'none', zIndex: 5
              }} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
