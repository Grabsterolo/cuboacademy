import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigation } from '../../context/NavigationContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import Sidebar from './Sidebar'

// Admin
import AdminDashboard from '../../pages/dashboard/AdminDashboard'
import UsersPage from '../../pages/dashboard/admin/UsersPage'
import CategoriesPage from '../../pages/dashboard/admin/CategoriesPage'
import CoursesPage from '../../pages/dashboard/admin/CoursesPage'
import CourseFormPage from '../../pages/dashboard/admin/CourseFormPage'
import CourseStructurePage from '../../pages/dashboard/admin/CourseStructurePage'
import OrdersPage from '../../pages/dashboard/admin/OrdersPage'
import CertificatesPage from '../../pages/dashboard/admin/CertificatesPage'
import ReportsPage from '../../pages/dashboard/admin/ReportsPage'
import SettingsPage from '../../pages/dashboard/admin/SettingsPage'
import RequestsPage from '../../pages/dashboard/admin/RequestsPage'
import AnnouncementsPage from '../../pages/dashboard/admin/AnnouncementsPage'

// Instructor
import InstructorDashboard from '../../pages/dashboard/InstructorDashboard'
import InstructorProfilePage from '../../pages/dashboard/instructor/InstructorProfilePage'
import InstructorCoursesPage from '../../pages/dashboard/instructor/InstructorCoursesPage'
import InstructorStudentsPage from '../../pages/dashboard/instructor/InstructorStudentsPage'
import InstructorEvaluationsPage from '../../pages/dashboard/instructor/InstructorEvaluationsPage'
import InstructorReportsPage from '../../pages/dashboard/instructor/InstructorReportsPage'
import InstructorEarningsPage from '../../pages/dashboard/instructor/InstructorEarningsPage'
import InstructorSettingsPage from '../../pages/dashboard/instructor/InstructorSettingsPage'
import InstructorAnnouncementsPage from '../../pages/dashboard/instructor/InstructorAnnouncementsPage'

// Student
import StudentDashboard from '../../pages/dashboard/StudentDashboard'
import StudentProfilePage from '../../pages/dashboard/student/StudentProfilePage'
import StudentCoursesPage from '../../pages/dashboard/student/StudentCoursesPage'
import StudentInstructorsPage from '../../pages/dashboard/student/StudentInstructorsPage'
import StudentAchievementsPage from '../../pages/dashboard/student/StudentAchievementsPage'
import StudentCertificatesPage from '../../pages/dashboard/student/StudentCertificatesPage'
import StudentStorePage from '../../pages/dashboard/student/StudentStorePage'
import StudentSettingsPage from '../../pages/dashboard/student/StudentSettingsPage'
import StudentAnnouncementsPage from '../../pages/dashboard/student/StudentAnnouncementsPage'


const ANIM_DURATION = 150

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
      case 'panel':         return <AdminDashboard />
      case 'solicitudes':   return <RequestsPage />
      case 'usuarios':      return <UsersPage />
      case 'cursos':        return <CoursesPage />
      case 'curso-form':    return <CourseFormPage />
      case 'curso-estructura': return <CourseStructurePage />
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
      case 'curso-form':    return <CourseFormPage />
      case 'curso-estructura': return <CourseStructurePage />
      case 'estudiantes':   return <InstructorStudentsPage />
      case 'evaluaciones':  return <InstructorEvaluationsPage />
      case 'comunicados':   return <InstructorAnnouncementsPage />
      case 'reportes':      return <InstructorReportsPage />
      case 'ganancias':     return <InstructorEarningsPage />
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
    case 'aprender':      return <Placeholder label="Reproductor de clases" />
    default:              return <Placeholder label={section} />
  }
}

export default function Portal() {
  const { profile, loading } = useAuth()
  const { section, params } = useNavigation()
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [visible, setVisible] = useState(true)
  const [displaySection, setDisplaySection] = useState(section)
  const [displayParams, setDisplayParams] = useState(params)
  const prevSection = useRef(section)

  // Section transition: fade out → swap → fade in
  useEffect(() => {
    if (section === prevSection.current) return
    setVisible(false)
    const t = setTimeout(() => {
      setDisplaySection(section)
      setDisplayParams(params)
      prevSection.current = section
      setVisible(true)
    }, ANIM_DURATION)
    return () => clearTimeout(t)
  }, [section, params])

  // Close drawer when switching to desktop
  useEffect(() => { if (!isMobile) setDrawerOpen(false) }, [isMobile])

  if (loading) return <LoadingSection />

  const role = profile?.role || 'student'

  return (
    <>
      <style>{`
        @keyframes sectionIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .portal-section-enter { animation: sectionIn ${ANIM_DURATION}ms ease forwards; }
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
                Cubo <span style={{ color: 'var(--jade)' }}>Academy</span>
              </div>
              <div style={{ width: 38 }} />
            </div>
          )}

          {/* Section content */}
          <div
            key={displaySection}
            className={visible ? 'portal-section-enter' : ''}
            style={{ flex: 1, opacity: visible ? 1 : 0, transition: `opacity ${ANIM_DURATION}ms ease` }}
          >
            {renderSection(displaySection, role, displayParams)}
          </div>
        </div>
      </div>
    </>
  )
}
